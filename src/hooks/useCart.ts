import { useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/components/CartDrawer";
import type { Product } from "./useProducts";

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.success(`Added another ${product.name} to cart`);
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`${product.name} added to cart`);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.image_url,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartCount,
  };
};
