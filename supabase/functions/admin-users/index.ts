import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the user's token to verify they're admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Client to verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client for user management
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET: List all users
    if (req.method === 'GET' && action === 'list') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const perPage = parseInt(url.searchParams.get('per_page') || '50')

      const { data: { users }, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get profiles for additional info
      const userIds = users.map(u => u.id)
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      // Get roles
      const { data: roles } = await adminClient
        .from('user_roles')
        .select('*')
        .in('user_id', userIds)

      // Merge data
      const usersWithProfiles = users.map(u => ({
        ...u,
        profile: profiles?.find(p => p.user_id === u.id) || null,
        roles: roles?.filter(r => r.user_id === u.id).map(r => r.role) || []
      }))

      return new Response(
        JSON.stringify({ users: usersWithProfiles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Update user
    if (req.method === 'POST' && action === 'update') {
      const body = await req.json()
      const { userId, email, password, userData, profileData } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update auth user if email or password provided
      if (email || password || userData) {
        const updateData: Record<string, unknown> = {}
        if (email) updateData.email = email
        if (password) updateData.password = password
        if (userData) updateData.user_metadata = userData

        const { error } = await adminClient.auth.admin.updateUserById(userId, updateData)
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Update profile if profileData provided
      if (profileData) {
        const { error } = await adminClient
          .from('profiles')
          .update(profileData)
          .eq('user_id', userId)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Delete user
    if (req.method === 'POST' && action === 'delete') {
      const body = await req.json()
      const { userId } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Don't allow deleting yourself
      if (userId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Toggle admin role
    if (req.method === 'POST' && action === 'toggle-admin') {
      const body = await req.json()
      const { userId, makeAdmin } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Don't allow removing your own admin role
      if (userId === user.id && !makeAdmin) {
        return new Response(
          JSON.stringify({ error: 'Cannot remove your own admin role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (makeAdmin) {
        // Check if already admin
        const { data: existing } = await adminClient
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle()

        if (!existing) {
          const { error } = await adminClient
            .from('user_roles')
            .insert({ user_id: userId, role: 'admin' })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } else {
        const { error } = await adminClient
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin')

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
