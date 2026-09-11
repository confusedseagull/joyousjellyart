import { useState, useEffect, useRef } from "react";
import { useCart, type CartItem, type CustomCartItem } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Store, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { formatPrice, shortSizeLabel } from "@/lib/utils";
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countryCodes";
import { toast } from "sonner";

// Formats minutes-since-midnight as "H:MM AM/PM", matching the label style
// already used throughout the app (e.g. "11:00 AM - 1:00 PM").
function formatClockTime(totalMinutes: number): string {
  const period = totalMinutes >= 12 * 60 ? "PM" : "AM";
  let hour = Math.floor(totalMinutes / 60) % 12;
  if (hour === 0) hour = 12;
  const minute = totalMinutes % 60;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

// Generates "H:MM AM/PM - H:MM AM/PM" slot labels at a fixed interval across
// an hour range, e.g. generateTimeSlots(11, 19, 30) -> ["11:00 AM - 11:30 AM",
// "11:30 AM - 12:00 PM", ..., "6:30 PM - 7:00 PM"].
function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number): string[] {
  const slots: string[] = [];
  for (let start = startHour * 60; start < endHour * 60; start += intervalMinutes) {
    const end = Math.min(start + intervalMinutes, endHour * 60);
    slots.push(`${formatClockTime(start)} - ${formatClockTime(end)}`);
  }
  return slots;
}

// Pickup slots are offered in fine-grained 30-minute intervals (rather than
// broad multi-hour blocks) so customers can pick a specific collection
// window; the overall 11am-7pm range matches the shop's existing hours.
const PICKUP_TIME_SLOTS = generateTimeSlots(11, 19, 30);

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
    <div className="border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-4 px-4 w-full focus-within:border-primary/40 transition-colors">
      <label className={`shrink-0 text-sm text-foreground ${labelWidth || ""}`}>{label}</label>
      <input
        {...props}
        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
      />
    </div>
  );
}

