import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import type { CartItem } from "@/hooks/useCart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartDrawer = ({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartDrawerProps) => {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <ShoppingBag className="h-6 w-6" />
            YOUR CART ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
            <Button onClick={onClose} className="mt-4">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 bg-secondary/50 rounded-xl p-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground line-clamp-1">{item.name}</h4>
                    {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                    {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                    <p className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatPrice(total)}
                </span>
              </div>
              <Button 
                onClick={handleCheckout}
                className="w-full bg-gradient-accent text-white border-0 hover:opacity-90 py-6 text-lg"
              >
                CHECKOUT
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;