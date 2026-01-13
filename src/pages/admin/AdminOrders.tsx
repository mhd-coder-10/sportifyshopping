import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'] as const;
type PaymentStatus = typeof paymentStatusOptions[number];

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, image_url)')
        .eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated!');
    },
    onError: (error) => {
      toast.error('Error updating status: ' + error.message);
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: PaymentStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Payment status updated!');
    },
    onError: (error) => {
      toast.error('Error updating payment status: ' + error.message);
    },
  });

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'shipped': return 'bg-blue-500/20 text-blue-400';
      case 'out_for_delivery': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-slate-400">Manage customer orders</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Order ID</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Customer</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Payment Method</TableHead>
                    <TableHead className="text-slate-300">Payment Status</TableHead>
                    <TableHead className="text-slate-300">Order Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {order.shipping_city}, {order.shipping_state}
                      </TableCell>
                      <TableCell className="text-white">
                        ₹{Number(order.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.payment_method === 'online' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {order.payment_method === 'online' ? 'Online' : 'COD'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.payment_status || 'pending'}
                          onValueChange={(value: PaymentStatus) => 
                            updatePaymentStatusMutation.mutate({ orderId: order.id, paymentStatus: value })
                          }
                        >
                          <SelectTrigger className={`w-28 h-8 text-xs ${getPaymentStatusColor(order.payment_status)} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 z-50">
                            {paymentStatusOptions.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value: OrderStatus) => 
                            updateStatusMutation.mutate({ orderId: order.id, status: value })
                          }
                        >
                          <SelectTrigger className={`w-36 h-8 text-xs ${getStatusColor(order.status)} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 z-50">
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white capitalize">
                                {status.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                          <Eye className="h-4 w-4 text-slate-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-slate-400 mb-1">Shipping Address</h4>
                    <p className="text-white">
                      {selectedOrder.shipping_address}<br />
                      {selectedOrder.shipping_city}, {selectedOrder.shipping_state}<br />
                      {selectedOrder.shipping_postal_code}, {selectedOrder.shipping_country}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-400 mb-1">Order Details</h4>
                    <div className="text-white space-y-1">
                      <p>
                        Order Status: <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </p>
                      <p>
                        Payment Status: <span className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                          {selectedOrder.payment_status || 'pending'}
                        </span>
                      </p>
                      <p>Payment Method: {selectedOrder.payment_method === 'online' ? 'Online' : 'Cash on Delivery'}</p>
                      <p>Total: ₹{Number(selectedOrder.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-slate-400 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {orderItems?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        {item.products?.image_url && (
                          <img 
                            src={item.products.image_url} 
                            alt={item.products?.name} 
                            className="w-12 h-12 rounded object-cover" 
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.products?.name}</p>
                          <p className="text-sm text-slate-400">
                            Qty: {item.quantity} × ₹{item.price_at_purchase}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • Color: ${item.color}`}
                          </p>
                        </div>
                        <p className="text-white font-medium">
                          ₹{(item.quantity * item.price_at_purchase).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
