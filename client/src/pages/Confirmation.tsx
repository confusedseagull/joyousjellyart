import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function Confirmation() {
  const [, params] = useRoute("/confirmation/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : undefined;

  // Note: This uses admin procedure, but for demo purposes we'll show basic confirmation
  // In production, you'd want a public procedure to fetch order confirmation details
  
  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Order</CardTitle>
            <CardDescription>The order ID is missing or invalid.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Order Submitted Successfully!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your order. We've received your customization details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 space-y-2">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-2xl font-bold text-primary">#{orderId.toString().padStart(6, '0')}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We'll review your customization details and contact you within 24 hours to confirm your order.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll receive a call or message at the phone number you provided.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We'll discuss any final details and confirm the delivery or pick-up arrangements.</span>
              </li>
            </ul>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground">
              Please save your order number for reference. If you have any questions, feel free to contact us.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
              Return to Home
            </Button>
            <Button onClick={() => navigate("/customize")} className="flex-1">
              Create Another Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
