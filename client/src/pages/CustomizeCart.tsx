import { useState, useEffect } from "react";
import { useCustomCart } from "@/contexts/CustomCartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Minus, Plus, Trash2, ShoppingBag, CalendarIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { SelectablePill } from "@/components/SelectablePill";
import { toast } from "sonner";

const PICKUP_TIME_SLOTS = [
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

const DELIVERY_TIME_SLOTS = [
  "10:00 AM - 1:00 PM",
  "2:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

const inputClass = "h-[52px] rounded-2xl border-[#e5e5e5]";

// Orders store a single fulfillment timestamp (no separate time-range column),
// so the slot's start time gets merged onto the picked date before submitting.
function applySlotStartTime(date: Date, slot: string): Date {
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const combined = new Date(date);
  if (!match) return combined;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export default function CustomizeCart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCustomCart();
  const [, navigate] = useLocation();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState<Date>();
  const [fulfillmentTime, setFulfillmentTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  };

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      createPaymentRequest.mutate({
        orderId: data.id,
        orderType: "custom",
        amount: totalPrice.toFixed(2),
        customerName,
        customerEmail,
        customerPhone,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const createPaymentRequest = trpc.payment.createRequest.useMutation({
    onSuccess: (paymentData) => {
      const orderNumberMatch = paymentData.url.match(/order=([A-Z]+\d+)/);
      if (orderNumberMatch) {
        localStorage.setItem("lastOrderNumber", orderNumberMatch[1]);
      }

      sessionStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryMethod,
          deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : undefined,
          fulfillmentDate: fulfillmentDate?.toISOString() || new Date().toISOString(),
          items,
          subtotal: totalPrice,
          deliveryFee: 0,
          total: totalPrice,
          timeRange: fulfillmentTime,
          notes,
        })
      );

      window.location.href = paymentData.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment request");
    },
  });

  const handleCheckout = () => {
    if (!customerName || !customerEmail || !customerPhone || !fulfillmentDate || !fulfillmentTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (fulfillmentDate < getMinDate()) {
      toast.error("Minimum 3 days advance notice required");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress) {
      toast.error("Please provide a delivery address");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    createOrder.mutate({
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : undefined,
      fulfillmentDate: applySlotStartTime(fulfillmentDate, fulfillmentTime),
      timeRange: fulfillmentTime,
      items: items.map((item) => ({
        id: item.id,
        format: item.format,
        theme: item.theme,
        selectedFlowers: item.selectedFlowers,
        selectedColors: item.selectedColors,
        cartoonCharacter: item.cartoonCharacter,
        themeCustomText: item.themeCustomText,
        fashionBrand: item.fashionBrand,
        shape: item.shape,
        size: item.size,
        numbers: item.numbers,
        platterShapes: item.platterShapes,
        flavours: item.flavours,
        cakeText: item.cakeText,
        cakeTextLanguage: item.cakeTextLanguage,
        dietaryRequirements: item.dietaryRequirements,
        referenceLinks: item.referenceLinks,
        specialInstructions: item.specialInstructions,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: totalPrice,
      deliveryFee: 0,
      total: totalPrice,
      notes: notes || undefined,
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container max-w-2xl text-center">
          <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h1 className="mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Build a custom jelly cake to get started!
          </p>
          <Link href="/customize">
            <Button size="lg" className="rounded-full">Start Customizing</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container">
        <h1 className="mb-10">Secure Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left: checkout form */}
          <div className="flex-1 min-w-0 flex flex-col gap-8 max-w-2xl">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-medium">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Name *"
                  className={inputClass}
                />
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address *"
                  className={inputClass}
                />
              </div>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone *"
                className={inputClass}
              />
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-medium">Fulfillment Date and Time</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Minimum 3 days advance notice required.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={`w-full justify-start text-left font-normal ${inputClass}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fulfillmentDate ? format(fulfillmentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fulfillmentDate}
                        onSelect={setFulfillmentDate}
                        disabled={(date) => date < getMinDate()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="mb-2 block">Time *</Label>
                  <Select value={fulfillmentTime} onValueChange={setFulfillmentTime}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {(deliveryMethod === "pickup" ? PICKUP_TIME_SLOTS : DELIVERY_TIME_SLOTS).map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-medium">Delivery Method</h2>
              <div className="flex gap-4">
                <SelectablePill
                  selected={deliveryMethod === "pickup"}
                  onClick={() => setDeliveryMethod("pickup")}
                  className="flex-1 flex items-center justify-center px-4 py-3"
                >
                  Pick Up
                </SelectablePill>
                <SelectablePill
                  selected={deliveryMethod === "delivery"}
                  onClick={() => setDeliveryMethod("delivery")}
                  className="flex-1 flex items-center justify-center px-4 py-3"
                >
                  Delivery
                </SelectablePill>
              </div>
              {deliveryMethod === "delivery" && (
                <Textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Delivery address *"
                  className="min-h-[80px] rounded-2xl border-[#e5e5e5]"
                />
              )}
              {deliveryMethod === "pickup" && (
                <div className="p-4 bg-[#faf7f3] rounded-2xl text-sm">
                  <p className="font-medium mb-1">Pick-up Location:</p>
                  <p>2 Jln Lokam #01-27, Singapore 548182</p>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-medium">Additional Instructions</h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Let us know if you have any special requests."
                className="min-h-[90px] rounded-2xl border-[#e5e5e5]"
              />
            </div>
          </div>

          {/* Right: sticky order summary */}
          <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-24">
            <div className="bg-[#faf7f3] rounded-2xl p-8 flex flex-col gap-6">
              <h2 className="text-2xl">My Order</h2>

              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 pb-4 border-b border-[#e4e6e8] last:border-b-0">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="font-medium">{item.themeLabel}</p>
                      <p className="text-xs text-muted-foreground">Shape: {item.shapeLabel}</p>
                      <p className="text-xs text-muted-foreground">Size: {item.sizeLabel}</p>
                      <p className="text-xs text-muted-foreground">Flavour: {item.flavours.join(", ")}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {item.format === "miniGiftBox" ? (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null}
                        <button type="button" onClick={() => removeItem(item.id)} className="text-destructive text-xs flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#e4e6e8]">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{deliveryMethod === "pickup" ? "Pick Up" : "Delivery"}</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#e4e6e8]">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-semibold text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handleCheckout}
                disabled={createOrder.isPending || createPaymentRequest.isPending}
                className="w-full h-[52px] rounded-full text-base bg-primary hover:opacity-90 text-primary-foreground"
              >
                {createOrder.isPending || createPaymentRequest.isPending
                  ? "Processing..."
                  : `Confirm and Pay  •  ${formatPrice(totalPrice)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