// Same bordered-box shape as LabeledInput, but with a flag + dial-code
// dropdown ahead of the number field, so customers only type the local
// portion of their number.
function PhoneInput({
  label,
  labelWidth,
  country,
  onCountryChange,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  labelWidth?: string;
  country: string;
  onCountryChange: (countryCode: string) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = COUNTRY_CODES.find((c) => c.code === country) ?? COUNTRY_CODES[0];
  return (
    <div className="border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-2 pl-4 pr-2 w-full focus-within:border-primary/40 transition-colors">
      <label className={`shrink-0 text-sm text-foreground ${labelWidth || ""}`}>{label}</label>
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger className="shrink-0 w-[88px] h-9 border-0 bg-transparent shadow-none px-2 gap-1 focus-visible:ring-0">
          <SelectValue>
            <span className="flex items-center gap-1.5 text-sm">
              <span>{selected.flag}</span>
              <span>{selected.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span>{c.dialCode}</span>
                <span className="text-muted-foreground">{c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="h-5 w-px bg-[#e5e5e5] shrink-0" />
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[#808582]"
      />
    </div>
  );
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

// Converts a unified cart item into the shape the backend's discriminated
// items union expects for either collection.
function toOrderItemPayload(item: CartItem) {
  if (item.collection === "custom") {
    return {
      collection: "custom" as const,
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
    };
  }
  return {
    collection: "cny" as const,
    id: item.id,
    name: item.name,
    edition: item.edition,
    size: item.size,
    flavor: item.flavors && item.flavors.length > 0 ? item.flavors.join(", ") : item.flavor || "",
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    dietaryRequirements: item.dietaryRequirements,
  };
}

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice: subtotal } = useCart();
  const [, navigate] = useLocation();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhoneCountry, setCustomerPhoneCountry] = useState("SG");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [addressLine, setAddressLine] = useState("");
  const [aptUnit, setAptUnit] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [recipientWhatsappCountry, setRecipientWhatsappCountry] = useState("SG");
  const [recipientWhatsappNumber, setRecipientWhatsappNumber] = useState("");

  // The rest of the app (validation, order payloads, admin display) just
  // wants one phone string like "+65 8123 4567" — compose it here so the
  // country-code dropdown is the only thing that changed, not every
  // downstream consumer of customerPhone/recipientWhatsapp.
  const customerPhoneDialCode = COUNTRY_CODES.find(c => c.code === customerPhoneCountry)?.dialCode ?? DEFAULT_COUNTRY_DIAL_CODE;
  const customerPhone = customerPhoneNumber ? `${customerPhoneDialCode} ${customerPhoneNumber}` : "";
  const recipientWhatsappDialCode = COUNTRY_CODES.find(c => c.code === recipientWhatsappCountry)?.dialCode ?? DEFAULT_COUNTRY_DIAL_CODE;
  const recipientWhatsapp = recipientWhatsappNumber ? `${recipientWhatsappDialCode} ${recipientWhatsappNumber}` : "";
  const [fulfillmentDate, setFulfillmentDate] = useState<Date>();
  const [fulfillmentTime, setFulfillmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  // On mobile, "My Order" collapses into a tap-to-expand bar pinned under
  // the header instead of a panel stacked below the checkout form; desktop
  // keeps the always-visible sidebar regardless of this state.
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);

  const { data: settings } = trpc.settings.get.useQuery();
  const pickupMapsUrl = settings ? "https://maps.google.com/?q=" + encodeURIComponent(settings.pickupAddress) : "#";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  };

  // Address string used only for geocoding the delivery fee — kept separate
  // from composedDeliveryAddress() below, which also appends the recipient's
  // WhatsApp number and would break the Google Maps lookup.
  const feeQueryAddress = `${addressLine}${aptUnit ? ', Unit ' + aptUnit : ''}, Singapore ${postalCode}`;

  // Debounced so typing an address doesn't fire a new (rate-limited, billed
  // Google Maps) request on every keystroke.
  const [debouncedFeeAddress, setDebouncedFeeAddress] = useState(feeQueryAddress);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFeeAddress(feeQueryAddress), 600);
    return () => clearTimeout(timer);
  }, [feeQueryAddress]);

  const { data: deliveryFeeData, error: deliveryFeeError } = trpc.delivery.calculateFee.useQuery(
    { address: debouncedFeeAddress },
    { enabled: deliveryMethod === "delivery" && !!addressLine && !!postalCode }
  );

  useEffect(() => {
    if (deliveryFeeData) {
      setDeliveryFee(deliveryFeeData.fee);
      setDeliveryDistance(deliveryFeeData.distance);
      setDeliveryError(null);
    } else if (deliveryFeeError) {
      setDeliveryError(deliveryFeeError.message);
      setDeliveryFee(0);
      setDeliveryDistance(null);
    }
  }, [deliveryFeeData, deliveryFeeError]);

  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setDeliveryFee(0);
      setDeliveryDistance(null);
      setDeliveryError(null);
    }
  }, [deliveryMethod]);

  // react-query silently clears `error` between retry attempts, so reading
  // deliveryFeeData/deliveryFeeError directly can flash "Calculating..." even
  // after deliveryError has already been set below. Derive a single stable
  // "still waiting on a first result" flag from our own persisted state instead.
  const isCalculatingDeliveryFee =
    deliveryMethod === "delivery" && !!addressLine && !!postalCode && deliveryFee === 0 && !deliveryError;

  const totalPrice = subtotal + deliveryFee;

  const composedDeliveryAddress = () => {
    return [addressLine, aptUnit ? `Unit ${aptUnit}` : null, postalCode ? `Singapore ${postalCode}` : null]
      .filter(Boolean)
      .join(", ");
  };

  // Dev-only: lets `handleSkipPaymentDev` bypass the HitPay call after the
  // order is created, so the order-creation -> confirmation-page flow can be
  // exercised locally without a publicly reachable webhook URL. Never true
  // in a production build since the button that sets it is import.meta.env.DEV-gated.
  const skipPaymentRef = useRef(false);

  // Dev-only: carries fixed test-customer/pickup details for
  // `handleTestHitPaySandbox`, which — unlike the skip-payment path above —
  // goes through the real order -> payment.createRequest -> HitPay redirect
  // flow, so it doesn't touch (or need) the customer's own form state. Set
  // right before `createOrder.mutate`, consumed and cleared once the
  // resulting payment request redirects to HitPay's sandbox checkout.
  const testSandboxOrderRef = useRef<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryMethod: "pickup";
    fulfillmentDate: Date;
    timeRange: string;
    total: number;
  } | null>(null);

  const buildPendingOrderPayload = (override?: NonNullable<typeof testSandboxOrderRef.current>) => ({
    customerName: override?.customerName ?? customerName,
    customerEmail: override?.customerEmail ?? customerEmail,
    customerPhone: override?.customerPhone ?? customerPhone,
    deliveryMethod: override?.deliveryMethod ?? deliveryMethod,
    deliveryAddress: (override?.deliveryMethod ?? deliveryMethod) === "delivery" ? composedDeliveryAddress() : undefined,
    recipientPhone: (override?.deliveryMethod ?? deliveryMethod) === "delivery" ? recipientWhatsapp : undefined,
    fulfillmentDate: (override?.fulfillmentDate ?? fulfillmentDate)?.toISOString() || new Date().toISOString(),
    // Keep the richer display-ready cart items (labels, image) here rather
    // than the backend-stripped payload, since OrderConfirmation.tsx renders
    // straight from this when it's available (no need to match the zod schema).
    items,
    subtotal,
    deliveryFee: override ? 0 : deliveryFee,
    total: override?.total ?? totalPrice,
    timeRange: override?.timeRange ?? fulfillmentTime,
    notes,
  });

  const devMarkPaidAndSendConfirmation = trpc.orders.devMarkPaidAndSendConfirmation.useMutation({
    onSuccess: () => toast.success("Marked paid — confirmation email sent"),
    onError: (error) => toast.error(error.message || "Failed to send confirmation email"),
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      if (skipPaymentRef.current) {
        skipPaymentRef.current = false;
        const orderNumber = `JJA${String(data.id).padStart(4, "0")}`;
        sessionStorage.setItem(
          "pendingOrder",
          JSON.stringify({ ...buildPendingOrderPayload(), paymentStatus: "paid" })
        );
        toast.success("Order created (payment skipped — dev mode)");
        devMarkPaidAndSendConfirmation.mutate({ orderId: data.id });
        navigate(`/order-confirmation?order=${orderNumber}`);
        return;
      }
      const sandbox = testSandboxOrderRef.current;
      createPaymentRequest.mutate({
        orderId: data.id,
        amount: (sandbox?.total ?? totalPrice).toFixed(2),
        customerName: sandbox?.customerName ?? customerName,
        customerEmail: sandbox?.customerEmail ?? customerEmail,
        customerPhone: sandbox?.customerPhone ?? customerPhone,
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

      const sandbox = testSandboxOrderRef.current;
      testSandboxOrderRef.current = null;
      sessionStorage.setItem("pendingOrder", JSON.stringify(buildPendingOrderPayload(sandbox ?? undefined)));

      window.location.href = paymentData.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment request");
    },
  });

  // Shared by the real checkout and the dev-only skip-payment path.
  const validateCheckoutFields = () => {
    if (!customerName || !customerEmail || !customerPhone) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (deliveryMethod === "delivery" && (!addressLine || !postalCode || !recipientWhatsapp)) {
      toast.error("Please provide a delivery address, postal code, and recipient WhatsApp number");
      return false;
    }

    if (isCalculatingDeliveryFee) {
      toast.error("Please wait for the delivery fee to finish calculating");
      return false;
    }

    if (!fulfillmentDate || !fulfillmentTime) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (fulfillmentDate < getMinDate()) {
      toast.error("Minimum 3 days advance notice required");
      return false;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }

    return true;
  };

  const buildOrderPayload = () => ({
    customerName,
    customerEmail,
    customerPhone,
    deliveryMethod,
    deliveryAddress: deliveryMethod === "delivery" ? composedDeliveryAddress() : undefined,
    recipientPhone: deliveryMethod === "delivery" ? recipientWhatsapp : undefined,
    fulfillmentDate: applySlotStartTime(fulfillmentDate!, fulfillmentTime),
    timeRange: fulfillmentTime,
    items: items.map(toOrderItemPayload),
    subtotal,
    deliveryFee,
    total: totalPrice,
    notes: notes || undefined,
  });

  const handleCheckout = () => {
    if (!validateCheckoutFields()) return;
    createOrder.mutate(buildOrderPayload());
  };

  // Dev-only: creates the order, skips the HitPay payment request, marks the
  // order paid, and sends the real confirmation email — exercising the same
  // path a genuine payment would (server/webhooks/hitpay.ts), without a
  // publicly reachable webhook URL for HitPay to call.
  const handleSkipPaymentDev = () => {
    if (!validateCheckoutFields()) return;
    skipPaymentRef.current = true;
    createOrder.mutate(buildOrderPayload());
  };

  // Dev-only: creates an order with fixed test-customer/pickup details (so it
  // works with one click regardless of what's currently in the form) and
  // sends it through the real payment.createRequest -> HitPay redirect flow,
  // landing on HitPay's actual sandbox checkout page. Unlike the skip-payment
  // path above, this exercises the genuine webhook-driven paid/email flow —
  // useful for testing the real HitPay integration once PUBLIC_URL is
  // publicly reachable (e.g. against the deployed site).
  const handleTestHitPaySandbox = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const pickupDate = getMinDate();
    const pickupTime = PICKUP_TIME_SLOTS[0];

    testSandboxOrderRef.current = {
      customerName: "Test Customer",
      customerEmail: "test@joyousjellyart.dev",
      customerPhone: "+65 8123 4567",
      deliveryMethod: "pickup",
      fulfillmentDate: pickupDate,
      timeRange: pickupTime,
      total: subtotal,
    };

    createOrder.mutate({
      customerName: "Test Customer",
      customerEmail: "test@joyousjellyart.dev",
      customerPhone: "+65 8123 4567",
      deliveryMethod: "pickup",
      fulfillmentDate: applySlotStartTime(pickupDate, pickupTime),
      timeRange: pickupTime,
      items: items.map(toOrderItemPayload),
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      notes: "HitPay sandbox test order (dev only)",
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

  // Shared between the mobile tap-to-expand bar (below the header) and the
  // always-visible desktop sidebar.
  const orderSummaryContent = (
    <>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 pb-4 border-b border-[#e4e6e8] last:border-b-0">
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {item.collection === "custom" ? (
                <>
                  <p className="font-medium text-[15px]">Custom Cake</p>
                  <p className="text-xs text-muted-foreground">Format: {FORMAT_LABELS[item.format]}</p>
                  <p className="text-xs text-muted-foreground">Shape: {itemShapeDisplay(item)}</p>
                  <p className="text-xs text-muted-foreground">Size: {shortSizeLabel(item.sizeLabel)}</p>
                  <p className="text-xs text-muted-foreground">Design: {item.themeLabel}</p>
                  <p className="text-xs text-muted-foreground">Base Flavour: {item.flavours.join(", ")}</p>
                  {item.selectedColors && item.selectedColors.length > 0 && (
                    <p className="text-xs text-muted-foreground">Colors: {item.selectedColors.join(", ")}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-[15px]">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Edition: {item.edition}</p>
                  <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                  <p className="text-xs text-muted-foreground">
                    Flavour: {item.flavors && item.flavors.length > 0 ? item.flavors.join(", ") : item.flavor}
                  </p>
                  {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                    <p className="text-xs text-muted-foreground">Dietary: {item.dietaryRequirements.join(", ")}</p>
                  )}
                </>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {item.collection === "custom" && item.format === "miniGiftBox" ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : item.collection === "cny" ? (
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
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{deliveryMethod === "pickup" ? "Pick Up" : "Delivery"}</span>
          <span>
            {deliveryMethod === "pickup"
              ? "FREE"
              : deliveryFee > 0
                ? formatPrice(deliveryFee)
                : isCalculatingDeliveryFee
                  ? "Calculating..."
                  : formatPrice(0)}
          </span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-[#e4e6e8]">
          <span className="font-medium">Total (incl. tax)</span>
          <span className="text-xl font-semibold text-primary">{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">
          {/* Left: checkout form */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Mobile order summary: fixed full-width bar pinned under the header, so
                it stays reachable no matter how far the user has scrolled. A spacer
                reserves its height in the normal flow since the bar itself is fixed. */}
            <div className="lg:hidden h-16" aria-hidden="true" />
            <div className="lg:hidden fixed top-20 inset-x-0 z-40 bg-[#faf7f3]">
              <button
                type="button"
                onClick={() => setMobileOrderOpen((v) => !v)}
                className="w-full h-16 flex items-center justify-between px-6"
              >
                <span className="font-display text-lg">My Order</span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-medium">{formatPrice(totalPrice)}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${mobileOrderOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {mobileOrderOpen && (
                <div className="flex flex-col gap-6 p-6 max-h-[calc(100dvh-176px)] overflow-y-auto">
                  {orderSummaryContent}
                </div>
              )}
            </div>

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
              <PhoneInput
                label="Phone"
                labelWidth="w-[68px]"
                country={customerPhoneCountry}
                onCountryChange={setCustomerPhoneCountry}
                value={customerPhoneNumber}
                onChange={setCustomerPhoneNumber}
                placeholder="8123 4567"
              />
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
                  <PhoneInput
                    label="Recipient WhatsApp Number"
                    labelWidth="w-[190px]"
                    country={recipientWhatsappCountry}
                    onCountryChange={setRecipientWhatsappCountry}
                    value={recipientWhatsappNumber}
                    onChange={setRecipientWhatsappNumber}
                    placeholder="8123 4567"
                  />
                  {deliveryDistance !== null && (
                    <p className="text-xs text-muted-foreground px-1">
                      Approx. {deliveryDistance}km from our shop
                    </p>
                  )}
                  {deliveryError && (
                    <p className="text-xs text-destructive px-1">{deliveryError}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Pick Up Address</Label>
                  <div className="border border-[#e5e5e5] rounded-xl flex gap-4 items-start px-4 py-3 w-full">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#603b17]" />
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <p className="font-semibold">Joyous JellyArt</p>
                        <p>{settings?.pickupAddress}</p>
                        {settings?.pickupInstructions && <p>{settings.pickupInstructions}</p>}
                      </div>
                      <a
                        href={pickupMapsUrl}
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
                        className={`border border-[#e5e5e5] rounded-2xl h-[52px] flex items-center gap-2 px-4 w-full text-left text-sm outline-none focus-visible:border-primary/40 transition-colors ${fulfillmentDate ? "text-foreground" : "text-[#808582]"}`}
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
                    <SelectTrigger className={`${inputClass} !h-[52px] w-full text-left`}>
                      <span className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0 text-[#603b17]" />
                        <SelectValue placeholder="Select time slot" />
                      </span>
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

            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleSkipPaymentDev}
                disabled={createOrder.isPending || createPaymentRequest.isPending}
                className="w-full h-[52px] rounded-full text-base border-dashed"
              >
                Skip Payment & Email Confirmation (Dev Only)
              </Button>
            )}

            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleTestHitPaySandbox}
                disabled={createOrder.isPending || createPaymentRequest.isPending}
                className="w-full h-[52px] rounded-full text-base border-dashed"
              >
                Test with HitPay Sandbox (Dev Only)
              </Button>
            )}
          </div>

          {/* Right: order summary (desktop only - mobile has its own tap-to-expand bar below the header) */}
          <div className="hidden lg:block lg:w-[380px] shrink-0">
            <div className="bg-[#faf7f3] h-full p-10 flex flex-col gap-6">
              <h2 className="text-2xl">My Order</h2>
              {orderSummaryContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
