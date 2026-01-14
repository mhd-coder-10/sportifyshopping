import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  User, 
  Package, 
  MessageSquare, 
  Mail, 
  Loader2, 
  Eye, 
  Clock, 
  ChevronRight,
  Save,
  Pencil,
  Trash2 
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { formatPrice } from "@/lib/formatPrice";
import { validatePhone, handlePhoneInput } from "@/lib/validation";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ subject: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  
  const defaultTab = searchParams.get('tab') || 'profile';

  const { data: categories } = useCategories();
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();

  // Initialize profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "",
      });
    }
  }, [profile]);

  // Fetch user messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['my-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
    enabled: !!user,
  });

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time subscription for message status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate and refetch messages
          queryClient.invalidateQueries({ queryKey: ['my-messages', user.id] });
          
          // Show toast notification for status change
          const newStatus = payload.new.status;
          toast.info(`Message status updated to: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
          
          // Update selected message if it's the one being viewed
          if (selectedMessage && selectedMessage.id === payload.new.id) {
            setSelectedMessage(payload.new as ContactMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, selectedMessage]);

  const handleSaveProfile = async () => {
    // Validate phone number if provided
    if (profileForm.phone) {
      const phoneError = validatePhone(profileForm.phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }

    setIsSaving(true);
    const { error } = await updateProfile(profileForm);
    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-muted text-muted-foreground';
      case 'read': return 'bg-yellow-500/20 text-yellow-600';
      case 'replied': return 'bg-blue-500/20 text-blue-600';
      case 'resolved': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-destructive';
      case 'shipped':
      case 'out_for_delivery': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  const handleEditMessage = (message: ContactMessage) => {
    setEditForm({ subject: message.subject || '', message: message.message });
    setIsEditMode(true);
  };

  const handleSaveMessage = async () => {
    if (!selectedMessage) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('contact_messages')
      .update({
        subject: editForm.subject || null,
        message: editForm.message,
      })
      .eq('id', selectedMessage.id);
    
    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to update message");
    } else {
      toast.success("Message updated successfully");
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['my-messages', user?.id] });
      setSelectedMessage({ ...selectedMessage, subject: editForm.subject || null, message: editForm.message });
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageToDelete.id);
    
    setIsDeleting(false);
    
    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted successfully");
      setMessageToDelete(null);
      setIsDetailOpen(false);
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ['my-messages', user?.id] });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your account.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />

      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            MY ACCOUNT
          </h1>
          <p className="text-muted-foreground mb-8">
            Manage your profile, orders, and messages
          </p>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
                {orders && orders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                {messages && messages.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{messages.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ''} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10 digit number"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: handlePhoneInput(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileForm.country}
                        onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={profileForm.postal_code}
                        onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>View your order history and track deliveries</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold">Order #{order.tracking_number}</h3>
                              <Badge className={`${getOrderStatusColor(order.status)} text-white`}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')} • {order.shipping_city}, {order.shipping_state}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="font-bold">{formatPrice(order.total_amount)}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {order.payment_method.replace('_', ' ')}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mb-4" />
                      <p className="mb-4">No orders yet</p>
                      <Button onClick={() => navigate('/')}>Start Shopping</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>My Messages</CardTitle>
                  <CardDescription>View your contact inquiries and their status</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages.map((message) => (
                          <TableRow 
                            key={message.id} 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedMessage(message);
                              setIsDetailOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">
                              {message.subject || 'No subject'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(message.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getMessageStatusColor(message.status)}>
                                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessage(message);
                                    setIsEditMode(false);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessage(message);
                                    handleEditMessage(message);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessageToDelete(message);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Mail className="h-12 w-12 mb-4" />
                      <p className="mb-4">You haven't sent any messages yet</p>
                      <Button onClick={() => navigate('/contact')}>Contact Us</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditMode ? 'Edit Message' : 'Message Details'}</span>
              {selectedMessage && (
                <Badge className={getMessageStatusColor(selectedMessage.status)}>
                  {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p>{format(new Date(selectedMessage.created_at), 'PPpp')}</p>
                  </div>
                </div>
              </div>

              {isEditMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-subject">Subject</Label>
                    <Input
                      id="edit-subject"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      placeholder="Enter subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-message">Message</Label>
                    <Textarea
                      id="edit-message"
                      value={editForm.message}
                      onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                      rows={5}
                      placeholder="Enter your message"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveMessage} disabled={isSaving || !editForm.message.trim()}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Subject</p>
                    <p className="font-medium">{selectedMessage.subject || 'No subject'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Your Message</p>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getMessageStatusColor(selectedMessage.status)}>
                        {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedMessage.status === 'unread' && '- Awaiting review'}
                        {selectedMessage.status === 'read' && '- Being reviewed'}
                        {selectedMessage.status === 'replied' && '- We have responded'}
                        {selectedMessage.status === 'resolved' && '- Issue resolved'}
                      </span>
                    </div>
                    {selectedMessage.updated_at !== selectedMessage.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last updated: {format(new Date(selectedMessage.updated_at), 'PPpp')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleEditMessage(selectedMessage)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setMessageToDelete(selectedMessage)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMessage} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
    </div>
  );
};

export default Account;
