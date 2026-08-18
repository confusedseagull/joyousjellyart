import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, MessageCircle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatPrice, toWhatsAppLink, shortSizeLabel } from "@/lib/utils";
import { THEMES, SHAPES, BASE_FLAVORS, PLATTER_INDIVIDUAL_SHAPES, SHAPE_SIZES } from "@/lib/customizeOptions";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type Order = inferRouterOutputs<AppRouter>["orders"]["getById"];

// Value -> reference photo, for showing a thumbnail next to each selected
// option instead of just its raw value. Falls back to no image (not every
// option has a dedicated photo — e.g. a cartoon character name like
// "Cinnamoroll" is free text within the "cartoonCharacters" theme, so it
// only gets that theme's generic reference photo, not a character-specific
// one; a handful of flavours like Pineapple/Cheesecake have no photo either).
const THEME_IMAGE: Record<string, string | undefined> = Object.fromEntries(
  THEMES.map((t) => [t.value, t.image ?? t.images?.[0]])
);
const SHAPE_IMAGE: Record<string, string | undefined> = Object.fromEntries(
  SHAPES.map((s) => [s.value, s.image])
);
const FLAVOR_IMAGE: Record<string, string | undefined> = Object.fromEntries(
  BASE_FLAVORS.map((f) => [f.value, f.image])
);
const PLATTER_SHAPE_IMAGE: Record<string, string | undefined> = Object.fromEntries(
  PLATTER_INDIVIDUAL_SHAPES.map((s) => [s.value, s.image])
);

// Value -> the same customer-facing label shown on the Customize builder —
// order design details should read the way a customer chose them, not as
// the internal option values (e.g. "cartoonCharacters" -> "Cartoon
// Characters", "platter9" -> "Platter of 9").
const THEME_LABEL: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.value, t.label]));
const SHAPE_LABEL: Record<string, string> = Object.fromEntries(SHAPES.map((s) => [s.value, s.label]));
const PLATTER_SHAPE_LABEL: Record<string, string> = Object.fromEntries(
  PLATTER_INDIVIDUAL_SHAPES.map((s) => [s.value, s.label])
);

// Size values are only unique within a given shape's own size list (e.g.
// "8inch" means different real dimensions for different shapes), so the
// label lookup has to be scoped to the item's shape.
function sizeLabel(shape: string, size: string): string {
  const label = SHAPE_SIZES[shape]?.find((s) => s.value === size)?.label ?? size;
  return shortSizeLabel(label);
}

