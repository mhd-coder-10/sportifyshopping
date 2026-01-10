-- Add user_id column to contact_messages (nullable for guest messages)
ALTER TABLE public.contact_messages 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;

-- Create new RLS policies

-- Anyone can create contact messages (with or without user_id)
CREATE POLICY "Anyone can create contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own messages (if they have a user_id)
CREATE POLICY "Users can view their own messages" 
ON public.contact_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all contact messages
CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Only admins can update contact messages (for changing status)
CREATE POLICY "Admins can update contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Only admins can delete contact messages
CREATE POLICY "Admins can delete contact messages" 
ON public.contact_messages 
FOR DELETE 
USING (is_admin(auth.uid()));