-- Enable realtime for contact_messages to allow users to see status updates
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;