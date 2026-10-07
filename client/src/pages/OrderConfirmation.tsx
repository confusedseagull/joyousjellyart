import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  formatLabel,
  themeLabel as optionThemeLabel,
  sizeLabel as optionSizeLabel,
  flavourLabel,
  dietaryLabels,
  shapeDescription,
} from "../../../shared/orderLabels";

const WHATSAPP_NUMBER = "6582999559";

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
  numbers?: string;
  flavours: string[];
  selectedColors?: string[];
  backgroundColor?: string;
  selectedFlowers?: string[];
  cartoonCharacter?: string;
  themeCustomText?: string;
  fashionBrand?: string;
  designDetails?: string;
  cakeText?: string;
  dietaryRequirements?: string;
  referenceImages?: string[];
  price: number;
  quantity: number;
}

// Theme-specific detail the customer entered while customizing (flowers
// picked, cartoon character, couture brand, or the name for a Name and
// Initial design) — surfaced next to the theme itself, matching how the
// Customize wizard's own order summary presents it.
function themeDetailFor(item: ConfirmationCustomItem): string | undefined {
  if (item.theme === "floralBouquet" && item.selectedFlowers?.length) return item.selectedFlowers.join(', ');
  if (item.theme === "cartoonCharacters" && item.cartoonCharacter) return item.cartoonCharacter;
  if (item.theme === "coutureFashion" && item.fashionBrand) return item.fashionBrand;
  if ((item.theme === "nameAndInitial" || item.theme === "handDrawn") && item.themeCustomText) return item.themeCustomText;
  return undefined;
}

function themeValueFor(item: ConfirmationCustomItem): string {
  const label = optionThemeLabel(item.theme, item.themeLabel);
  const detail = themeDetailFor(item);
  return detail ? `${label} — ${detail}` : label;
}

// Item name shown in place of a generic "Custom Cake" label, e.g. "Floral
// Bouquet Cake" or "Space Mini Gift Box" — the theme and format the
// customer actually chose.
function itemNameFor(item: ConfirmationCustomItem): string {
  return `${optionThemeLabel(item.theme, item.themeLabel)} ${formatLabel(item.format)}`;
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
  billingAddress?: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  fulfillmentDate: string;
  timeRange?: string;
  items: ConfirmationItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  paymentStatus?: string;
}

// Row of item detail lines ("Label: value"), matching the Figma spec's exact
// field set/order — always shown with a "None" fallback so an empty optional
// field reads the same way the design does, rather than disappearing.
function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <p className="text-[#6d726e] text-lg leading-[1.3]">
      {label}: {value || "None"}
    </p>
  );
}

