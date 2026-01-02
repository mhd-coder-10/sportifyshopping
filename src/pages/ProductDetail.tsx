import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Star, Minus, Plus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const sizes = ["US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12"];
const colors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { data: categories } = useCategories();
  const { cartItems, addToCart, updateQuantity, removeFromCart, cartCount } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          description: product.description,
          original_price: product.original_price ? Number(product.original_price) : null,
          category_id: product.category_id,
          stock_quantity: product.stock_quantity,
          is_featured: product.is_featured,
        });
      }
      toast.success(`Added ${quantity} item(s) to cart`);
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    handleAddToCart();
    setIsCartOpen(true);
  };

  const discount = product?.original_price 
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100) 
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate("/")}>Go back home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} categories={categories} />

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-secondary rounded-3xl overflow-hidden sticky top-24">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              {discount && (
                <span className="absolute top-6 left-6 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-full">
                  -{discount}% OFF
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-6 right-6 bg-background/80 backdrop-blur-sm ${isWishlisted ? 'text-red-500' : ''}`}
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
                }}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground">(128 reviews)</span>
                <span className="text-green-600 font-medium">In Stock</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                ${Number(product.price).toFixed(2)}
              </span>
              {product.original_price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${Number(product.original_price).toFixed(2)}
                  </span>
                  <span className="text-green-600 font-semibold">Save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description || "Premium quality sports footwear designed for maximum performance and comfort. Featuring advanced cushioning technology and breathable materials."}
            </p>

            {/* Color Selection */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Color: {selectedColor.name}</h3>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor.name === color.name 
                        ? 'border-primary ring-2 ring-primary ring-offset-2' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Select Size</h3>
                <button className="text-primary text-sm hover:underline">Size Guide</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-muted-foreground text-sm">
                  {product.stock_quantity} items available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 text-lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-gradient-accent border-0 hover:opacity-90"
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Share */}
            <Button variant="ghost" className="text-muted-foreground">
              <Share2 className="h-4 w-4 mr-2" />
              Share this product
            </Button>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Truck className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">Orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <RotateCcw className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Easy Returns</p>
                  <p className="text-sm text-muted-foreground">30-day policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Secure Payment</p>
                  <p className="text-sm text-muted-foreground">100% protected</p>
                </div>
              </div>
            </div>
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

export default ProductDetail;
