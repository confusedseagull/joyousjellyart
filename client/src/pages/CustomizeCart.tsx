import { useState, useEffect } from "react";
import { useCustomCart, type CustomCartItem } from "@/contexts/CustomCartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Store } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
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

const FORMAT_LABELS: Record<CustomCartItem["format"], string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

const PLATTER_SHAPE_LABELS: Record<string, string> = {
  heart: "Heart",
  square: "Square",
  circle: "Round",
  clover: "Clover",
};

const PICKUP_ADDRESS = "2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846";
const PICKUP_MAPS_URL = "https://maps.google.com/?q=" + encodeURIComponent(PICKUP_ADDRESS);

const inputClass = "h-[52px] rounded-2xl border-[#e5e5e5]";

// Bordered box with an always-visible label + inline placeholder text,
// matching the Figma "input-field-wrapper" pattern (also used for Additional
// Notes on the Customize page).
function LabeledInput({
  label,
  labelWidth,
  ...props
}: { label: string; labelWidth?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-4 px-4 w-full">
      <label className={`shrink-0 text-sm text-foreground ${labelWidth || ""}`}>{label}</label>
      <input
        {...props}
        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
      />
    </div>
  );
}

// Strips a parenthetical instruction suffix (e.g. "6cm (Choose up to 3 shapes: ...)")
// down to just the dimension, for compact display in the order summary.
function shortSizeLabel(sizeLabel: string): string {
  return sizeLabel.replace(/\s*\(.*\)$/, "");
}

function itemShapeDisplay(item: CustomCartItem): string {
  if (item.platterShapes && item.platterShapes.length > 0) {
    return item.platterShapes.map((s) => PLATTER_SHAPE_LABELS[s] || s).join(", ");
  }
  return item.shapeLabel;
}

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
  const [addressLine, setAddressLine] = useState("");
  const [aptUnit, setAptUnit] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
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

  const composedDeliveryAddress = () => {
    const parts = [addressLine, aptUnit ? `Unit ${aptUnit}` : null, postalCode ? `Singapore ${postalCode}` : null]
      .filter(Boolean)
      .join(", ");
    return recipientWhatsapp ? `${parts} · WhatsApp: ${recipientWhatsapp}` : parts;
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
          deliveryAddress: deliveryMethod === "delivery" ? composedDeliveryAddress() : undefined,
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

    if (deliveryMethod === "delivery" && (!addressLine || !postalCode || !recipientWhatsapp)) {
      toast.error("Please provide a delivery address, postal code, and recipient WhatsApp number");
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
      deliveryAddress: deliveryMethod === "delivery" ? composedDeliveryAddress() : undefined,
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
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">
          {/* Left: checkout form */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <h1>Secure Checkout</h1>
              <p className="text-muted-foreground text-base">Review your order details.</p>
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            {/* Customer Details */}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Customer Details</h2>
              <LabeledInput
                label="Name"
                labelWidth="w-[68px]"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
              />
              <LabeledInput
                label="Email Address"
                labelWidth="w-[109px]"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. doreenleexy@gmail.com"
              />
              <LabeledInput
                label="Phone"
                labelWidth="w-[68px]"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +65 8123 4567"
              />
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            {/* Fulfillment Date and Time */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-medium">Fulfillment Date and Time</h2>
                <p className="text-muted-foreground text-sm">
                  Minimum 3 days advance notice required. For example, if you place an order today, the earliest fulfillment date you can select will be 3 days from today.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-2 px-4 w-full text-left text-sm ${fulfillmentDate ? "text-foreground" : "text-[#808582]"}`}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-[#603b17]" />
                        {fulfillmentDate ? format(fulfillmentDate, "PPP") : "Pick a date"}
                      </button>
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
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Time</Label>
                  <Select value={fulfillmentTime} onValueChange={setFulfillmentTime}>
                    <SelectTrigger className={`${inputClass} w-full gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2`}>
                      <MapPin className="h-4 w-4 shrink-0 text-[#603b17]" />
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

            {/* Delivery Method */}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Delivery Method</h2>
              <div className="bg-[#faf7f3] flex gap-1 h-[50px] items-center p-1 rounded-full w-full">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`flex flex-1 h-full items-center justify-center gap-2 rounded-full text-sm transition-colors ${
                    deliveryMethod === "delivery"
                      ? "bg-white text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground font-medium"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`flex flex-1 h-full items-center justify-center gap-2 rounded-full text-sm transition-colors ${
                    deliveryMethod === "pickup"
                      ? "bg-white text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground font-medium"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  Pick Up
                </button>
              </div>

              {deliveryMethod === "delivery" ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Address"
                    className={inputClass}
                  />
                  <Input
                    value={aptUnit}
                    onChange={(e) => setAptUnit(e.target.value)}
                    placeholder="Apartment/Unit No (optional)"
                    className={inputClass}
                  />
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal Code"
                    className={inputClass}
                  />
                  <LabeledInput
                    label="Recipient WhatsApp Number"
                    labelWidth="w-[190px]"
                    type="tel"
                    value={recipientWhatsapp}
                    onChange={(e) => setRecipientWhatsapp(e.target.value)}
                    placeholder="e.g. +65 8123 4567"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Pick Up Address</Label>
                  <div className="border border-[#e5e5e5] rounded-xl flex gap-4 items-start px-4 py-3 w-full">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#603b17]" />
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <p className="font-semibold">Joyous JellyArt</p>
                        <p>{PICKUP_ADDRESS}</p>
                        <p>Usually ready in 2-4 days</p>
                      </div>
                      <a
                        href={PICKUP_MAPS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#603b17]"
                      >
                        View on Google Maps &nbsp;→
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-[#e5e5e5]" />

            {/* Additional Instructions */}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">Additional Instructions</h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Let us know if you have any special requests."
                className="min-h-[90px] rounded-2xl border-[#e5e5e5]"
              />
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

          {/* Right: order summary */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-[#faf7f3] h-full p-10 flex flex-col gap-6">
              <h2 className="text-2xl">My Order</h2>

              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 pb-4 border-b border-[#e4e6e8] last:border-b-0">
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <p className="font-medium text-[15px]">Custom Cake</p>
                      <p className="text-xs text-muted-foreground">Format: {FORMAT_LABELS[item.format]}</p>
                      <p className="text-xs text-muted-foreground">Shape: {itemShapeDisplay(item)}</p>
                      <p className="text-xs text-muted-foreground">Size: {shortSizeLabel(item.sizeLabel)}</p>
                      <p className="text-xs text-muted-foreground">Design: {item.themeLabel}</p>
                      <p className="text-xs text-muted-foreground">Base Flavour: {item.flavours.join(", ")}</p>
                      {item.selectedColors && item.selectedColors.length > 0 && (
                        <p className="text-xs text-muted-foreground">Colors: {item.selectedColors.join(", ")}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
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
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="bg-[#eef3f0] text-[#426b57] text-xs font-semibold px-2 py-1 rounded-md">{item.quantity}x</span>
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
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
                  <span className="font-medium">Total (incl. tax)</span>
                  <span className="text-xl font-semibold text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