export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();
  const hasClearedCartRef = useRef(false);
  const { data: settings } = trpc.settings.get.useQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    // navigating here from checkout) so there's no loading flash — the
    // backend query below overwrites this with the authoritative row
    // moments later.
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
  // the order automatically: an admin marking the order paid after checking
  // the customer's WhatsApp screenshot, or editing the order's date/time/
  // items/notes after the fact. Poll quickly while payment is still
  // pending, then back off to a slower interval once resolved.
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
      billingAddress: fetchedOrder.billingAddress || undefined,
      deliveryMethod: fetchedOrder.deliveryMethod,
      deliveryAddress: fetchedOrder.deliveryAddress || undefined,
      recipientName: fetchedOrder.recipientName || undefined,
      recipientPhone: fetchedOrder.recipientPhone || undefined,
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f3]">
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

  const hasAdditionalNotes = orderData.notes && !orderData.notes.startsWith('Time Range:');

  const isPaid = orderData.paymentStatus === 'paid';
  const isDelivery = orderData.deliveryMethod === "delivery";

  // Full order recap for the WhatsApp message, so staff can confirm payment
  // against the right order without switching back to the admin dashboard —
  // everything shown on this page except the billing address. Field labels
  // use WhatsApp's own *bold* syntax (rendered by the WhatsApp app itself)
  // so the recap has visual hierarchy instead of reading as one flat block.
  const field = (label: string, value: string) => `*${label}:* ${value}`;

  const orderMessageLines: string[] = [];
  orderData.items.forEach((item) => {
    if (item.collection === "cny") {
      orderMessageLines.push(`*${item.name}* - ${formatPrice(item.price)}`);
      orderMessageLines.push(field("Edition", item.edition));
      orderMessageLines.push(field("Size", item.size));
      orderMessageLines.push(field("Flavour", item.flavors ? item.flavors.join(', ') : item.flavor || "None"));
      if (item.dietaryRequirements && item.dietaryRequirements.length > 0) {
        orderMessageLines.push(field("Dietary Requirements", dietaryLabels(item.dietaryRequirements).join(', ')));
      }
    } else {
      const shapeText = shapeDescription(item);
      orderMessageLines.push(`*${itemNameFor(item)}* - ${formatPrice(item.price)}`);
      orderMessageLines.push(field("Format", formatLabel(item.format)));
      orderMessageLines.push(field("Shape", shapeText));
      orderMessageLines.push(field("Size", item.sizeLabel || optionSizeLabel(item.shape, item.size)));
      orderMessageLines.push(field("Theme", themeValueFor(item)));
      orderMessageLines.push(field("Base Flavour", item.flavours.map(flavourLabel).join(', ')));
      if (item.backgroundColor) orderMessageLines.push(field("Background Color", item.backgroundColor));
      if (item.selectedColors?.length) orderMessageLines.push(field("Color Preferences", item.selectedColors.join(', ')));
      if (item.designDetails) orderMessageLines.push(field("Design Details", item.designDetails));
      if (item.cakeText) orderMessageLines.push(field("Personalized Text", item.cakeText));
      if (item.dietaryRequirements) orderMessageLines.push(field("Dietary Requirements", dietaryLabels(item.dietaryRequirements).join(', ')));
      if (item.referenceImages?.length) orderMessageLines.push(field("Reference Images", item.referenceImages.join(', ')));
    }
    orderMessageLines.push("");
  });
  orderMessageLines.push(field(isDelivery ? "Delivery" : "Pickup", orderData.deliveryFee > 0 ? formatPrice(orderData.deliveryFee) : "FREE"));
  orderMessageLines.push(field("Total", formatPrice(orderData.total)));
  orderMessageLines.push("");
  orderMessageLines.push(field(isDelivery ? "Delivery Method" : "Pickup Method", isDelivery ? "Delivery" : "Pickup"));
  orderMessageLines.push(isDelivery ? (orderData.deliveryAddress || "") : (settings?.pickupAddress || ""));
  if (isDelivery && orderData.recipientName) orderMessageLines.push(field("Recipient Name", orderData.recipientName));
  if (isDelivery && orderData.recipientPhone) orderMessageLines.push(field("Recipient Number", orderData.recipientPhone));
  orderMessageLines.push("");
  orderMessageLines.push(field("Fulfillment Date", formattedDate));
  if (orderData.timeRange) orderMessageLines.push(orderData.timeRange);
  if (hasAdditionalNotes) {
    orderMessageLines.push("");
    orderMessageLines.push(field("Additional Instructions", orderData.notes!));
  }

  // Addressed to Doreen (the business owner, who receives these messages),
  // not the customer — this is the message the customer sends her.
  const whatsappMessage = encodeURIComponent(
    `Hi Doreen, here's my payment screenshot for order *${orderData.orderNumber}*\n\n${orderMessageLines.join("\n")}`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-[#faf7f3] flex items-center justify-center p-4 md:p-20">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-[1113px] px-3 py-3 md:py-[13px] flex flex-col gap-[22px]">
        {/* Thank-you message + hero image */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-3">
          <div className="flex flex-col items-center text-center gap-[10px] max-w-[520px] order-2 lg:order-1">
            <h1 className="text-[28px] md:text-[36px] font-normal text-[#1c1e22] leading-[1.3]">
              Thank you for trusting us with your special occasion!
            </h1>
            <p className="text-[#6e7376] text-base max-w-[422px] leading-[1.3]">
              {isPaid
                ? "Your order is confirmed. We will get in touch with you if we need further information."
                : "We have received your order. Please follow the payment instructions below to confirm your order."}
            </p>
          </div>

          <img
            src="/order-confirmation-hero.webp"
            alt=""
            className="order-1 lg:order-2 max-w-full lg:max-w-[531px] max-h-[260px] lg:max-h-[531px] w-auto h-auto rounded-[24px] lg:rounded-[40px]"
          />
        </div>

        <div className="w-full px-4 md:px-12">
          <div className="h-px w-full bg-[#e5e5e5]" />
        </div>

        {/* Order number, items, delivery fee, total */}
        <div className="flex flex-col gap-9 px-4 md:px-12 py-6 md:py-9 w-full">
          <h2 className="text-[28px] md:text-[36px] font-normal text-[#1c1e22] leading-[1.3]">
            {orderData.orderNumber}
          </h2>

          <div className="flex flex-col gap-4 w-full">
            {orderData.items.map((item, index) => {
              if (item.collection === "cny") {
                return (
                  <div key={item.id ?? index} className="flex items-start justify-between gap-4 w-full">
                    <div className="flex flex-col gap-2.5">
                      <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">{item.name}</p>
                      <div className="flex flex-col gap-2">
                        <DetailLine label="Edition" value={item.edition} />
                        <DetailLine label="Size" value={item.size} />
                        <DetailLine label="Flavour" value={item.flavors ? item.flavors.join(', ') : item.flavor} />
                        <DetailLine
                          label="Dietary Requirements"
                          value={item.dietaryRequirements && item.dietaryRequirements.length > 0 ? dietaryLabels(item.dietaryRequirements).join(', ') : undefined}
                        />
                      </div>
                    </div>
                    <p className="font-display text-[24px] font-normal text-[#1c1e22] whitespace-nowrap">{formatPrice(item.price)}</p>
                  </div>
                );
              }

              const shapeText = shapeDescription(item);

              return (
                <div key={item.id ?? index} className="flex items-start justify-between gap-4 w-full">
                  <div className="flex flex-col gap-2.5">
                    <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">{itemNameFor(item)}</p>
                    <div className="flex flex-col gap-2">
                      <DetailLine label="Format" value={formatLabel(item.format)} />
                      <DetailLine label="Shape" value={shapeText} />
                      <DetailLine label="Size" value={item.sizeLabel || optionSizeLabel(item.shape, item.size)} />
                      <DetailLine label="Theme" value={themeValueFor(item)} />
                      <DetailLine label="Base Flavour" value={item.flavours.map(flavourLabel).join(', ')} />
                      <DetailLine label="Background Color" value={item.backgroundColor} />
                      <DetailLine label="Color Preferences" value={item.selectedColors?.join(', ')} />
                      <DetailLine label="Design Details" value={item.designDetails} />
                      <DetailLine label="Personalized Text" value={item.cakeText} />
                      <DetailLine label="Dietary Requirements" value={dietaryLabels(item.dietaryRequirements).join(', ') || undefined} />
                      {item.referenceImages && item.referenceImages.length > 0 && (
                        <div>
                          <p className="text-[#6d726e] text-lg leading-[1.3] mb-1">Reference Images</p>
                          <div className="flex flex-wrap gap-2">
                            {item.referenceImages.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" className="block size-16 rounded-xl overflow-hidden border border-[#e5e5e5] hover:border-primary/40 transition-colors">
                                <img src={url} alt="Reference" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="font-display text-[24px] font-normal text-[#1c1e22] whitespace-nowrap">{formatPrice(item.price)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-start justify-between w-full">
            <p className="font-display text-[24px] font-normal text-[#1c1e22]">{isDelivery ? "Delivery" : "Pickup"}</p>
            <p className="font-display text-[24px] font-normal text-[#1c1e22] whitespace-nowrap">
              {orderData.deliveryFee > 0 ? formatPrice(orderData.deliveryFee) : "FREE"}
            </p>
          </div>

          <div className="flex items-start justify-between w-full">
            <p className="font-display text-[24px] font-medium text-[#1c1e22]">Total</p>
            <p className="font-display text-[24px] font-medium text-[#1c1e22] whitespace-nowrap">{formatPrice(orderData.total)}</p>
          </div>
        </div>

        <div className="w-full px-4 md:px-12">
          <div className="h-px w-full bg-[#e5e5e5]" />
        </div>

        {/* Customer, delivery, fulfillment, and notes details */}
        <div className="flex flex-col gap-7 px-4 md:px-12 py-6 md:py-9 w-full">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 w-full">
            <div className="flex flex-col gap-2.5">
              <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">Customer Details</p>
              <div className="flex flex-col gap-2">
                <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.customerName}</p>
                <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.customerEmail}</p>
                <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.customerPhone}</p>
              </div>
            </div>

            {orderData.billingAddress && (
              <div className="flex flex-col gap-2.5">
                <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">Billing Address</p>
                <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.billingAddress}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 w-full">
            <div className="flex flex-col gap-2.5">
              <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">
                {isDelivery ? "Delivery Method" : "Pickup Method"}
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-[#6d726e] text-lg leading-[1.3]">{isDelivery ? "Delivery" : "Pickup"}</p>
                <p className="text-[#6d726e] text-lg leading-[1.3]">
                  {isDelivery ? orderData.deliveryAddress : settings?.pickupAddress}
                </p>
                {isDelivery && orderData.recipientName && (
                  <p className="text-[#6d726e] text-lg leading-[1.3]">Recipient Name: {orderData.recipientName}</p>
                )}
                {isDelivery && orderData.recipientPhone && (
                  <p className="text-[#6d726e] text-lg leading-[1.3]">Recipient Number: {orderData.recipientPhone}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">Fulfillment Details</p>
              <div className="flex flex-col gap-2">
                <p className="text-[#6d726e] text-lg leading-[1.3]">{formattedDate}</p>
                {orderData.timeRange && <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.timeRange}</p>}
              </div>
            </div>
          </div>

          {hasAdditionalNotes && (
            <div className="flex flex-col gap-2.5 md:w-[455px]">
              <p className="font-display text-[24px] font-normal text-[#1c1e22] leading-[1.3]">Additional Instructions</p>
              <p className="text-[#6d726e] text-lg leading-[1.3]">{orderData.notes}</p>
            </div>
          )}
        </div>

        {!isPaid && (
          <>
            <div className="w-full px-4 md:px-12">
              <div className="h-px w-full bg-[#e5e5e5]" />
            </div>

            {/* Payment details */}
            <div className="flex flex-col gap-5 px-4 md:px-12 py-6 md:py-9 w-full">
              <h2 className="font-display text-[28px] md:text-[36px] font-normal text-[#1c1e22] leading-[1.3]">
                Payment details
              </h2>
              <p className="text-[#6d726e] text-lg leading-[1.3] max-w-[913px]">
                Please make payment via PayNow and send a screenshot to us via WhatsApp along with your order
                number.
              </p>

              <div className="flex flex-col md:flex-row gap-10 md:gap-24 justify-center items-center md:items-start w-full pt-2">
                <div className="flex flex-col gap-2 items-center">
                  <p className="font-medium text-[#1c1e22] text-xl">PAYNOW</p>
                  <div className="w-[220px] md:w-[260px] aspect-[284/272] -rotate-[0.5deg]">
                    <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-sm">
                      <img
                        src="/paynow-qr.png"
                        alt="PayNow QR code"
                        className="absolute left-[2.35%] top-[-19.97%] w-[92.95%] h-[154.7%] max-w-none"
                      />
                    </div>
                  </div>
                  <p className="font-medium text-[#1c1e22] text-lg mt-1">PROMETHEAN CONCEPT LLP</p>
                  <p className="font-medium text-[#6d726e] text-lg">UEN: T22LL0093A</p>
                  <img src="/paynow-logo.webp" alt="PayNow" className="h-5 mt-1" />
                </div>

                <div className="flex flex-col gap-5 items-center">
                  <p className="font-medium text-[#1c1e22] text-xl">BANK TRANSFER</p>
                  <div className="flex flex-col gap-3 items-center text-center">
                    <div>
                      <p className="text-[#6d726e] text-lg leading-[1.3]">Beneficiary Name</p>
                      <p className="font-medium text-[#6d726e] text-lg leading-[1.3]">PROMETHEAN CONCEPT LLP</p>
                    </div>
                    <div>
                      <p className="text-[#6d726e] text-lg leading-[1.3]">Bank Account Number</p>
                      <p className="font-medium text-[#6d726e] text-lg leading-[1.3]">324-316261-9</p>
                    </div>
                    <div>
                      <p className="text-[#6d726e] text-lg leading-[1.3]">Bank Name</p>
                      <p className="font-medium text-[#6d726e] text-lg leading-[1.3]">UNITED OVERSEAS BANK LIMITED</p>
                    </div>
                    <div>
                      <p className="text-[#6d726e] text-lg leading-[1.3]">Bank Address</p>
                      <p className="font-medium text-[#6d726e] text-lg leading-[1.3]">80 RAFFLES PLACE SINGAPORE 048624</p>
                    </div>
                    <div>
                      <p className="text-[#6d726e] text-lg leading-[1.3]">SWIFT</p>
                      <p className="font-medium text-[#6d726e] text-lg leading-[1.3]">UOVBSGSG</p>
                    </div>
                  </div>
                </div>
              </div>

              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="self-center mt-2">
                <Button
                  size="lg"
                  className="bg-[#25D366] hover:opacity-90 text-white font-medium text-lg rounded-full px-8 py-6 gap-2.5"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Send Payment Screenshot
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
