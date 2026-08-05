import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CakeFormat = "cake" | "jellyPlatter" | "miniGiftBox";

export interface CustomCartItem {
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

interface CustomCartContextType {
  items: CustomCartItem[];
  addItem: (item: Omit<CustomCartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CustomCartContext = createContext<CustomCartContextType | undefined>(undefined);

export function CustomCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CustomCartItem[]>(() => {
    try {
      const stored = localStorage.getItem("customCart");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading custom cart from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("customCart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CustomCartItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { ...item, id }]);
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
    <CustomCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CustomCartContext.Provider>
  );
}

export function useCustomCart() {
  const context = useContext(CustomCartContext);
  if (context === undefined) {
    throw new Error("useCustomCart must be used within a CustomCartProvider");
  }
  return context;
}
