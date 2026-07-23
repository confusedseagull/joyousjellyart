import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Truck, Package, Calendar, Clock, User, Phone, Mail, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminOrderDetail() {
  const { admin, loading: authLoading } = useAdminAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/orders/:type/:id");
  const orderType = params?.type as 'custom' | 'cny' | undefined;
  const orderId = params?.id ? parseInt(params.id) : undefined;

  // Query custom orders
  const { data: customOrder, isLoading: customLoading, refetch: refetchCustom } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && orderType === 'custom' && !!admin }
  );

  // Query CNY orders
  const { data: cnyOrder, isLoading: cnyLoading, refetch: refetchCny } = trpc.cnyOrders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && orderType === 'cny' && !!admin }
  );

  const order = orderType === 'custom' ? customOrder : cnyOrder;
  const isLoading = orderType === 'custom' ? customLoading : cnyLoading;
  const refetch = orderType === 'custom' ? refetchCustom : refetchCny;

  // Early return after all hooks
  if (!authLoading && !admin) {
    return null;
  }

  if (!orderId || !orderType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Order</h2>
          <p className="text-muted-foreground mb-4">The order ID or type is missing or invalid.</p>
          <Button onClick={() => navigate("/admin/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
          <Button onClick={() => navigate("/admin/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }



  const isCnyOrder = orderType === 'cny';

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Top: Order Number and Delivery Date */}
        <div className="mb-6 pb-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {order.orderNumber || (isCnyOrder ? `CNY${order.id.toString().padStart(4, '0')}` : `CST${order.id.toString().padStart(4, '0')}`)}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-lg">
                  Delivery: {format(new Date(order.fulfillmentDate), 'EEEE, dd MMMM yyyy')}
                  {isCnyOrder && cnyOrder?.timeRange && ` (${cnyOrder.timeRange})`}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {order.paymentStatus === 'paid' ? (
                <Badge variant="default" className="bg-green-600">Paid</Badge>
              ) : order.paymentStatus === 'failed' ? (
                <Badge variant="destructive">Failed</Badge>
              ) : order.paymentStatus === 'refunded' ? (
                <Badge variant="secondary">Refunded</Badge>
              ) : (
                <Badge variant="outline">Payment Pending</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Customer Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              {isCnyOrder && cnyOrder?.customerEmail && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{cnyOrder.customerEmail}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Delivery/Collection Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {order.deliveryMethod === 'delivery' ? (
                <><Truck className="h-5 w-5" /> Delivery Details</>
              ) : (
                <><Package className="h-5 w-5" /> Collection Details</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Method</p>
                <p className="font-medium capitalize">{order.deliveryMethod}</p>
              </div>
              {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{format(new Date(order.fulfillmentDate), 'dd MMM yyyy')}</p>
                </div>

                {isCnyOrder && cnyOrder?.timeRange && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time Range</p>
                    <p className="font-medium">{cnyOrder.timeRange}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Day</p>
                  <p className="font-medium">{format(new Date(order.fulfillmentDate), 'EEEE')}</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Section 3: Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCnyOrder && cnyOrder ? (
              <div className="space-y-6">
                {cnyOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    {idx > 0 && <Separator />}
                    
                    {/* Image and Details Side-by-Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Large Product Image */}
                      <div className="flex items-start">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-auto object-cover rounded-lg shadow-md"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="space-y-4">
                        {/* Product Name and Edition */}
                        <div>
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <p className="text-muted-foreground">{item.edition}</p>
                        </div>

                        {/* Size Subsection */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Size</h4>
                          <p className="text-lg">{item.size}</p>
                        </div>

                        {/* Flavours Subsection */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Flavours</h4>
                          <p className="text-lg">{item.flavor}</p>
                        </div>

                        {/* Additional Notes */}
                        {cnyOrder.notes && idx === 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Additional Notes</h4>
                            <p className="text-lg">{cnyOrder.notes}</p>
                          </div>
                        )}

                        {/* Dietary Requirements */}
                        {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Dietary Requirements</h4>
                            <p className="text-lg">{item.dietaryRequirements.join(', ')}</p>
                          </div>
                        )}

                        {/* Quantity and Price */}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="text-lg font-medium">{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Totals */}
                <Separator className="my-6" />
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${cnyOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium">${cnyOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">${cnyOrder.total.toFixed(2)}</span>
                  </div>
                </div>


              </div>
            ) : customOrder ? (
              <div className="space-y-4">
                {/* Custom Order Details */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Product</h4>
                  <p className="text-lg capitalize">{customOrder.shape?.replace(/_/g, ' ')}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Theme</h4>
                  <p className="text-lg capitalize">{customOrder.theme?.replace(/_/g, ' ')}</p>
                </div>

                {customOrder.flavours && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Flavours</h4>
                    <p className="text-lg">{JSON.parse(JSON.stringify(customOrder.flavours)).join(', ')}</p>
                  </div>
                )}

                {customOrder.cakeText && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Cake Message</h4>
                    <p className="text-lg whitespace-pre-wrap">{customOrder.cakeText}</p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
