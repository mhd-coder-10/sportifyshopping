import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Mail, Loader2, Eye, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

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

const MyMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: categories } = useCategories();
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();

  const { data: messages, isLoading } = useQuery({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-muted text-muted-foreground';
      case 'read': return 'bg-yellow-500/20 text-yellow-600';
      case 'replied': return 'bg-blue-500/20 text-blue-600';
      case 'resolved': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your messages.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            MY MESSAGES
          </h1>
          <p className="text-muted-foreground mb-8">
            View your contact inquiries and their status
          </p>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
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
                          <Badge className={getStatusColor(message.status)}>
                            {getStatusLabel(message.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessage(message);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Mail className="h-12 w-12 mb-4" />
                  <p className="mb-4">You haven't sent any messages yet</p>
                  <Button onClick={() => navigate('/contact')}>Contact Us</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Message Details</span>
              {selectedMessage && (
                <Badge className={getStatusColor(selectedMessage.status)}>
                  {getStatusLabel(selectedMessage.status)}
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
                  <Badge className={getStatusColor(selectedMessage.status)}>
                    {getStatusLabel(selectedMessage.status)}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

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

export default MyMessages;