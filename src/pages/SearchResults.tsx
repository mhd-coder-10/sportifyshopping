import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(query);
  
  const { data: categories } = useCategories();
  const { cartItems, addToCart, updateQuantity, removeFromCart, cartCount } = useCart();

  // Update local search query when URL changes
  useEffect(() => {
    setLocalSearchQuery(query);
  }, [query]);

  // Fetch products matching search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-products", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!query.trim(),
  });

  const handleSearchChange = (newQuery: string) => {
    setLocalSearchQuery(newQuery);
  };

  const handleSearchSubmit = () => {
    if (localSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleAddToCart = (productId: string) => {
    const product = searchResults?.find((p) => p.id === productId);
    if (product) {
      addToCart(product);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={localSearchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Search Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl text-foreground mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SEARCH RESULTS
          </h1>
          {query && (
            <p className="text-muted-foreground">
              {isLoading
                ? "Searching..."
                : `${searchResults?.length || 0} results for "${query}"`}
            </p>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Start searching
            </h2>
            <p className="text-muted-foreground max-w-md">
              Enter a product name or keyword to find what you're looking for.
            </p>
          </div>
        ) : searchResults?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No products found
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              We couldn't find any products matching "{query}". Try different
              keywords or browse our categories.
            </p>
            <Button onClick={() => navigate("/")}>Browse All Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResults?.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={Number(product.price)}
                originalPrice={
                  product.original_price ? Number(product.original_price) : null
                }
                imageUrl={product.image_url}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3
                className="text-xl mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                SPORTIFY
              </h3>
              <p className="text-background/70 text-sm">
                Premium sports gear for champions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">SHOP</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a href="/new-arrivals" className="hover:text-background">
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a href="/best-sellers" className="hover:text-background">
                    Best Sellers
                  </a>
                </li>
                <li>
                  <a href="/sale" className="hover:text-background">
                    Sale
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">SUPPORT</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a href="/contact" className="hover:text-background">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/faqs" className="hover:text-background">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="/shipping" className="hover:text-background">
                    Shipping
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">FOLLOW US</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background"
                  >
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm text-background/50">
            © 2026 Sportify. All rights reserved.
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

export default SearchResults;
