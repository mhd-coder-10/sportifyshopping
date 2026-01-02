import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Truck, Clock, Globe, Package, CheckCircle } from "lucide-react";

const shippingMethods = [
  {
    name: "Standard Shipping",
    time: "5-7 Business Days",
    price: "$4.99",
    freeOver: "Free over $100",
    icon: Package,
  },
  {
    name: "Express Shipping",
    time: "2-3 Business Days",
    price: "$12.99",
    freeOver: "Free over $200",
    icon: Truck,
  },
  {
    name: "Same Day Delivery",
    time: "Same Day",
    price: "$24.99",
    freeOver: "Select cities only",
    icon: Clock,
  },
  {
    name: "International Shipping",
    time: "7-14 Business Days",
    price: "From $19.99",
    freeOver: "Rates vary by location",
    icon: Globe,
  },
];

const Shipping = () => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: categories } = useCategories();
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              SHIPPING INFORMATION
            </h1>
            <p className="text-muted-foreground text-lg">
              Fast, reliable shipping to your doorstep.
            </p>
          </div>

          {/* Shipping Methods */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {shippingMethods.map((method, index) => (
              <div key={index} className="bg-card rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{method.name}</h3>
                    <p className="text-primary font-semibold">{method.time}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{method.price}</span>
                      <span className="text-sm text-muted-foreground">{method.freeOver}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Features */}
          <div className="bg-card rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-2xl font-bold mb-6">Why Ship With Us?</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "Real-time package tracking",
                "Signature confirmation available",
                "Insurance on all packages",
                "Eco-friendly packaging",
                "Discreet packaging option",
                "Multiple delivery attempts",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Policies */}
          <div className="bg-card rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-2xl font-bold mb-6">Shipping Policies</h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Order Processing</h3>
                <p>Orders placed before 2 PM EST on business days are processed the same day. Orders placed after 2 PM or on weekends/holidays will be processed the next business day.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Delivery Estimates</h3>
                <p>Delivery times are estimates and begin from the ship date, not the order date. Delays may occur during peak seasons, holidays, or due to weather conditions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Undeliverable Packages</h3>
                <p>If a package cannot be delivered after multiple attempts, it will be returned to our warehouse. We'll contact you to arrange reshipment (additional charges may apply).</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">PO Boxes & APO/FPO</h3>
                <p>We ship to PO Boxes and APO/FPO addresses via USPS. Please allow additional time for delivery to these addresses.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-secondary/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Have shipping questions?</h3>
            <p className="text-muted-foreground mb-4">Our support team is here to help with any shipping inquiries.</p>
            <Button onClick={() => navigate("/contact")} className="bg-gradient-accent border-0 hover:opacity-90">
              Contact Support
            </Button>
          </div>
        </div>
      </div>

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

export default Shipping;
