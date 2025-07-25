import { getMyCart } from "@/services/cart.service";
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext({
  cartCount: 0,
  refreshCart: async () => {},
  setCartCount: (n: number) => {},
});

export function CartProvider({ children }: any) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    const result = await getMyCart();
    if (result && !('error' in result)) {
      setCartCount(result.data.items.length);
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => { refreshCart(); }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
