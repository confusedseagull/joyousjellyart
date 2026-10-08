import { format } from "date-fns";
import { THEMES } from "@/lib/customizeOptions";
import { formatTimeRange } from "@/lib/utils";
import {
  formatText,
  boxCount,
  themeLabel,
  shapeDescription,
  sizeLabel,
  flavourLabel,
  dietaryLabels,
} from "../../../../shared/orderLabels";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

export type PdfOrder = inferRouterOutputs<AppRouter>["orders"]["getById"];

export interface PdfField {
  label: string;
  value: string;
}

export interface PdfItem {
  /** Public path of the photo shown in the circle (theme photo / CNY design). */
  imageSrc?: string;
  columnA: PdfField[];
  columnB: PdfField[];
  detailRows: { left?: PdfField; right?: PdfField }[];
  referenceImages: string[];
}

export interface PdfContact {
  name: string;
  lines: string[];
  phone: string;
  email: string;
}

export interface PdfOrderModel {
  orderNumber: string;
  orderDate: string;
  billTo: PdfContact;
  items: PdfItem[];
  subtotal: string;
  deliveryFee: string;
  total: string;
  isDelivery: boolean;
  deliveryContact: PdfContact;
  fulfilmentDate: string;
  fulfilmentTime: string;
  notes: string;
}

// Static business details, per the Figma design.
export const BUSINESS = {
  taxId: "T22LL0093A",
  legalName: "Promethean Concept LLP",
  addressLines: ["1 Ubi Road", "Singapore 408733"],
  phone: "+6582999559",
  email: "joyousjellyart@gmail.com",
  website: "joyousjellyart.com",
  storeAddress: "2 Jalan Lokam, #01-27 Singapore 537846",
};

const THEME_IMAGE: Record<string, string | undefined> = Object.fromEntries(
  THEMES.map((t) => [t.value, t.image ?? t.images?.[0]])
);

const NONE = "None";

function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function formatDate(value: Date | string): string {
  return format(new Date(value), "dd MMMM yyyy");
}

// Checkout composes addresses as "line, Unit X, Singapore 123456". Split off
// the postal part so it can sit on its own line like the design.
function splitAddress(address: string | null | undefined): { parts: string[]; postal?: string } {
  if (!address) return { parts: [] };
  const parts = address.split(/,\s*/).filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && /^Singapore\s+\d+/i.test(last)) {
    return { parts: parts.slice(0, -1), postal: parts.pop() };
  }
  return { parts };
}

function billingLines(address: string | null | undefined): string[] {
  const { parts, postal } = splitAddress(address);
  return [parts.join(", "), postal].filter((l): l is string => !!l);
}

function deliveryLines(address: string | null | undefined): string[] {
  const { parts, postal } = splitAddress(address);
  return [...parts, postal].filter((l): l is string => !!l);
}

// Option names come from shared/orderLabels, so the PDF reads exactly as the customer chose.
function dietaryText(value: unknown): string {
  const labels = dietaryLabels(value);
  return labels.length > 0 ? labels.join(", ") : NONE;
}

function buildCustomItem(item: any): PdfItem {
  const colors = [
    ...(item.backgroundColor ? [`${item.backgroundColor} (Background)`] : []),
    ...(item.selectedColors ?? []),
  ];
  const cakeText = item.cakeText
    ? `${item.cakeText}${item.cakeTextLanguage ? ` (${item.cakeTextLanguage === "chinese" ? "Chinese" : "English"})` : ""}`
    : NONE;

  const themeDetails: PdfField[] = [];
  if (item.selectedFlowers?.length) themeDetails.push({ label: "Flowers", value: item.selectedFlowers.join(", ") });
  if (item.cartoonCharacter) themeDetails.push({ label: "Character", value: item.cartoonCharacter });
  if (item.fashionBrand) themeDetails.push({ label: "Brand", value: item.fashionBrand });
  if (item.themeCustomText) {
    themeDetails.push({
      label: item.theme === "nameAndInitial" ? "Name" : "Design Description",
      value: item.themeCustomText,
    });
  }

  const themeField: PdfField = { label: "Theme", value: themeLabel(item.theme, item.themeLabel) };
  const designDetails: PdfField = { label: "Design Details", value: item.designDetails || NONE };
  const additionalNotes: PdfField = { label: "Additional Notes", value: item.specialInstructions || NONE };

  const detailRows: PdfItem["detailRows"] = [{ left: themeField, right: designDetails }];
  if (themeDetails.length === 0) {
    detailRows.push({ right: additionalNotes });
  } else {
    themeDetails.forEach((field, i) => {
      detailRows.push({ left: field, right: i === 0 ? additionalNotes : undefined });
    });
  }

  return {
    imageSrc: THEME_IMAGE[item.theme],
    columnA: [
      { label: "Format", value: formatText(item) },
      { label: "Shape", value: shapeDescription(item) },
      { label: "Size", value: sizeLabel(item.shape, item.size) },
      { label: "Quantity", value: String((item.quantity ?? 1) * boxCount(item)) },
    ],
    columnB: [
      { label: "Base Flavour", value: item.flavours?.length ? item.flavours.map(flavourLabel).join(", ") : NONE },
      { label: "Colors", value: colors.length ? colors.join(", ") : NONE },
      { label: "Text", value: cakeText },
      { label: "Dietary Requirements", value: dietaryText(item.dietaryRequirements) },
    ],
    detailRows,
    referenceImages: item.referenceImages ?? [],
  };
}

function buildCnyItem(item: any): PdfItem {
  return {
    imageSrc: item.image,
    columnA: [
      { label: "Design", value: item.name },
      { label: "Edition", value: item.edition },
      { label: "Size", value: item.size },
      { label: "Quantity", value: String(item.quantity ?? 1) },
    ],
    columnB: [
      { label: "Base Flavour", value: item.flavor || NONE },
      { label: "Dietary Requirements", value: dietaryText(item.dietaryRequirements) },
    ],
    detailRows: [],
    referenceImages: [],
  };
}

export function buildOrderPdfModel(order: PdfOrder): PdfOrderModel {
  const isDelivery = order.deliveryMethod === "delivery";
  const orderNumber = order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`;
  const email = order.customerEmail ?? "";

  // Pickup orders have no delivery address; the block carries the customer's
  // own name/phone/email instead. Delivery orders use the recipient's details
  // (falling back to the customer's when they weren't given separately).
  const deliveryContact: PdfContact = isDelivery
    ? {
        name: order.recipientName || order.customerName,
        lines: deliveryLines(order.deliveryAddress),
        phone: order.recipientPhone || order.customerPhone,
        email,
      }
    : {
        name: order.customerName,
        lines: [],
        phone: order.customerPhone,
        email,
      };

  return {
    orderNumber,
    orderDate: formatDate(order.createdAt),
    billTo: {
      name: order.customerName,
      lines: billingLines(order.billingAddress),
      phone: order.customerPhone,
      email,
    },
    items: (order.items as any[]).map((item) => (item.collection === "cny" ? buildCnyItem(item) : buildCustomItem(item))),
    subtotal: formatMoney(order.subtotal),
    deliveryFee: order.deliveryFee > 0 ? formatMoney(order.deliveryFee) : "Free",
    total: formatMoney(order.total),
    isDelivery,
    deliveryContact,
    fulfilmentDate: formatDate(order.fulfillmentDate),
    fulfilmentTime: formatTimeRange(order.timeRange),
    notes: order.notes ?? "",
  };
}
