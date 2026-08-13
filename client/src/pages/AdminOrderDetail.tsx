import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatPrice, toWhatsAppLink } from "@/lib/utils";

const inputClass = "h-[48px] rounded-2xl border border-[#e5e5e5] px-4 text-sm w-full outline-none focus:border-primary/40 bg-white";

const STATUS_OPTIONS = [
  { value: "pending_confirmation", label: "Pending Confirmation" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
];

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

interface FormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  fulfillmentDate: string;
  timeRange: string;
  deliveryMethod: "delivery" | "pickup";
  deliveryAddress: string;
  recipientPhone: string;
  notes: string;
}

function WhatsAppButton({ phone, label }: { phone: string | null | undefined; label: string }) {
  const link = toWhatsAppLink(phone);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2f6b45] bg-[#e6f2ea] px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{children}</p>;
}

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : undefined;
  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId, refetchOnWindowFocus: false }
  );

  const { register, handleSubmit, reset, watch } = useForm<FormValues>();
  const deliveryMethod = watch("deliveryMethod");

  // Reset only when we load a genuinely different order (by id), not on every
  // background refetch of the same order — react-query hands back a new
  // `order` object reference on each refetch even when the data is
  // unchanged, and resetting on every reference change would silently wipe
  // whatever the admin has typed but not yet saved.
  useEffect(() => {
    if (!order) return;
    reset({
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone,
      status: order.status,
      fulfillmentDate: format(new Date(order.fulfillmentDate), "yyyy-MM-dd"),
      timeRange: order.timeRange || "",
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress || "",
      recipientPhone: order.recipientPhone || "",
      notes: order.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, reset]);

  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order updated");
      utils.orders.getById.invalidate({ id: orderId });
      utils.orders.listByBucket.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (values: FormValues) => {
    if (!orderId) return;
    updateOrder.mutate({
      id: orderId,
      customerName: values.customerName,
      customerEmail: values.customerEmail || undefined,
      customerPhone: values.customerPhone,
      status: values.status as any,
      fulfillmentDate: new Date(`${values.fulfillmentDate}T00:00:00`),
      timeRange: values.timeRange || undefined,
      deliveryMethod: values.deliveryMethod,
      deliveryAddress: values.deliveryMethod === "delivery" ? values.deliveryAddress : undefined,
      recipientPhone: values.deliveryMethod === "delivery" ? values.recipientPhone : undefined,
      notes: values.notes || undefined,
    });
  };

  if (isLoading || !order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const customerWhatsapp = toWhatsAppLink(order.customerPhone);
  const recipientWhatsapp = toWhatsAppLink(order.recipientPhone);
  const showRecipientButton = recipientWhatsapp && order.recipientPhone !== order.customerPhone;

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-10 max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-1">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</h1>
            <p className="text-muted-foreground text-sm">
              {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "failed" ? "Payment Failed" : order.paymentStatus === "refunded" ? "Refunded" : "Payment Pending"}
            </p>
          </div>
          <div className="w-[200px]">
            <select {...register("status")} className="h-[46px] w-full rounded-full border border-[#e5e5e5] px-4 text-sm bg-white outline-none focus:border-primary/40">
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Customer Details */}
        <section className="mb-8">
          <h2 className="text-lg mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SectionLabel>Name</SectionLabel>
              <input {...register("customerName")} className={inputClass} />
            </div>
            <div>
              <SectionLabel>Email</SectionLabel>
              <input {...register("customerEmail")} type="email" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <SectionLabel>Phone</SectionLabel>
              <div className="flex items-center gap-3">
                <input {...register("customerPhone")} className={inputClass} />
                {customerWhatsapp && <WhatsAppButton phone={order.customerPhone} label="Message Customer" />}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-[#e5e5e5] mb-8" />

        {/* 2. Order Design Details (read-only) */}
        <section className="mb-8">
          <h2 className="text-lg mb-4">Order Design Details</h2>
          <div className="flex flex-col gap-6">
            {order.items.map((item: any, idx: number) => (
              <div key={item.id ?? idx} className="border border-[#e5e5e5] rounded-2xl p-5">
                {item.collection === "cny" ? (
                  <div className="flex gap-4">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.edition}</p>
                      <p className="text-sm text-muted-foreground">Size: {item.size} &middot; Flavour: {item.flavor}</p>
                      {item.dietaryRequirements?.length > 0 && (
                        <p className="text-sm text-muted-foreground">Dietary: {item.dietaryRequirements.join(", ")}</p>
                      )}
                    </div>
                    <p className="font-semibold shrink-0">{formatPrice(item.price)}</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-display text-lg">{FORMAT_LABELS[item.format] || item.format}</p>
                      <p className="font-semibold shrink-0">{formatPrice(item.price)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <p>Theme: <span className="text-foreground">{item.theme}</span></p>
                      <p>Shape: <span className="text-foreground">{item.shape}</span></p>
                      <p>Size: <span className="text-foreground">{item.size}</span></p>
                      <p>Flavour: <span className="text-foreground">{item.flavours?.join(", ")}</span></p>
                      {item.selectedColors?.length > 0 && (
                        <p>Colors: <span className="text-foreground">{item.selectedColors.join(", ")}</span></p>
                      )}
                    </div>
                    {(item.cakeText || item.dietaryRequirements || item.referenceLinks || item.specialInstructions) && (
                      <div className="mt-3 pt-3 border-t border-[#e5e5e5] flex flex-col gap-1 text-sm">
                        {item.cakeText && <p>Cake Message: <span className="text-muted-foreground">{item.cakeText}</span></p>}
                        {item.dietaryRequirements && <p>Dietary: <span className="text-muted-foreground">{item.dietaryRequirements}</span></p>}
                        {item.referenceLinks && <p>Reference Links: <span className="text-muted-foreground">{item.referenceLinks}</span></p>}
                        {item.specialInstructions && <p>Additional Requests: <span className="text-muted-foreground">{item.specialInstructions}</span></p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 mt-4 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-[#e5e5e5]">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-4">
            <SectionLabel>Additional Notes</SectionLabel>
            <textarea {...register("notes")} rows={2} className="w-full rounded-2xl border border-[#e5e5e5] px-4 py-3 text-sm outline-none focus:border-primary/40 bg-white" />
          </div>
        </section>

        <div className="h-px w-full bg-[#e5e5e5] mb-8" />

        {/* 3. Delivery / Collection Details */}
        <section className="mb-10">
          <h2 className="text-lg mb-4">Delivery Details</h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <select {...register("deliveryMethod")} className="h-[48px] w-[200px] rounded-2xl border border-[#e5e5e5] px-4 text-sm bg-white outline-none focus:border-primary/40">
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
              <div className="flex-1">
                <input {...register("fulfillmentDate")} type="date" className={inputClass} />
              </div>
              <div className="flex-1">
                <input {...register("timeRange")} placeholder="e.g. 11:00 AM - 1:00 PM" className={inputClass} />
              </div>
            </div>

            {deliveryMethod === "delivery" && (
              <>
                <div>
                  <SectionLabel>Delivery Address</SectionLabel>
                  <input {...register("deliveryAddress")} className={inputClass} />
                </div>
                <div>
                  <SectionLabel>Recipient WhatsApp Number</SectionLabel>
                  <div className="flex items-center gap-3">
                    <input {...register("recipientPhone")} className={inputClass} />
                    {showRecipientButton && <WhatsAppButton phone={order.recipientPhone} label="Message Recipient" />}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={updateOrder.isPending}
          className="h-[52px] px-8 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {updateOrder.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AdminLayout>
  );
}
