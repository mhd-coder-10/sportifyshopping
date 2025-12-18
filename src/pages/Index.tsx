import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { useProducts, useCategories, useFeaturedProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: products, isLoading: productsLoading } = useProducts(selectedCategory);
  
  const { cartItems, addToCart, updateQuantity, removeFromCart, cartCount } = useCart();

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? undefined : slug);
  };

  const handleAddToCart = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      addToCart(product);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <Hero />

      {/* Categories Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl text-foreground mb-8 md:mb-12 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            SHOP BY CATEGORY
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoriesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))
              : categories?.map((category) => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    slug={category.slug}
                    imageUrl={category.image_url}
                    onClick={handleCategoryClick}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {!selectedCategory && (
        <section className="py-12 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl text-foreground mb-8 md:mb-12 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              FEATURED PRODUCTS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                  ))
                : featuredProducts?.map((product) => (
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
        </section>
      )}

      {/* All Products Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl text-foreground tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {selectedCategory ? selectedCategory.toUpperCase() : "ALL PRODUCTS"}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(undefined)}
                className="text-primary hover:underline font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading
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
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>SPORTIFY</h3>
              <p className="text-background/70 text-sm">Premium sports gear for champions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">SHOP</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">New Arrivals</a></li>
                <li><a href="#" className="hover:text-background">Best Sellers</a></li>
                <li><a href="#" className="hover:text-background">Sale</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">SUPPORT</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">Contact Us</a></li>
                <li><a href="#" className="hover:text-background">FAQs</a></li>
                <li><a href="#" className="hover:text-background">Shipping</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">FOLLOW US</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">Instagram</a></li>
                <li><a href="#" className="hover:text-background">Twitter</a></li>
                <li><a href="#" className="hover:text-background">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm text-background/50">
            © 2024 Sportify. All rights reserved.
          </div>
        </div>
      </footer>

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

export default Index;
