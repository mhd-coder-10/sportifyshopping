import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Edit, Trash2, Shield, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { validatePhone, handlePhoneInput } from '@/lib/validation';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: UserProfile | null;
  roles: string[];
}

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-users', {
        body: null,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle the function invoke response properly
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const data = await res.json();
      return data.users as AdminUser[];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      email?: string;
      password?: string;
      profileData?: Partial<UserProfile>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update`);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=delete`);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=toggle-admin`);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, makeAdmin }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update admin role');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Admin role updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      password: '',
      full_name: user.profile?.full_name || '',
      phone: user.profile?.phone || '',
      address: user.profile?.address || '',
      city: user.profile?.city || '',
      state: user.profile?.state || '',
      postal_code: user.profile?.postal_code || '',
      country: user.profile?.country || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;

    // Validate phone number if provided
    if (editForm.phone) {
      const phoneError = validatePhone(editForm.phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }

    const updateData: {
      userId: string;
      email?: string;
      password?: string;
      profileData?: Record<string, string>;
    } = { userId: editingUser.id };

    if (editForm.email !== editingUser.email) {
      updateData.email = editForm.email;
    }

    if (editForm.password) {
      updateData.password = editForm.password;
    }

    const profileData: Record<string, string> = {};
    if (editForm.full_name !== (editingUser.profile?.full_name || '')) {
      profileData.full_name = editForm.full_name;
    }
    if (editForm.phone !== (editingUser.profile?.phone || '')) {
      profileData.phone = editForm.phone;
    }
    if (editForm.address !== (editingUser.profile?.address || '')) {
      profileData.address = editForm.address;
    }
    if (editForm.city !== (editingUser.profile?.city || '')) {
      profileData.city = editForm.city;
    }
    if (editForm.state !== (editingUser.profile?.state || '')) {
      profileData.state = editForm.state;
    }
    if (editForm.postal_code !== (editingUser.profile?.postal_code || '')) {
      profileData.postal_code = editForm.postal_code;
    }
    if (editForm.country !== (editingUser.profile?.country || '')) {
      profileData.country = editForm.country;
    }

    if (Object.keys(profileData).length > 0) {
      updateData.profileData = profileData;
    }

    updateUserMutation.mutate(updateData);
  };

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-slate-400">Manage all registered users</p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Users Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Joined</TableHead>
                  <TableHead className="text-slate-300">Last Sign In</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {user.profile?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.email}
                        {user.email_confirmed_at ? (
                          <Badge variant="outline" className="ml-2 text-green-400 border-green-400">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-400">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.roles.includes('admin')}
                            onCheckedChange={(checked) => 
                              toggleAdminMutation.mutate({ userId: user.id, makeAdmin: checked })
                            }
                          />
                          {user.roles.includes('admin') ? (
                            <Badge className="bg-purple-500">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.last_sign_in_at 
                          ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user information and credentials
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password (leave empty to keep current)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="bg-slate-900 border-slate-600"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit number"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: handlePhoneInput(e.target.value) })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={editForm.postal_code}
                onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={editForm.country}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                className="bg-slate-900 border-slate-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete <strong>{deleteUser?.email}</strong>? This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
