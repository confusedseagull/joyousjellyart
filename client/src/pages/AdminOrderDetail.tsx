import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Truck, Package, Calendar, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

export default function AdminOrderDetail() {
  const { admin, loading: authLoading } = useAdminAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/orders/:id");
  const orderId = params?.id ? parseInt(params.id) : undefined;

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && !!admin }
  );

  // Early return after all hooks
  if (!authLoading && !admin) {
    return null;
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Order</h2>
          <p className="text-muted-foreground mb-4">The order ID is missing or invalid.</p>
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
                {order.orderNumber || `JJA${order.id.toString().padStart(4, '0')}`}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-lg">
                  Delivery: {format(new Date(order.fulfillmentDate), 'EEEE, dd MMMM yyyy')}
                  {order.timeRange && ` (${order.timeRange})`}
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
              {order.customerEmail && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
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

                {order.timeRange && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time Range</p>
                    <p className="font-medium">{order.timeRange}</p>
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
            <div className="space-y-6">
              {order.items.map((item: any, idx: number) => (
                <div key={item.id ?? idx} className="space-y-4">
                  {idx > 0 && <Separator />}

                  {item.collection === 'cny' ? (
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
                        <div>
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <p className="text-muted-foreground">{item.edition}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Size</h4>
                          <p className="text-lg">{item.size}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Flavours</h4>
                          <p className="text-lg">{item.flavor}</p>
                        </div>

                        {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Dietary Requirements</h4>
                            <p className="text-lg">{item.dietaryRequirements.join(', ')}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="text-lg font-medium">{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">{formatPrice(item.price)} each</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Format</h4>
                        <p className="text-lg capitalize">{item.format?.replace(/([A-Z])/g, ' $1')}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Shape</h4>
                        <p className="text-lg capitalize">{item.shape?.replace(/_/g, ' ')}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Size</h4>
                        <p className="text-lg">{item.size}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Theme</h4>
                        <p className="text-lg capitalize">{item.theme?.replace(/_/g, ' ')}</p>
                      </div>

                      {item.flavours && item.flavours.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Flavours</h4>
                          <p className="text-lg">{item.flavours.join(', ')}</p>
                        </div>
                      )}

                      {item.selectedColors && item.selectedColors.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Colors</h4>
                          <p className="text-lg">{item.selectedColors.join(', ')}</p>
                        </div>
                      )}

                      {item.cakeText && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Cake Message</h4>
                          <p className="text-lg whitespace-pre-wrap">{item.cakeText}</p>
                        </div>
                      )}

                      {item.dietaryRequirements && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Dietary Requirements</h4>
                          <p className="text-lg">{item.dietaryRequirements}</p>
                        </div>
                      )}

                      {item.referenceLinks && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Reference Links</h4>
                          <p className="text-lg">{item.referenceLinks}</p>
                        </div>
                      )}

                      {item.specialInstructions && (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Special Instructions</h4>
                          <p className="text-lg whitespace-pre-wrap">{item.specialInstructions}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="text-lg font-medium">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-lg font-semibold">{formatPrice(item.price)} each</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {order.notes && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Additional Notes</h4>
                  <p className="text-lg">{order.notes}</p>
                </div>
              )}

              <Separator className="my-6" />
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
