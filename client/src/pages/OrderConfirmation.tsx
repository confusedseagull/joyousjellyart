import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
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

    // Get pending order data from sessionStorage
    const storedData = sessionStorage.getItem("pendingOrder");

    if (storedData) {
      console.log('Found pending order data in sessionStorage');
      const pendingOrderData = JSON.parse(storedData);
      // Combine order number from URL with stored order data
      setOrderData({
        ...pendingOrderData,
        orderNumber: orderNum,
        paymentStatus: 'pending', // Mark as pending until webhook confirms
      });
      // Clear pending order from sessionStorage
      sessionStorage.removeItem("pendingOrder");
      // DO NOT clear cart here - wait for payment confirmation
      setIsLoading(false);
    } else {
      console.log('No sessionStorage data, will fetch from backend');
      // SessionStorage might be cleared, we'll fetch from backend
      setIsLoading(false);
    }
  }, [navigate, clearCart]);

  const orderId = orderNumber ? parseInt(orderNumber.replace(/^\D+/, ''), 10) : undefined;

  // Always poll the backend for the authoritative payment status, even when
  // we already have a sessionStorage snapshot. That snapshot is written
  // (optimistically "pending") before the HitPay redirect and this page
  // never re-checked it afterwards — so e.g. a customer who pays via a
  // PayNow QR code on their phone would see the original tab stuck on
  // "Payment Pending" forever, since only the webhook (not this tab) knew
  // the payment had actually gone through. Poll every few seconds while
  // still pending; stop once resolved either way.
  const { data: fetchedOrder } = trpc.orders.getByIdForConfirmation.useQuery(
    { id: orderId! },
    {
      enabled: !!orderId,
      refetchInterval: (query) => {
        const status = query.state.data?.paymentStatus;
        return !status || status === 'pending' ? 3000 : false;
      },
    }
  );

  // If we fetched from backend, transform to orderData format (used when
  // there's no sessionStorage snapshot at all, e.g. a reload or the
  // customer's own phone landing here with no local state for this order).
  useEffect(() => {
    if (!orderData && orderNumber && fetchedOrder) {
      console.log('Fetched order from backend:', fetchedOrder);
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
      // Only clear cart if payment is confirmed
      if (fetchedOrder.paymentStatus === 'paid') {
        clearCart();
      }
    }
  }, [fetchedOrder, orderData, orderNumber, clearCart]);

  // If we already had a sessionStorage snapshot, keep its display details but
  // sync in the backend's real payment status once it resolves.
  useEffect(() => {
    if (orderData && fetchedOrder && fetchedOrder.paymentStatus !== orderData.paymentStatus) {
      setOrderData((prev) => (prev ? { ...prev, paymentStatus: fetchedOrder.paymentStatus || 'pending' } : prev));
      if (fetchedOrder.paymentStatus === 'paid') {
        clearCart();
      }
    }
  }, [fetchedOrder, orderData, clearCart]);

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

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl">
        {/* Header - varies by payment status */}
        <div className="text-center mb-8">
          {isPaid && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Thank you for your order. We'll be in touch once your order is ready!
              </p>
            </>
          )}
          {isPending && (
            <>
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Payment Pending</h1>
              <p className="text-muted-foreground">
                Your order has been created, but we haven't received payment confirmation yet. Please complete your payment to confirm your order.
              </p>
            </>
          )}
          {isFailed && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-red-600">✕</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again or contact us for assistance.
              </p>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">{orderData.orderNumber}</h2>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {orderData.items.map((item, index) => {
              if (item.collection === "cny") {
                return (
                  <div key={item.id ?? index} className="flex gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.edition}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size} | Flavor: {item.flavors ? item.flavors.join(', ') : item.flavor}
                      </p>
                      {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Dietary: {item.dietaryRequirements.join(', ')}
                        </p>
                      )}
                      <p className="text-sm">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                );
              }

              const shapeText =
                item.shapeLabel || (item.platterShapes?.length ? item.platterShapes.join(', ') : humanize(item.shape));

              return (
                <div key={item.id ?? index} className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">Custom Cake — {item.themeLabel || humanize(item.theme)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {FORMAT_LABELS[item.format] || humanize(item.format)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Shape: {shapeText} | Size: {item.sizeLabel || item.size}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Flavour: {item.flavours.join(', ')}
                    </p>
                    {item.selectedColors && item.selectedColors.length > 0 && (
                      <p className="text-sm text-muted-foreground">Colors: {item.selectedColors.join(', ')}</p>
                    )}
                    <p className="text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t mb-4" />

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                <p className="font-medium">{orderData.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{orderData.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{orderData.customerPhone}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Method</p>
                <p className="font-medium capitalize">{orderData.deliveryMethod}</p>
              </div>
              {orderData.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                  <p className="font-medium">{orderData.deliveryAddress}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fulfillment Date and Time</p>
                <p className="font-medium">{formattedDateTime}</p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {hasAdditionalNotes && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
              <p className="font-medium">{orderData.notes}</p>
            </div>
          )}

          {/* Pricing */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(orderData.subtotal)}</span>
            </div>
            {orderData.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatPrice(orderData.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(orderData.total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
