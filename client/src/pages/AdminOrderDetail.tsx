import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Pencil, Download, Printer } from "lucide-react";
import {
  StatusBadge,
  STATUS_OPTIONS,
  normalizeStatus,
  adminCard,
  adminInput,
  adminButton,
  adminButtonPrimary,
  LoadingBlock,
} from "@/components/admin/AdminUI";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatPrice, toWhatsAppLink, shortSizeLabel } from "@/lib/utils";
import { THEMES, SHAPES, BASE_FLAVORS, PLATTER_INDIVIDUAL_SHAPES, SHAPE_SIZES } from "@/lib/customizeOptions";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type Order = inferRouterOutputs<AppRouter>["orders"]["getById"];

// The PDF generator (and the large PDF library behind it) is loaded only when
// one of these buttons is actually used.
function OrderPdfActions({ order }: { order: Order }) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  const run = async (kind: "download" | "print") => {
    setBusy(kind);
    try {
      const { downloadOrderPdf, printOrderPdf } = await import("@/lib/orderPdf");
      await (kind === "download" ? downloadOrderPdf(order) : printOrderPdf(order));
    } catch (error) {
      console.error("Order PDF failed", error);
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const buttonClass = adminButton;

  return (
    <>
      <button type="button" onClick={() => run("download")} disabled={busy !== null} className={buttonClass}>
        {busy === "download" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Download PDF
      </button>
      <button type="button" onClick={() => run("print")} disabled={busy !== null} className={buttonClass}>
        {busy === "print" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
        Print
      </button>
    </>
  );
}

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

// Customer-uploaded reference photo: large enough to actually read, opens the
// original in a new tab, and falls back to a plain link if it can't be shown.
function ReferenceImage({ url, index }: { url: string; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex size-28 items-center justify-center rounded-md border border-neutral-200 p-2 text-center text-xs text-primary underline"
      >
        Image {index + 1} can't be previewed - open original
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block size-28 md:size-36 overflow-hidden rounded-md border border-neutral-200 hover:border-primary transition-colors"
    >
      <img src={url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </a>
  );
}

function OptionThumb({ src, alt }: { src: string | undefined; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="w-9 h-9 rounded-md object-cover shrink-0 border border-neutral-200" />;
}

const inputClass = adminInput;
// Read-only counterpart to inputClass — same box shape so the layout doesn't
// jump when toggling edit mode, but a muted fill and no interactivity so
// it's visually obvious these fields aren't clickable-to-edit right now.
const displayClass = "text-sm text-neutral-900 break-words min-h-[24px]";

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

interface FormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  status: string;
  fulfillmentDate: string;
  timeRange: string;
  deliveryMethod: "delivery" | "pickup";
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  notes: string;
}

// lucide-react has no WhatsApp brand mark, so the glyph is inlined here —
// this is the standard, publicly-published WhatsApp logo path (the same one
// shipped by icon packs like Simple Icons/Font Awesome), not a custom design.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.105.549 4.16 1.595 5.976L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.005c6.582 0 11.94-5.36 11.943-11.943a11.87 11.87 0 00-3.473-8.41" />
    </svg>
  );
}

function WhatsAppButton({ phone, label }: { phone: string | null | undefined; label: string }) {
  const link = toWhatsAppLink(phone);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 inline-flex items-center gap-1.5 h-8 text-xs font-medium text-white bg-[#25D366] px-3 rounded-md hover:opacity-90 transition-opacity"
    >
      <WhatsAppIcon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-neutral-500 mb-1">{children}</p>;
}

// Central source for the form's reset payload, used both on initial load
// and when canceling out of edit mode (to discard unsaved changes).
function orderToFormValues(order: Order): FormValues {
  return {
    customerName: order.customerName,
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone,
    billingAddress: order.billingAddress || "",
    status: normalizeStatus(order.status),
    fulfillmentDate: format(new Date(order.fulfillmentDate), "yyyy-MM-dd"),
    timeRange: order.timeRange || "",
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress || "",
    recipientName: order.recipientName || "",
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
    // Live updates pause while editing so a refresh can't disturb what's being typed.
    { enabled: !!orderId, refetchOnWindowFocus: false, refetchInterval: isEditing ? false : 20_000, refetchIntervalInBackground: false }
  );
  const { data: settings } = trpc.settings.get.useQuery();

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
      billingAddress: values.billingAddress || undefined,
      status: values.status as any,
      fulfillmentDate: new Date(`${values.fulfillmentDate}T00:00:00`),
      timeRange: values.timeRange || undefined,
      deliveryMethod: values.deliveryMethod,
      deliveryAddress: values.deliveryMethod === "delivery" ? values.deliveryAddress : undefined,
      recipientName: values.deliveryMethod === "delivery" ? values.recipientName : undefined,
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
        <LoadingBlock />
      </AdminLayout>
    );
  }

  const customerWhatsapp = toWhatsAppLink(order.customerPhone);
  const recipientWhatsapp = toWhatsAppLink(order.recipientPhone);
  const showRecipientButton = recipientWhatsapp && order.recipientPhone !== order.customerPhone;

  const paymentLabel =
    order.paymentStatus === "paid"
      ? "Paid"
      : order.paymentStatus === "failed"
        ? "Payment failed"
        : order.paymentStatus === "refunded"
          ? "Refunded"
          : "Payment pending";
  const paymentTone =
    order.paymentStatus === "paid"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : order.paymentStatus === "pending"
        ? "bg-neutral-100 text-neutral-700 ring-neutral-200"
        : "bg-red-50 text-red-800 ring-red-200";

  const statusControl = isEditing ? (
    <select {...register("status")} className={`${adminInput} !w-auto`}>
      {STATUS_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  ) : (
    <StatusBadge status={order.status} />
  );

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Orders
        </button>

        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1>{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</h1>
            {statusControl}
            <span className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ring-1 ring-inset ${paymentTone}`}>
              {paymentLabel}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1.5">
            Placed {format(new Date(order.createdAt), "d MMM yyyy, h:mm a")}
          </p>
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button type="button" onClick={() => setIsEditing(true)} className={adminButton}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <OrderPdfActions order={order} />
            </div>
          )}
        </div>

        {/* 1. Customer Details */}
        <section className={`${adminCard} p-4 md:p-5 mb-4`}>
          <h2 className="mb-4">Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                <div className={displayClass}>{order.customerEmail || <span className="text-neutral-400">—</span>}</div>
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
                {customerWhatsapp && <WhatsAppButton phone={order.customerPhone} label="Message" />}
              </div>
            </div>
            <div className="md:col-span-2">
              <SectionLabel>Billing Address</SectionLabel>
              {isEditing ? (
                <input {...register("billingAddress")} className={inputClass} />
              ) : (
                <div className={displayClass}>{order.billingAddress || <span className="text-neutral-400">—</span>}</div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Order Design Details (read-only) */}
        <section className={`${adminCard} p-4 md:p-5 mb-4`}>
          <h2 className="mb-4">Order details</h2>
          <div className="flex flex-col gap-4">
            {order.items.map((item: any, idx: number) => (
              <div key={item.id ?? idx} className="rounded-md border border-neutral-200 p-4">
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
                      <p className="font-display text-lg">
                        {item.themeLabel || THEME_LABEL[item.theme] || item.theme} {FORMAT_LABELS[item.format] || item.format}
                      </p>
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
                            className="w-40 max-w-full aspect-square rounded-md object-cover border border-neutral-200"
                          />
                        )}
                        <p className="text-xs font-medium text-neutral-500 mt-3">Theme</p>
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
                          <p className="text-sm text-foreground mt-2">
                            {item.theme === "nameAndInitial" ? "Name" : "Design Description"}: <span className="text-muted-foreground">{item.themeCustomText}</span>
                          </p>
                        )}
                      </div>

                      {/* Right column: every other selected option */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs font-medium text-neutral-500 mb-1">Shape</p>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <OptionThumb src={SHAPE_IMAGE[item.shape]} alt={SHAPE_LABEL[item.shape] || item.shape} />
                            <span>{SHAPE_LABEL[item.shape] || item.shape}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-neutral-500">Size</p>
                          <p className="text-sm text-foreground">{sizeLabel(item.shape, item.size)}</p>
                        </div>

                        {item.numbers && (
                          <div>
                            <p className="text-xs font-medium text-neutral-500">Numbers</p>
                            <p className="text-sm text-foreground">{item.numbers}</p>
                          </div>
                        )}

                        {item.backgroundColor && (
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">Background Color</p>
                            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                              <span className="w-4 h-4 rounded-full border border-neutral-200 shrink-0" style={{ backgroundColor: item.backgroundColor }} />
                              {item.backgroundColor}
                            </span>
                          </div>
                        )}

                        {item.selectedColors?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">Colors</p>
                            <div className="flex flex-wrap gap-2">
                              {item.selectedColors.map((color: string) => (
                                <span key={color} className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                  <span className="w-4 h-4 rounded-full border border-neutral-200 shrink-0" style={{ backgroundColor: color }} />
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.flavours?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-1">Flavour{item.flavours.length > 1 ? "s" : ""}</p>
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
                            <p className="text-xs font-medium text-neutral-500 mb-1">Platter Shapes</p>
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

                    {(item.cakeText || item.designDetails || item.dietaryRequirements || item.referenceImages?.length || item.specialInstructions) && (
                      <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-col gap-2 text-sm">
                        {item.cakeText && (
                          <p>
                            Cake Message: <span className="text-muted-foreground">{item.cakeText}</span>
                            {item.cakeTextLanguage && (
                              <span className="text-muted-foreground"> ({item.cakeTextLanguage === "chinese" ? "Chinese" : "English"})</span>
                            )}
                          </p>
                        )}
                        {item.designDetails && <p>Design Details: <span className="text-muted-foreground">{item.designDetails}</span></p>}
                        {item.dietaryRequirements && <p>Dietary: <span className="text-muted-foreground">{item.dietaryRequirements}</span></p>}
                        {item.referenceImages && item.referenceImages.length > 0 && (
                          <div>
                            <p className="mb-1.5">Reference Images <span className="text-muted-foreground">({item.referenceImages.length})</span></p>
                            <div className="flex flex-wrap gap-3">
                              {item.referenceImages.map((url: string, i: number) => (
                                <ReferenceImage key={`${url}-${i}`} url={url} index={i} />
                              ))}
                            </div>
                          </div>
                        )}
                        {item.specialInstructions && <p>Additional Notes: <span className="text-muted-foreground">{item.specialInstructions}</span></p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 mt-5 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 mt-1 border-t border-neutral-200">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-200">
            <SectionLabel>Additional Notes</SectionLabel>
            {isEditing ? (
              <textarea {...register("notes")} rows={3} className={`${adminInput} h-auto py-2`} />
            ) : (
              <div className="text-sm text-neutral-900 whitespace-pre-wrap">
                {order.notes || <span className="text-neutral-400">—</span>}
              </div>
            )}
          </div>
        </section>

        {/* 3. Delivery / Collection Details */}
        <section className={`${adminCard} p-4 md:p-5 mb-4`}>
          <h2 className="mb-4">Fulfilment</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <SectionLabel>Method</SectionLabel>
                {isEditing ? (
                  <select {...register("deliveryMethod")} className={inputClass}>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                ) : (
                  <div className={`${displayClass} capitalize`}>{order.deliveryMethod}</div>
                )}
              </div>
              <div>
                <SectionLabel>Date</SectionLabel>
                {isEditing ? (
                  <input {...register("fulfillmentDate")} type="date" className={inputClass} />
                ) : (
                  <div className={displayClass}>{format(new Date(order.fulfillmentDate), "d MMM yyyy")}</div>
                )}
              </div>
              <div>
                <SectionLabel>Time</SectionLabel>
                {isEditing ? (
                  <input {...register("timeRange")} placeholder="e.g. 11:00 AM - 1:00 PM" className={inputClass} />
                ) : (
                  <div className={displayClass}>{order.timeRange || <span className="text-neutral-400">Not set</span>}</div>
                )}
              </div>
            </div>

            {(isEditing ? deliveryMethod : order.deliveryMethod) === "delivery" && (
              <>
                <div>
                  <SectionLabel>Recipient Name</SectionLabel>
                  {isEditing ? (
                    <input {...register("recipientName")} className={inputClass} />
                  ) : (
                    <div className={displayClass}>{order.recipientName || <span className="text-neutral-400">—</span>}</div>
                  )}
                </div>
                <div>
                  <SectionLabel>Delivery Address</SectionLabel>
                  {isEditing ? (
                    <input {...register("deliveryAddress")} className={inputClass} />
                  ) : (
                    <div className={displayClass}>{order.deliveryAddress || <span className="text-neutral-400">—</span>}</div>
                  )}
                </div>
                <div>
                  <SectionLabel>Recipient WhatsApp Number</SectionLabel>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input {...register("recipientPhone")} className={inputClass} />
                    ) : (
                      <div className={displayClass}>{order.recipientPhone || <span className="text-neutral-400">—</span>}</div>
                    )}
                    {showRecipientButton && <WhatsAppButton phone={order.recipientPhone} label="Message Recipient" />}
                  </div>
                </div>
              </>
            )}

            {(isEditing ? deliveryMethod : order.deliveryMethod) === "pickup" && settings?.pickupAddress && (
              <div>
                <SectionLabel>Pickup Address</SectionLabel>
                <div className={displayClass}>
                  {settings.pickupAddress}
                  {settings.pickupInstructions ? ` — ${settings.pickupInstructions}` : ""}
                </div>
              </div>
            )}
          </div>
        </section>

        {isEditing && (
          <div className="sticky bottom-20 md:bottom-4 z-20 flex items-center justify-end gap-2 rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <button type="button" onClick={handleCancel} disabled={updateOrder.isPending} className={adminButton}>
              Cancel
            </button>
            <button type="submit" disabled={updateOrder.isPending} className={adminButtonPrimary}>
              {updateOrder.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </AdminLayout>
  );
}
