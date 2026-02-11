import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  size: string;
}

const CART_STORAGE_KEY = 'sportify_cart';

const getCartKey = (id: string, size: string) => `${id}_${size}`;

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: { id: string; name: string; price: number; image_url: string | null }, size: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.size === size);
      if (existing) {
        toast.success(`Added another ${product.name} (${size}) to cart`);
        return prev.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`${product.name} (${size}) added to cart`);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.image_url,
          quantity: 1,
          size,
        },
      ];
    });
  };

  const updateQuantity = (id: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && (!size || item.size === size) ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string, size?: string) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && (!size || item.size === size))));
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
