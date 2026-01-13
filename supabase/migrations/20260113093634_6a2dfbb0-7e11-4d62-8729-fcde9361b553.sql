-- Add policy for users to update their own messages
CREATE POLICY "Users can update their own messages" 
ON public.contact_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.contact_messages 
FOR DELETE 
USING (auth.uid() = user_id);