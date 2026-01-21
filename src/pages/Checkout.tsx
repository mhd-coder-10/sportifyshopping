import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/formatPrice';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, CreditCard, Truck, ChevronLeft, Package } from 'lucide-react';
import Header from '@/components/Header';
import { useCategories } from '@/hooks/useProducts';
import { handlePhoneInput } from '@/lib/validation';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required').max(100),
  phone: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10, {
      message: 'Phone number must be exactly 10 digits',
    }),
  address: z.string().min(5, 'Address is required').max(200),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  postalCode: z.string().min(4, 'Postal code is required').max(10),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cartItems, clearCart, cartCount } = useCart();
  const { data: categories } = useCategories();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'online'>('cash_on_delivery');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [postalCode, setPostalCode] = useState(profile?.postal_code || '');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setErrors({});
    
    try {
      addressSchema.parse({ fullName, phone, address, city, state, postalCode });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Calculate estimated delivery (5-7 days from now)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5 + Math.floor(Math.random() * 3));

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'confirmed',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
          total_amount: total,
          currency: 'INR',
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_postal_code: postalCode,
          shipping_country: 'India',
          tracking_number: `TRK${Date.now()}`,
          estimated_delivery: estimatedDelivery.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        currency: 'INR'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      clearCart();

      toast.success('Order placed successfully!');
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to checkout</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => {}} categories={categories} />
      
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>CHECKOUT</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digit number"
                    value={phone}
                    onChange={(e) => setPhone(handlePhoneInput(e.target.value))}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No, Street, Area"
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={errors.state ? 'border-destructive' : ''}
                  />
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={errors.postalCode ? 'border-destructive' : ''}
                  />
                  {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary">
                    <RadioGroupItem value="cash_on_delivery" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <span className="font-medium">Cash on Delivery</span>
                      <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:border-primary opacity-50">
                    <RadioGroupItem value="online" id="online" disabled />
                    <Label htmlFor="online" className="flex-1">
                      <span className="font-medium">Online Payment</span>
                      <p className="text-sm text-muted-foreground">Coming soon - Cards, UPI, Net Banking</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right - Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <img
                        src={item.imageUrl || '/placeholder.svg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">Free shipping on orders above {formatPrice(2000)}</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button
                  className="w-full h-12 text-lg bg-gradient-accent border-0"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Place Order
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;