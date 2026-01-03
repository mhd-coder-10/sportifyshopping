import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

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
  const { formatPrice } = useCurrency();
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

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
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {discount && (
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

      {/* Content */}
      <div className="p-4 md:p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;