import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Trash2, Loader2, Mail, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusOptions = ['unread', 'read', 'replied', 'resolved'];

const AdminMessages = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      
      const { error } = await supabase
        .from('contact_messages')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Message updated!');
    },
    onError: (error) => {
      toast.error('Error updating message: ' + error.message);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Message deleted!');
      setIsDetailOpen(false);
    },
    onError: (error) => {
      toast.error('Error deleting message: ' + error.message);
    },
  });

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.admin_notes || '');
    setIsDetailOpen(true);
    
    // Mark as read if unread
    if (message.status === 'unread') {
      updateMessageMutation.mutate({ id: message.id, status: 'read' });
    }
  };

  const handleSaveNotes = () => {
    if (selectedMessage) {
      updateMessageMutation.mutate({ id: selectedMessage.id, admin_notes: adminNotes });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-500/20 text-red-400';
      case 'read': return 'bg-yellow-500/20 text-yellow-400';
      case 'replied': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const unreadCount = messages?.filter(m => m.status === 'unread').length || 0;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-slate-400">Manage customer inquiries</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages && messages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">From</TableHead>
                    <TableHead className="text-slate-300">Subject</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow 
                      key={message.id} 
                      className={`border-slate-700 hover:bg-slate-700/50 cursor-pointer ${
                        message.status === 'unread' ? 'bg-slate-750' : ''
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <TableCell>
                        <div>
                          <p className={`font-medium ${message.status === 'unread' ? 'text-white' : 'text-slate-300'}`}>
                            {message.name}
                          </p>
                          <p className="text-sm text-slate-400">{message.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className={message.status === 'unread' ? 'text-white font-medium' : 'text-slate-300'}>
                        {message.subject || 'No subject'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                          <Select
                            value={message.status}
                            onValueChange={(value) => {
                              updateMessageMutation.mutate({ id: message.id, status: value });
                            }}
                          >
                            <SelectTrigger 
                              className={`w-28 h-8 text-xs ${getStatusColor(message.status)} border-0`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent 
                              onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMessage(message);
                            }}
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this message?')) {
                                deleteMessageMutation.mutate(message.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Mail className="h-12 w-12 mb-4" />
                <p>No messages yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Message Details</span>
                {selectedMessage && (
                  <Badge className={getStatusColor(selectedMessage.status)}>
                    {selectedMessage.status}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">From</p>
                      <p className="text-white font-medium">{selectedMessage.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <a 
                        href={`mailto:${selectedMessage.email}`} 
                        className="text-primary hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Received</p>
                      <p className="text-white">{format(new Date(selectedMessage.created_at), 'PPpp')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Subject</p>
                  <p className="text-white font-medium">{selectedMessage.subject || 'No subject'}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Message</p>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this inquiry..."
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                  <Button 
                    className="mt-2" 
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={updateMessageMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-700">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this message?')) {
                        deleteMessageMutation.mutate(selectedMessage.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <a href={`mailto:${selectedMessage.email}`}>
                    <Button>
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;