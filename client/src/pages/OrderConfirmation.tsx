import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

// Turns a raw camelCase/underscore value (e.g. "cartoonCharacters") into
// readable text ("Cartoon Characters") when a display label wasn't provided —
// used for the backend-refetch fallback path, where items only carry raw values.
function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface ConfirmationCustomItem {
  collection: "custom";
  id: string;
  format: string;
  theme: string;
  themeLabel?: string;
  shape: string;
  shapeLabel?: string;
  size: string;
  sizeLabel?: string;
  platterShapes?: string[];
  flavours: string[];
  selectedColors?: string[];
  designDetails?: string;
  price: number;
  quantity: number;
}

interface ConfirmationCnyItem {
  collection: "cny";
  id: string;
  name: string;
  edition: string;
  size: string;
  flavor?: string;
  flavors?: string[];
  price: number;
  quantity: number;
  image?: string;
  dietaryRequirements?: string[];
}

type ConfirmationItem = ConfirmationCustomItem | ConfirmationCnyItem;

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  fulfillmentDate: string;
  timeRange?: string;
  items: ConfirmationItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  paymentStatus?: string;
}

export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();
  const hasClearedCartRef = useRef(false);

  useEffect(() => {
    // Get order number from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    let orderNum = urlParams.get('order');

    // If no order number in URL, try localStorage (fallback for mobile redirects)
    if (!orderNum) {
      orderNum = localStorage.getItem("lastOrderNumber");
      if (orderNum) {
        console.log('Retrieved order number from localStorage:', orderNum);
        localStorage.removeItem("lastOrderNumber");
      }
    }

    if (!orderNum) {
      console.log('No order number found, redirecting to home');
      navigate("/");
      return;
    }

    setOrderNumber(orderNum);

    // Paint instantly from the sessionStorage snapshot (written right before
    // the HitPay redirect) so there's no loading flash — the backend query
    // below overwrites this with the authoritative row moments later.
    const storedData = sessionStorage.getItem("pendingOrder");

    if (storedData) {
      console.log('Found pending order data in sessionStorage');
      const pendingOrderData = JSON.parse(storedData);
      setOrderData({
        ...pendingOrderData,
        orderNumber: orderNum,
        paymentStatus: pendingOrderData.paymentStatus || 'pending',
      });
      sessionStorage.removeItem("pendingOrder");
      setIsLoading(false);
    } else {
      console.log('No sessionStorage data, will fetch from backend');
      setIsLoading(false);
    }
  }, [navigate]);

  const orderId = orderNumber ? parseInt(orderNumber.replace(/^\D+/, ''), 10) : undefined;

  // Keep polling the backend for as long as this page stays open — not just
  // until payment resolves. This is what lets the page pick up ANY change to
  // the order automatically: a payment completing on another device (e.g. a
  // PayNow QR scanned on a phone while this tab started checkout), or an
  // admin editing the order's date/time/items/notes after the fact. Poll
  // quickly while payment is still pending (the common, time-sensitive
  // case), then back off to a slower interval once resolved.
  const { data: fetchedOrder } = trpc.orders.getByIdForConfirmation.useQuery(
    { id: orderId! },
    {
      enabled: !!orderId,
      refetchInterval: (query) => {
        const status = query.state.data?.paymentStatus;
        return !status || status === 'pending' ? 3000 : 20000;
      },
    }
  );

  // Whenever the backend row changes — on the first fetch, or any later
  // poll — replace the displayed order wholesale with it, so every field
  // (not just paymentStatus) always reflects the real current state.
  useEffect(() => {
    if (!fetchedOrder || !orderNumber) return;

    const transformedData: OrderData = {
      orderNumber,
      customerName: fetchedOrder.customerName,
      customerEmail: fetchedOrder.customerEmail || '',
      customerPhone: fetchedOrder.customerPhone,
      deliveryMethod: fetchedOrder.deliveryMethod,
      deliveryAddress: fetchedOrder.deliveryAddress || undefined,
      fulfillmentDate:
        typeof fetchedOrder.fulfillmentDate === 'string'
          ? fetchedOrder.fulfillmentDate
          : fetchedOrder.fulfillmentDate.toISOString(),
      timeRange: fetchedOrder.timeRange || undefined,
      items: fetchedOrder.items as ConfirmationItem[],
      subtotal: fetchedOrder.subtotal,
      deliveryFee: fetchedOrder.deliveryFee,
      total: fetchedOrder.total,
      notes: fetchedOrder.notes || undefined,
      paymentStatus: fetchedOrder.paymentStatus || 'pending',
    };

    setOrderData(transformedData);

    if (fetchedOrder.paymentStatus === 'paid' && !hasClearedCartRef.current) {
      hasClearedCartRef.current = true;
      clearCart();
    }
  }, [fetchedOrder, orderNumber, clearCart]);

  if (isLoading || (!orderData && !fetchedOrder)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const fulfillmentDate = new Date(orderData.fulfillmentDate);
  const formattedDate = fulfillmentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeRange = orderData.timeRange || '';
  const formattedDateTime = timeRange ? `${formattedDate}, ${timeRange}` : formattedDate;

  const hasAdditionalNotes = orderData.notes && !orderData.notes.startsWith('Time Range:');

  const isPaid = orderData.paymentStatus === 'paid';
  const isPending = !orderData.paymentStatus || orderData.paymentStatus === 'pending';
  const isFailed = orderData.paymentStatus === 'failed';

  const detailRows: { label: string; value: string }[] = [
    { label: "Customer Name", value: orderData.customerName },
    { label: "Email", value: orderData.customerEmail },
    { label: "Phone", value: orderData.customerPhone },
    { label: "Delivery Method", value: orderData.deliveryMethod === "delivery" ? "Delivery" : "Pickup" },
    ...(orderData.deliveryAddress ? [{ label: "Delivery Address", value: orderData.deliveryAddress }] : []),
    { label: "Fulfillment Date & Time", value: formattedDateTime },
    ...(hasAdditionalNotes ? [{ label: "Special Instructions", value: orderData.notes! }] : []),
  ];

  return (
    <div className="min-h-screen bg-background py-12 md:py-16">
      <div className="container max-w-2xl">
        {/* Status header — varies by payment status */}
        <div className="text-center mb-10 flex flex-col items-center gap-4">
          {isPaid && (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <h1>Order Confirmed!</h1>
                <p className="text-muted-foreground">
                  Thank you, {orderData.customerName.split(" ")[0]} — we'll be in touch once your order is ready.
                </p>
              </div>
            </>
          )}
          {isPending && (
            <>
              <div className="h-16 w-16 rounded-full bg-[#faf7f3] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="flex flex-col gap-2">
                <h1>Payment Pending</h1>
                <p className="text-muted-foreground">
                  Your order has been created, but we haven't received payment confirmation yet. This page will update automatically once it's through.
                </p>
              </div>
            </>
          )}
          {isFailed && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h1>Payment Failed</h1>
                <p className="text-muted-foreground">
                  Your payment could not be processed. Please try again or contact us for assistance.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Order number */}
        <p className="font-display text-2xl text-center mb-6">{orderData.orderNumber}</p>

        {/* Items */}
        <div className="flex flex-col gap-4 mb-8">
          {orderData.items.map((item, index) => {
            if (item.collection === "cny") {
              return (
                <div key={item.id ?? index} className="flex items-start justify-between gap-4 pb-4 border-b border-[#e5e5e5] last:border-b-0">
                  <div className="flex gap-4 min-w-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="font-medium text-[15px]">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.edition}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {item.size} &middot; Flavour: {item.flavors ? item.flavors.join(', ') : item.flavor}
                      </p>
                      {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                        <p className="text-xs text-muted-foreground">Dietary: {item.dietaryRequirements.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="bg-[#eef3f0] text-[#426b57] text-xs font-semibold px-2 py-1 rounded-md">{item.quantity}x</span>
                    <p className="font-semibold">{formatPrice(item.price)}</p>
                  </div>
                </div>
              );
            }

            const shapeText =
              item.shapeLabel || (item.platterShapes?.length ? item.platterShapes.join(', ') : humanize(item.shape));

            return (
              <div key={item.id ?? index} className="flex items-start justify-between gap-4 pb-4 border-b border-[#e5e5e5] last:border-b-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-medium text-[15px]">Custom Cake &mdash; {item.themeLabel || humanize(item.theme)}</p>
                  <p className="text-xs text-muted-foreground">{FORMAT_LABELS[item.format] || humanize(item.format)}</p>
                  <p className="text-xs text-muted-foreground">Shape: {shapeText} &middot; Size: {item.sizeLabel || item.size}</p>
                  <p className="text-xs text-muted-foreground">Flavour: {item.flavours.join(', ')}</p>
                  {item.selectedColors && item.selectedColors.length > 0 && (
                    <p className="text-xs text-muted-foreground">Colors: {item.selectedColors.join(', ')}</p>
                  )}
                  {item.designDetails && (
                    <p className="text-xs text-muted-foreground">Design Details: {item.designDetails}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="bg-[#eef3f0] text-[#426b57] text-xs font-semibold px-2 py-1 rounded-md">{item.quantity}x</span>
                  <p className="font-semibold">{formatPrice(item.price)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order & delivery details — hairline-divided box matching the rest of the app's order-summary pattern */}
        <div className="flex flex-col shrink-0 border border-[#e5e5e5] divide-y divide-[#e5e5e5] mb-8">
          {detailRows.map((row) => (
            <div key={row.label} className="flex flex-col justify-center gap-1.5 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
              <p className="font-display text-lg">{row.value}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="flex flex-col gap-2 pt-2 mb-10">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(orderData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{orderData.deliveryMethod === "delivery" ? "Delivery" : "Pickup"}</span>
            <span>{orderData.deliveryFee > 0 ? formatPrice(orderData.deliveryFee) : "FREE"}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-[#e5e5e5]">
            <span className="font-medium">Total</span>
            <span className="text-xl font-semibold text-primary">{formatPrice(orderData.total)}</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="outline" className="rounded-full border-[#eae6e1] px-8">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
