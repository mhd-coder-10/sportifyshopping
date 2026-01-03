import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import { useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const orderStatusSteps = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: categories } = useCategories();
  const { cartCount } = useCart();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('order_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    return orderStatusSteps.findIndex(step => step.key === order.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-destructive';
      case 'shipped':
      case 'out_for_delivery': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view orders</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Button onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
      
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          All Orders
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              ORDER #{order.tracking_number}
            </h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.created_at), 'PPP')}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Tracking */}
            {order.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                    <div 
                      className="absolute top-5 left-5 h-0.5 bg-primary transition-all"
                      style={{ width: `${(currentStep / (orderStatusSteps.length - 1)) * 100}%` }}
                    />
                    
                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {orderStatusSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center z-10
                              ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-background border-2 border-border text-muted-foreground'}
                              ${isCurrent ? 'ring-4 ring-primary/30' : ''}
                            `}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`mt-2 text-xs text-center ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {order.estimated_delivery && (
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Estimated Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.estimated_delivery), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-secondary/30 rounded-lg">
                    <img
                      src={item.products?.image_url || '/placeholder.svg'}
                      alt={item.products?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.products?.name}</h3>
                      {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                      {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="text-sm">
                    <p>{order.shipping_address}</p>
                    <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
                    <p>{order.shipping_country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize">{order.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {order.payment_status.toUpperCase()}
                  </Badge>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;