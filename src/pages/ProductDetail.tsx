import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import ReviewSection from "@/components/ReviewSection";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Star, Minus, Plus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { user } = useAuth();
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

  // Fetch product images from database
  const { data: productImages } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Generate product images array - use database images if available, otherwise generate views from main image
  const getProductImages = () => {
    if (productImages && productImages.length > 0) {
      return productImages.map((img, index) => ({
        url: img.image_url,
        label: index === 0 ? "Main" : `View ${index + 1}`,
      }));
    }
    // Fallback: generate views from main product image
    if (!product?.image_url) return [];
    return [
      { url: product.image_url, label: "Front View" },
      { url: product.image_url, label: "Side View", rotation: "rotateY(25deg)" },
      { url: product.image_url, label: "Back View", rotation: "rotateY(180deg)" },
      { url: product.image_url, label: "Detail View", scale: "1.2" },
    ];
  };

  const images = getProductImages();

  const handleAddToCart = () => {
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
    
    if (!user) {
      toast.error("Please login to proceed with purchase");
      navigate('/auth');
      return;
    }

    // Add to cart first, then navigate to checkout
    handleAddToCart();
    toast.success("Product added to cart. Proceeding to checkout...");
    setTimeout(() => navigate('/checkout'), 500);
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
          {/* Product Images */}
          <div className="relative">
            <div className="sticky top-24 space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-secondary rounded-3xl overflow-hidden relative">
                {images.length > 0 && (
                  <div className="relative w-full h-full">
                    <img
                      src={images[selectedImageIndex]?.url || product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300"
                      style={{ 
                        transform: (images[selectedImageIndex] as any)?.rotation || 
                                   ((images[selectedImageIndex] as any)?.scale ? 
                                    `scale(${(images[selectedImageIndex] as any)?.scale})` : 'none'),
                      }}
                    />
                  </div>
                )}
                {!images.length && product.image_url && (
                  <div className="relative w-full h-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  </div>
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

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-secondary rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-primary/50'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={image.url}
                          alt={`${product.name} - ${image.label}`}
                          className="w-full h-full object-cover transition-all duration-200"
                          style={{ 
                            transform: (image as any).rotation || ((image as any).scale ? `scale(${(image as any).scale})` : 'none'),
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                {formatPrice(Number(product.price))}
              </span>
              {product.original_price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.original_price))}
                  </span>
                  <span className="text-green-600 font-semibold">Save {formatPrice(Number(product.original_price) - Number(product.price))}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description || "Premium quality sports footwear designed for maximum performance and comfort. Featuring advanced cushioning technology and breathable materials."}
            </p>



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
                  <p className="text-sm text-muted-foreground">Orders over ₹2000</p>
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

        {/* Reviews Section */}
        <ReviewSection productId={product.id} />
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