import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Percent } from "lucide-react";

const Sale = () => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: categories } = useCategories();
  const { cartItems, addToCart, updateQuantity, removeFromCart, cartCount } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "sale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("original_price", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      addToCart({
        ...product,
        price: Number(product.price),
        original_price: product.original_price ? Number(product.original_price) : null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6">
            <Percent className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            SALE
          </h1>
          <p className="text-muted-foreground text-lg">
            Limited time offers. Grab them before they're gone!
          </p>
        </div>

        {/* Sale Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 mb-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">UP TO 40% OFF</h2>
          <p className="text-white/80">On selected items. While stocks last!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))
            : products?.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={Number(product.price)}
                  originalPrice={product.original_price ? Number(product.original_price) : null}
                  imageUrl={product.image_url}
                  onAddToCart={handleAddToCart}
                />
              ))}
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

export default Sale;
