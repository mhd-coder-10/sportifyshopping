import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Product } from "./useProducts";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  size?: string;
  color?: string;
}

const CART_STORAGE_KEY = 'sportify_cart';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, size?: string, color?: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => 
        item.id === product.id && item.size === size && item.color === color
      );
      if (existing) {
        toast.success(`Added another ${product.name} to cart`);
        return prev.map((item) =>
          item.id === product.id && item.size === size && item.color === color
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
          size,
          color,
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

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  };
};