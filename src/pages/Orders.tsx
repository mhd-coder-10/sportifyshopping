import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import { useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ChevronLeft, Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { cartCount } = useCart();

  const { data: orders, isLoading } = useQuery({
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

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
      
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>MY ORDERS</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">Order #{order.tracking_number}</h3>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_city}, {order.shipping_state}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold text-lg">{formatPrice(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {order.payment_method.replace('_', ' ')}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/')}>Shop Now</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;