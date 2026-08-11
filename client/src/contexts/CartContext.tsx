import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CakeFormat = "cake" | "jellyPlatter" | "miniGiftBox";

export interface CustomCartItem {
  collection: "custom";
  id: string;
  format: CakeFormat;
  theme: string;
  themeLabel: string;
  selectedFlowers?: string[];
  selectedColors?: string[];
  cartoonCharacter?: string;
  themeCustomText?: string;
  fashionBrand?: string;
  shape: string;
  shapeLabel: string;
  size: string;
  sizeLabel: string;
  numbers?: string;
  platterShapes?: string[];
  flavours: string[];
  cakeText?: string;
  cakeTextLanguage?: "english" | "chinese";
  dietaryRequirements?: string;
  referenceLinks?: string;
  specialInstructions?: string;
  image: string;
  price: number;
  quantity: number;
}

export interface CnyCartItem {
  collection: "cny";
  id: string;
  designId: number;
  name: string;
  edition: string;
  size: string;
  price: number;
  flavor?: string;
  flavors?: string[];
  image: string;
  quantity: number;
  dietaryRequirements?: string[];
}

export type CartItem = CustomCartItem | CnyCartItem;

interface CartContextType {
  items: CartItem[];
  addCustomItem: (item: Omit<CustomCartItem, "id" | "collection">) => void;
  addCnyItem: (item: Omit<CnyCartItem, "id" | "collection" | "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "jja_cart";

// One-time migration from the two separate carts this app used to have, so
// items a user already added don't silently disappear on upgrade.
function loadInitialItems(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    const migrated: CartItem[] = [];

    const oldCny = localStorage.getItem("cart");
    if (oldCny) {
      const parsed = JSON.parse(oldCny) as Array<Omit<CnyCartItem, "collection">>;
      migrated.push(...parsed.map((item) => ({ ...item, collection: "cny" as const })));
    }

    const oldCustom = localStorage.getItem("customCart");
    if (oldCustom) {
      const parsed = JSON.parse(oldCustom) as Array<Omit<CustomCartItem, "collection">>;
      migrated.push(...parsed.map((item) => ({ ...item, collection: "custom" as const })));
    }

    if (oldCny || oldCustom) {
      localStorage.removeItem("cart");
      localStorage.removeItem("customCart");
    }

    return migrated;
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialItems);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addCustomItem = (item: Omit<CustomCartItem, "id" | "collection">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { ...item, id, collection: "custom" }]);
  };

  const addCnyItem = (item: Omit<CnyCartItem, "id" | "collection" | "quantity">) => {
    const flavorKey = item.flavors ? item.flavors.slice().sort().join(",") : item.flavor || "";
    const id = `${item.designId}-${item.size}-${flavorKey}`;

    setItems((prev) => {
      const existingItem = prev.find((i) => i.id === id);
      if (existingItem) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, id, collection: "cny", quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addCustomItem,
        addCnyItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
