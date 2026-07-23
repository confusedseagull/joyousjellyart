import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Minus, Plus, Trash2, ShoppingBag, CalendarIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const [, setLocation] = useLocation();
  
  const topRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top on component mount using ref
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);
  
  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [timeRange, setTimeRange] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Calculate minimum date (4 days from now)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 4);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  };

  // Calculate delivery fee when address changes
  const { data: deliveryFeeData, error: deliveryFeeError } = trpc.delivery.calculateFee.useQuery(
    { address: `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}, Singapore ${postalCode}` },
    {
      enabled: deliveryMethod === "delivery" && !!addressLine1 && !!postalCode,
    }
  );

  // Update delivery fee state when data changes
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

  // Reset delivery fee when switching to pickup
  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setDeliveryFee(0);
      setDeliveryDistance(null);
      setDeliveryError(null);
    }
  }, [deliveryMethod]);

  const createOrder = trpc.cnyOrders.create.useMutation({
    onSuccess: (data) => {
      // After order is created, initiate payment
      const totalAmount = (totalPrice + deliveryFee).toFixed(2);
      
      createPaymentRequest.mutate({
        orderId: data.id,
        orderType: "cny",
        amount: totalAmount,
        customerName: name,
        customerEmail: email,
        customerPhone: contactNumber,
      });
    },
    onError: (error) => {
      alert(`Failed to create order: ${error.message}`);
    },
  });

  const createPaymentRequest = trpc.payment.createRequest.useMutation({
    onSuccess: (paymentData) => {
      // Store order data in sessionStorage for later retrieval
      const orderData = {
        customerName: name,
        customerEmail: email,
        customerPhone: contactNumber,
        deliveryMethod,
        deliveryAddress: deliveryMethod === "delivery" ? `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}${unitNumber ? ', ' + unitNumber : ''}, Singapore ${postalCode}` : undefined,
        fulfillmentDate: deliveryDate?.toISOString() || new Date().toISOString(),
        items: items,
        subtotal: totalPrice,
        deliveryFee: deliveryFee,
        total: totalPrice + deliveryFee,
        timeRange: timeRange,
        notes: specialInstructions,
      };
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
      
      // Extract order number from HitPay URL and store it in localStorage as backup
      const orderNumberMatch = paymentData.url.match(/order=([A-Z]+\\d+)/);
      if (orderNumberMatch) {
        localStorage.setItem("lastOrderNumber", orderNumberMatch[1]);
      }
      
      // Redirect to HitPay payment page (cart will be cleared after payment confirmation)
      window.location.href = paymentData.url;
    },
    onError: (error) => {
      alert(`Failed to create payment request: ${error.message}`);
    },
  });

  const handleCheckout = () => {
    if (!name || !contactNumber || !email || !deliveryDate || !timeRange) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address (e.g., example@domain.com)");
      return;
    }

    // Validate date + time is at least 24 hours from now
    const minDate = getMinDate();
    if (deliveryDate < minDate) {
      alert("Please select a date at least 24 hours from now");
      return;
    }

    // Parse the time range start time
    const [startTime] = timeRange.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const selectedDateTime = new Date(deliveryDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Check if selected date+time is at least 24 hours from now
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (selectedDateTime < twentyFourHoursFromNow) {
      alert("Please select a date and time at least 24 hours from now. The earliest available time for this date may be later in the day.");
      return;
    }

    if (deliveryMethod === "delivery" && (!addressLine1 || !postalCode)) {
      alert("Please provide Address Line 1 and Postal Code");
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Prepare order data
    const fulfillmentDateTime = new Date(deliveryDate);
    fulfillmentDateTime.setHours(9, 0, 0, 0);

    createOrder.mutate({
      customerName: name,
      customerPhone: contactNumber,
      customerEmail: email,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}${unitNumber ? ', ' + unitNumber : ''}, Singapore ${postalCode}` : undefined,
      fulfillmentDate: fulfillmentDateTime,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        edition: item.edition,
        size: item.size,
        flavor: item.flavors ? item.flavors.join(', ') : (item.flavor || ''),
        price: typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price,
        quantity: item.quantity,
        image: item.image,
        dietaryRequirements: item.dietaryRequirements,
      })),
      subtotal: totalPrice,
      deliveryFee: deliveryFee,
      total: totalPrice + deliveryFee,
      timeRange: timeRange,
      notes: specialInstructions,
    });
  };

  if (items.length === 0) {
    return (
      <div ref={topRef} className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some beautiful CNY designs to your cart to get started!
            </p>
            <Link href="/cny-2026">
              <Button size="lg">Browse CNY Collection</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Contact + Delivery Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name*</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}

                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Phone Number (WhatsApp)*</Label>
                  <Input
                    id="contact"
                    type="tel"
                    placeholder="+65 1234 5678"
                    value={contactNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits, spaces, and + symbol
                      if (value === '' || /^[0-9+\s]*$/.test(value)) {
                        setContactNumber(value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}

                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "delivery" | "pickup")}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Label
                      htmlFor="delivery"
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        deliveryMethod === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="delivery" id="delivery" />
                      <span className="font-medium">Delivery</span>
                    </Label>
                    <Label
                      htmlFor="pickup"
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="pickup" id="pickup" />
                      <span className="font-medium">Pick Up</span>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryMethod === "delivery" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1*</Label>
                      <Input
                        id="addressLine1"
                        placeholder="Street address, building name"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        placeholder="Apartment, suite, floor (optional)"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code*</Label>
                      <Input
                        id="postalCode"
                        placeholder="6-digit postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                {deliveryMethod === "pickup" && (
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <p className="font-medium">Pick-up Location:</p>
                    <p className="text-sm">2 Jln Lokam, #01-27 KENSINGTON SQUARE, Singapore 537846</p>
                    <a
                      href="https://maps.app.goo.gl/QxsyoNaTnYSz4fqu5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brown hover:underline text-sm inline-block mt-2"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date*</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !deliveryDate && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? (
                            format(deliveryDate, "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start" side="top">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          disabled={(date) => date < getMinDate()}
                          defaultMonth={getMinDate()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeRange">Time Range*</Label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger id="timeRange">
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryMethod === "pickup" ? (
                          // Pickup time slots: 11-1pm, 1-3pm, 3-5pm, 5-7pm
                          <>
                            <SelectItem value="11:00-13:00">11:00 AM - 1:00 PM</SelectItem>
                            <SelectItem value="13:00-15:00">1:00 PM - 3:00 PM</SelectItem>
                            <SelectItem value="15:00-17:00">3:00 PM - 5:00 PM</SelectItem>
                            <SelectItem value="17:00-19:00">5:00 PM - 7:00 PM</SelectItem>
                          </>
                        ) : (
                          // Delivery time slots: 10-1pm, 2-5pm, 5-7pm
                          <>
                            <SelectItem value="10:00-13:00">10:00 AM - 1:00 PM</SelectItem>
                            <SelectItem value="14:00-17:00">2:00 PM - 5:00 PM</SelectItem>
                            <SelectItem value="17:00-19:00">5:00 PM - 7:00 PM</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary + Additional Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items with Order Summary */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      {/* Image */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.edition}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Size: {item.size} | Flavor: {item.flavors ? item.flavors.join(', ') : item.flavor}
                        </p>
                        {item.dietaryRequirements && item.dietaryRequirements.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Dietary: {item.dietaryRequirements.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Price and Quantity Controls */}
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-lg font-bold text-brown">{item.price}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Totals */}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {deliveryMethod === 'pickup' ? 'Pick-up' : 'Delivery'}
                    </span>
                    <span>
                      {deliveryMethod === 'pickup' ? 'Free' :
                        deliveryFee > 0 ? formatPrice(deliveryFee) :
                        deliveryFeeData === undefined && !deliveryFeeError ? 'Calculating...' : formatPrice(0)
                      }
                    </span>
                  </div>
                  {deliveryError && deliveryMethod === 'delivery' && (
                    <p className="text-xs text-destructive mt-1">{deliveryError}</p>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Additional Notes</h2>
              <div>
                <Textarea
                  placeholder="E.g., Please include candles, specific packaging requests, etc."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={createOrder.isPending || createPaymentRequest.isPending}
            >
              {createOrder.isPending || createPaymentRequest.isPending ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