function OptionThumb({ src, alt }: { src: string | undefined; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#e5e5e5]" />;
}

const inputClass = "h-[48px] rounded-2xl border border-[#e5e5e5] px-4 text-sm w-full outline-none focus:border-primary/40 bg-white";
// Read-only counterpart to inputClass — same box shape so the layout doesn't
// jump when toggling edit mode, but a muted fill and no interactivity so
// it's visually obvious these fields aren't clickable-to-edit right now.
const displayClass = "h-[48px] rounded-2xl border border-[#e5e5e5] px-4 text-sm w-full flex items-center bg-[#faf7f3] text-foreground overflow-hidden whitespace-nowrap text-ellipsis";

const STATUS_OPTIONS = [
  { value: "pending_confirmation", label: "Pending Confirmation" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
];

// Matches the status pill colors already used on the Orders list, for visual
// consistency between the two admin views.
const STATUS_STYLES: Record<string, string> = {
  pending_confirmation: "bg-[#fdf3e0] text-[#8a5a13]",
  in_progress: "bg-[#e3edf7] text-[#2c5a8a]",
  completed: "bg-[#e6f2ea] text-[#2f6b45]",
  delivered: "bg-[#efe6f7] text-[#6b3f9e]",
};

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

// Central source for the form's reset payload, used both on initial load
// and when canceling out of edit mode (to discard unsaved changes).
function orderToFormValues(order: Order): FormValues {
  return {
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
  };
}

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : undefined;
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);

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
    reset(orderToFormValues(order));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, reset]);

  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order updated");
      setIsEditing(false);
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

  const handleCancel = () => {
    if (order) reset(orderToFormValues(order));
    setIsEditing(false);
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
          <div className="flex items-center gap-3">
            {isEditing ? (
              <select {...register("status")} className="h-[46px] w-[200px] rounded-full border border-[#e5e5e5] px-4 text-sm bg-white outline-none focus:border-primary/40">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <>
                <span className={`h-[46px] px-4 inline-flex items-center rounded-full text-sm font-medium ${STATUS_STYLES[order.status] || "bg-muted"}`}>
                  {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-[46px] px-5 rounded-full border border-[#e5e5e5] text-sm font-medium hover:border-primary/40 transition-colors flex items-center gap-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. Customer Details */}
        <section className="mb-8">
          <h2 className="text-lg mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SectionLabel>Name</SectionLabel>
              {isEditing ? (
                <input {...register("customerName")} className={inputClass} />
              ) : (
                <div className={displayClass}>{order.customerName}</div>
              )}
            </div>
            <div>
              <SectionLabel>Email</SectionLabel>
              {isEditing ? (
                <input {...register("customerEmail")} type="email" className={inputClass} />
              ) : (
                <div className={displayClass}>{order.customerEmail || <span className="text-muted-foreground">—</span>}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <SectionLabel>Phone</SectionLabel>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input {...register("customerPhone")} className={inputClass} />
                ) : (
                  <div className={displayClass}>{order.customerPhone}</div>
                )}
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
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="font-display text-lg">{FORMAT_LABELS[item.format] || item.format}</p>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{formatPrice(item.price)}</p>
                        {item.quantity > 1 && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left column: Theme, the option with the big reference photo, plus any
                          sub-selection tied to that theme (character/brand/flowers/note) */}
                      <div>
                        {THEME_IMAGE[item.theme] && (
                          <img
                            src={THEME_IMAGE[item.theme]}
                            alt={THEME_LABEL[item.theme] || item.theme}
                            className="w-48 max-w-full aspect-square rounded-xl object-cover border border-[#e5e5e5]"
                          />
                        )}
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mt-3">Theme</p>
                        <p className="text-sm text-foreground">{THEME_LABEL[item.theme] || item.theme}</p>
                        {item.cartoonCharacter && (
                          <p className="text-sm text-foreground mt-2">Character: <span className="text-muted-foreground">{item.cartoonCharacter}</span></p>
                        )}
                        {item.fashionBrand && (
                          <p className="text-sm text-foreground mt-2">Brand: <span className="text-muted-foreground">{item.fashionBrand}</span></p>
                        )}
                        {item.selectedFlowers?.length > 0 && (
                          <p className="text-sm text-foreground mt-2">Flowers: <span className="text-muted-foreground">{item.selectedFlowers.join(", ")}</span></p>
                        )}
                        {item.themeCustomText && (
                          <p className="text-sm text-foreground mt-2">Theme Note: <span className="text-muted-foreground">{item.themeCustomText}</span></p>
                        )}
                      </div>

                      {/* Right column: every other selected option */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Shape</p>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <OptionThumb src={SHAPE_IMAGE[item.shape]} alt={SHAPE_LABEL[item.shape] || item.shape} />
                            <span>{SHAPE_LABEL[item.shape] || item.shape}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Size</p>
                          <p className="text-sm text-foreground">{sizeLabel(item.shape, item.size)}</p>
                        </div>

                        {item.numbers && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Numbers</p>
                            <p className="text-sm text-foreground">{item.numbers}</p>
                          </div>
                        )}

                        {item.selectedColors?.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Colors</p>
                            <div className="flex flex-wrap gap-2">
                              {item.selectedColors.map((color: string) => (
                                <span key={color} className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                  <span className="w-4 h-4 rounded-full border border-[#e5e5e5] shrink-0" style={{ backgroundColor: color }} />
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.flavours?.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Flavour{item.flavours.length > 1 ? "s" : ""}</p>
                            <div className="flex flex-wrap gap-3">
                              {item.flavours.map((flavor: string) => (
                                <div key={flavor} className="flex items-center gap-2 text-sm text-foreground">
                                  <OptionThumb src={FLAVOR_IMAGE[flavor]} alt={flavor} />
                                  <span>{flavor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.platterShapes?.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Platter Shapes</p>
                            <div className="flex flex-wrap gap-3">
                              {item.platterShapes.map((shape: string) => (
                                <div key={shape} className="flex items-center gap-2 text-sm text-foreground">
                                  <OptionThumb src={PLATTER_SHAPE_IMAGE[shape]} alt={PLATTER_SHAPE_LABEL[shape] || shape} />
                                  <span>{PLATTER_SHAPE_LABEL[shape] || shape}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(item.cakeText || item.dietaryRequirements || item.referenceLinks || item.specialInstructions) && (
                      <div className="mt-4 pt-3 border-t border-[#e5e5e5] flex flex-col gap-1 text-sm">
                        {item.cakeText && (
                          <p>
                            Cake Message: <span className="text-muted-foreground">{item.cakeText}</span>
                            {item.cakeTextLanguage && (
                              <span className="text-muted-foreground"> ({item.cakeTextLanguage === "chinese" ? "Chinese" : "English"})</span>
                            )}
                          </p>
                        )}
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
            {isEditing ? (
              <textarea {...register("notes")} rows={2} className="w-full rounded-2xl border border-[#e5e5e5] px-4 py-3 text-sm outline-none focus:border-primary/40 bg-white" />
            ) : (
              <div className="w-full min-h-[52px] rounded-2xl border border-[#e5e5e5] px-4 py-3 text-sm bg-[#faf7f3] text-foreground whitespace-pre-wrap">
                {order.notes || <span className="text-muted-foreground">—</span>}
              </div>
            )}
          </div>
        </section>

        <div className="h-px w-full bg-[#e5e5e5] mb-8" />

        {/* 3. Delivery / Collection Details */}
        <section className="mb-10">
          <h2 className="text-lg mb-4">Delivery Details</h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {isEditing ? (
                <select {...register("deliveryMethod")} className="h-[48px] w-[200px] rounded-2xl border border-[#e5e5e5] px-4 text-sm bg-white outline-none focus:border-primary/40">
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              ) : (
                <div className={`${displayClass} w-[200px] capitalize`}>{order.deliveryMethod}</div>
              )}
              <div className="flex-1">
                {isEditing ? (
                  <input {...register("fulfillmentDate")} type="date" className={inputClass} />
                ) : (
                  <div className={displayClass}>{format(new Date(order.fulfillmentDate), "d MMM yyyy")}</div>
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input {...register("timeRange")} placeholder="e.g. 11:00 AM - 1:00 PM" className={inputClass} />
                ) : (
                  <div className={displayClass}>{order.timeRange || <span className="text-muted-foreground">No time set</span>}</div>
                )}
              </div>
            </div>

            {(isEditing ? deliveryMethod : order.deliveryMethod) === "delivery" && (
              <>
                <div>
                  <SectionLabel>Delivery Address</SectionLabel>
                  {isEditing ? (
                    <input {...register("deliveryAddress")} className={inputClass} />
                  ) : (
                    <div className={displayClass}>{order.deliveryAddress || <span className="text-muted-foreground">—</span>}</div>
                  )}
                </div>
                <div>
                  <SectionLabel>Recipient WhatsApp Number</SectionLabel>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input {...register("recipientPhone")} className={inputClass} />
                    ) : (
                      <div className={displayClass}>{order.recipientPhone || <span className="text-muted-foreground">—</span>}</div>
                    )}
                    {showRecipientButton && <WhatsAppButton phone={order.recipientPhone} label="Message Recipient" />}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {isEditing && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateOrder.isPending}
              className="h-[52px] px-8 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {updateOrder.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateOrder.isPending}
              className="h-[52px] px-8 rounded-full border border-[#e5e5e5] text-sm font-medium hover:border-primary/40 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </AdminLayout>
  );
}
