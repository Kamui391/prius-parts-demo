// Сагс нь хөтөч дээр хадгалагдана. Захиалга үүсгэх үед сервер үнэ, үлдэгдлийг дахин шалгана.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "pp_cart";

const readCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Өөр таб дээр сагс өөрчлөгдвөл синк хийнэ
  useEffect(() => {
    const onStorage = (event) => event.key === KEY && setItems(readCart());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** part: part detail/list object, offer: offer object */
  const add = useCallback((part, offer, quantity = 1) => {
    setItems((list) => {
      const existing = list.find((item) => item.offerId === offer.id);
      if (existing) {
        return list.map((item) => (item.offerId === offer.id ? { ...item, quantity: Math.min(item.quantity + quantity, offer.stock) } : item));
      }
      return [...list, {
        offerId: offer.id,
        partId: part.id,
        sku: part.sku,
        nameMn: part.nameMn,
        nameEn: part.nameEn,
        image: part.image || part.images?.[0]?.url || null,
        supplier: offer.supplier?.name,
        condition: offer.condition,
        warrantyMonths: offer.warrantyMonths,
        price: offer.price,
        stock: offer.stock,
        quantity: Math.min(quantity, offer.stock),
      }];
    });
  }, []);

  const setQuantity = useCallback((offerId, quantity) => {
    setItems((list) => list.map((item) => (item.offerId === offerId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock || 20)) } : item)));
  }, []);
  const remove = useCallback((offerId) => setItems((list) => list.filter((item) => item.offerId !== offerId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    add,
    setQuantity,
    remove,
    clear,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
