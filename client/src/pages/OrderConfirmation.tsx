import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";

interface OrderItem {
  name: string;
  edition: string;
  size: string;
  flavor?: string;
  flavors?: string[];
  price: number | string;
  quantity: number;
  image: string;
  dietaryRequirements?: string[];
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  fulfillmentDate: string;
  timeRange?: string;
  items: OrderItem[];
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

  // Parse order number to get type and ID
  const parseOrderNumber = (orderNum: string) => {
    if (orderNum.startsWith('CNY')) {
      return { type: 'cny' as const, id: parseInt(orderNum.replace('CNY', '')) };
    } else if (orderNum.startsWith('CST')) {
      return { type: 'custom' as const, id: parseInt(orderNum.replace('CST', '')) };
    }
    return null;
  };

  const parsedOrder = orderNumber ? parseOrderNumber(orderNumber) : null;

  // Fetch order from backend if we don't have sessionStorage data
  const { data: cnyOrder } = trpc.cnyOrders.getByIdForConfirmation.useQuery(
    { id: parsedOrder?.id! },
    { enabled: !!parsedOrder && parsedOrder.type === 'cny' && !orderData }
  );

  const { data: customOrder } = trpc.orders.getByIdForConfirmation.useQuery(
    { id: parsedOrder?.id! },
    { enabled: !!parsedOrder && parsedOrder.type === 'custom' && !orderData }
  );

  // If we fetched from backend, transform to orderData format
  useEffect(() => {
    if (!orderData && orderNumber) {
      const fetchedOrder = parsedOrder?.type === 'cny' ? cnyOrder : customOrder;
      if (fetchedOrder) {
        console.log('Fetched order from backend:', fetchedOrder);
        // Transform backend order to OrderData format
        const transformedData: OrderData = {
          orderNumber,
          customerName: fetchedOrder.customerName,
          customerEmail: (fetchedOrder as any).customerEmail || '',
          customerPhone: fetchedOrder.customerPhone,
          deliveryMethod: fetchedOrder.deliveryMethod,
          deliveryAddress: fetchedOrder.deliveryAddress || undefined,
          fulfillmentDate: typeof fetchedOrder.fulfillmentDate === 'string' ? fetchedOrder.fulfillmentDate : fetchedOrder.fulfillmentDate.toISOString(),
          timeRange: (fetchedOrder as any).timeRange,
          items: parsedOrder?.type === 'cny' ? (fetchedOrder as any).items : [],
          subtotal: parsedOrder?.type === 'cny' 
            ? (typeof (fetchedOrder as any).subtotal === 'string' ? parseFloat((fetchedOrder as any).subtotal) : (fetchedOrder as any).subtotal)
            : (fetchedOrder as any).estimatedPrice || 0,
          deliveryFee: (fetchedOrder as any).deliveryFee || (fetchedOrder.deliveryMethod === 'delivery' ? 18 : 0),
          total: parsedOrder?.type === 'cny'
            ? (typeof (fetchedOrder as any).total === 'string' ? parseFloat((fetchedOrder as any).total) : (fetchedOrder as any).total)
            : (fetchedOrder as any).estimatedPrice || 0,
          notes: (fetchedOrder as any).notes || (fetchedOrder as any).specialInstructions,
          paymentStatus: (fetchedOrder as any).paymentStatus || 'pending',
        };
        setOrderData(transformedData);
        // Only clear cart if payment is confirmed
        if ((fetchedOrder as any).paymentStatus === 'paid') {
          clearCart();
        }
      }
    }
  }, [cnyOrder, customOrder, orderData, orderNumber, parsedOrder, clearCart]);

  if (isLoading || (!orderData && (parsedOrder?.type === 'cny' ? !cnyOrder : !customOrder))) {
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
  
  // Use timeRange from orderData
  const timeRange = orderData.timeRange || '';
  const formattedDateTime = timeRange ? `${formattedDate}, ${timeRange}` : formattedDate;
  
  // Check if notes contain only time range (hide if so)
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
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}
              >
                Order Confirmed!
              </h1>
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
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}
              >
                Payment Pending
              </h1>
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
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}
              >
                Payment Failed
              </h1>
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again or contact us for assistance.
              </p>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: '"Red Hat Display", system-ui, -apple-system, sans-serif' }}
          >
            {orderData.orderNumber}
          </h2>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {orderData.items.map((item, index) => (
              <div key={index} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
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
                  <p className="font-semibold">
                    {typeof item.price === 'number' 
                      ? `$${item.price.toFixed(2)}` 
                      : (typeof item.price === 'string' && !item.price.startsWith('$') 
                        ? `$${parseFloat(item.price).toFixed(2)}` 
                        : item.price)}
                  </p>
                </div>
              </div>
            ))}
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
              <span>${typeof orderData.subtotal === 'string' ? orderData.subtotal : orderData.subtotal.toFixed(2)}</span>
            </div>
            {orderData.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>${orderData.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${typeof orderData.total === 'string' ? orderData.total : orderData.total.toFixed(2)}</span>
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
