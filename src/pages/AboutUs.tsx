import Header from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { useState } from "react";
import { Users, Target, Award, Heart } from "lucide-react";

const AboutUs = () => {
  const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            About SPORTIFY
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted destination for premium sports equipment and gear
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-display)' }}>
            Meet the Owners
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Owner 1 */}
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    R
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">Rajput Dipesh bhai</h3>
                  <p className="text-primary font-medium mb-3">Co-Founder & Owner</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span>📧 rajputdipeshkumar9@gmail.com</span>
                    <span>📱 +91 9409533674</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner 2 */}
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    M
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">Khiradi Mayank bhai</h3>
                  <p className="text-primary font-medium mb-3">Co-Founder & Owner</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span>📧 mayankkhiradi89@gmail.com</span>
                    <span>📱 +91 9327058303</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
            With a shared passion for sports and a vision to provide quality equipment to athletes of all levels, 
            they founded SPORTIFY to make premium sports gear accessible to everyone.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Our Story
            </h2>
            <p className="text-muted-foreground mb-6">
              SPORTIFY was born from a simple idea: every athlete deserves access to quality sports equipment. 
              What started as a small passion project has grown into a comprehensive online store serving 
              sports enthusiasts across India.
            </p>
            <p className="text-muted-foreground">
              We carefully curate our collection to include only the best products from trusted brands, 
              ensuring that whether you're a professional athlete or just starting your fitness journey, 
              you'll find exactly what you need to excel.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-display)' }}>
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-card rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality First</h3>
              <p className="text-sm text-muted-foreground">
                Only premium, authentic products from trusted brands
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Customer Focus</h3>
              <p className="text-sm text-muted-foreground">
                Your satisfaction is our top priority
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Wide Selection</h3>
              <p className="text-sm text-muted-foreground">
                Equipment for every sport and skill level
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Passion for Sports</h3>
              <p className="text-sm text-muted-foreground">
                We love sports as much as you do
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-background/70">© 2026 SPORTIFY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
