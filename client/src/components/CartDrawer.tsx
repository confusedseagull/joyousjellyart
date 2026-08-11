import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, X, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const [, navigate] = useLocation();

  const handleCheckout = () => {
    onOpenChange(false);
    navigate("/cart");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const title = item.collection === "cny" ? item.name : item.themeLabel;
                const subtitle =
                  item.collection === "cny"
                    ? `${item.edition} • ${item.size} • ${item.flavors ? item.flavors.join(', ') : item.flavor}`
                    : `${item.shapeLabel} • ${item.sizeLabel} • ${item.flavours.join(', ')}`;
                const dietary =
                  item.collection === "cny" ? item.dietaryRequirements?.join(', ') : item.dietaryRequirements;
                return (
                  <div key={item.id} className="flex gap-4 border-b pb-6 mb-4">
                    <img
                      src={item.image}
                      alt={title}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                      </p>
                      {dietary && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dietary: {dietary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant={item.quantity === 1 ? "ghost" : "outline"}
                          size="sm"
                          className={`h-7 w-7 p-0 focus:outline-none focus-visible:ring-0 ${item.quantity === 1 ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : ''}`}
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeItem(item.id);
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                        >
                          {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : "-"}
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 focus:outline-none focus-visible:ring-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-6 pb-6 space-y-4 px-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleCheckout} 
              className="w-full"
              size="default"
            >
              Go to Checkout
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              className="w-full"
              size="default"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
