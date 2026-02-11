import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  onAddToCart: (id: string) => void;
}

const ProductCard = ({ id, name, description, price, originalPrice, imageUrl, onAddToCart }: ProductCardProps) => {
  const navigate = useNavigate();

  const { data: sizes } = useQuery({
    queryKey: ["product-sizes-card", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("size, price, original_price")
        .eq("product_id", id)
        .order("price");
      if (error) throw error;
      return data || [];
    },
  });

  const minPrice = sizes && sizes.length > 0 ? Number(sizes[0].price) : price;
  const maxPrice = sizes && sizes.length > 0 ? Number(sizes[sizes.length - 1].price) : price;
  const maxOriginal = sizes && sizes.length > 0 && sizes[sizes.length - 1].original_price 
    ? Number(sizes[sizes.length - 1].original_price) : originalPrice;

  const discount = maxOriginal ? Math.round(((maxOriginal - minPrice) / maxOriginal) * 100) : null;

  const handleClick = () => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(id);
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-card rounded-2xl overflow-hidden shadow-product hover:shadow-hover transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {discount && discount > 0 && (
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        <Button
          onClick={handleAddToCart}
          size="icon"
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-accent border-0 hover:opacity-90"
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 md:p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
          </span>
          {maxOriginal && minPrice !== maxPrice && (
            <span className="text-xs text-muted-foreground">S / M / L</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
