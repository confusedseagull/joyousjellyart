import { ENV } from "./_core/env";
import type { Order, OrderItem } from "../drizzle/schema";

const RESEND_API_URL = "https://api.resend.com/emails";

const BRAND_TEAL = "#6fa4a6";
const BRAND_BROWN = "#603b17";
const BORDER_COLOR = "#e5e5e5";
const MUTED_TEXT = "#6d726e";

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

// Turns a raw camelCase/underscore value (e.g. "cartoonCharacters") into
// readable text ("Cartoon Characters") for older orders whose stored item
// never had a themeLabel saved alongside the raw theme slug.
function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Item name shown in place of a generic "Custom Cake" label, e.g. "Floral
// Bouquet Cake" or "Space Mini Gift Box" — the theme and format the
// customer actually chose.
function itemNameFor(item: Extract<OrderItem, { collection: "custom" }>): string {
  const themeLabel = item.themeLabel || humanize(item.theme);
  const formatLabel = FORMAT_LABELS[item.format] || humanize(item.format);
  return `${themeLabel} ${formatLabel}`;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend's API. Throws on a non-OK response, matching
 * createPaymentRequest's error-handling pattern in server/hitpay.ts.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.orderEmailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }
}

function renderItemRow(item: OrderItem): string {
  if (item.collection === "cny") {
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${BORDER_COLOR};">
          <p style="margin: 0 0 4px; font-weight: 600; color: #1a1e1b;">${item.name}</p>
          <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">${item.edition}</p>
          <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">Size: ${item.size} &middot; Flavour: ${item.flavor}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED_TEXT};">Qty: ${item.quantity} &middot; ${formatPrice(item.price)} each</p>
        </td>
      </tr>`;
  }

  const formatLabel = FORMAT_LABELS[item.format] || item.format;
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${BORDER_COLOR};">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1a1e1b;">${itemNameFor(item)}</p>
        <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">${formatLabel} &middot; ${item.shape} &middot; ${item.size}</p>
        <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">Theme: ${item.themeLabel || humanize(item.theme)} &middot; Flavour: ${item.flavours.join(", ")}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED_TEXT};">Qty: ${item.quantity} &middot; ${formatPrice(item.price)} each</p>
      </td>
    </tr>`;
}

/**
 * Builds the payment-confirmation email HTML. Uses inline styles and
 * email-safe font stacks (Georgia/serif, system sans-serif) rather than the
 * app's Fraunces/Karla web fonts, since email clients strip <style> blocks
 * and don't reliably load custom fonts.
 */
export function buildOrderConfirmationEmailHtml(order: Order): string {
  const baseUrl = process.env.PUBLIC_URL || "http://localhost:3000";
  const confirmationUrl = `${baseUrl}/order-confirmation?order=${order.orderNumber}`;
  const fulfillmentDate = new Date(order.fulfillmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemRows = order.items.map(renderItemRow).join("");

  const deliveryLine =
    order.deliveryMethod === "delivery" && order.deliveryAddress
      ? `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Delivery to: ${order.deliveryAddress}</p>`
      : `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Pickup: 2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846</p>`;

  return `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1e1b;">
  <h1 style="font-size: 24px; margin: 0 0 8px;">Payment confirmed</h1>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${MUTED_TEXT}; margin: 0 0 24px;">
    Thank you, ${order.customerName} &mdash; your order <strong>${order.orderNumber}</strong> is confirmed.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
    ${itemRows}
  </table>

  <table style="width: 100%; margin-top: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">Subtotal</td>
      <td style="text-align: right; padding: 4px 0;">${formatPrice(order.subtotal)}</td>
    </tr>
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">${order.deliveryMethod === "delivery" ? "Delivery" : "Pickup"}</td>
      <td style="text-align: right; padding: 4px 0;">${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "FREE"}</td>
    </tr>
    <tr>
      <td style="font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">Total</td>
      <td style="text-align: right; font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">${formatPrice(order.total)}</td>
    </tr>
  </table>

  <div style="margin-top: 24px; font-family: Arial, Helvetica, sans-serif;">
    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">Fulfillment</p>
    <p style="margin: 0; font-size: 14px; color: #1a1e1b;">${fulfillmentDate}${order.timeRange ? ` &middot; ${order.timeRange}` : ""}</p>
    ${deliveryLine}
  </div>

  <a href="${confirmationUrl}" style="display: inline-block; margin-top: 28px; padding: 12px 24px; background: ${BRAND_TEAL}; color: #ffffff; text-decoration: none; border-radius: 999px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    View your order
  </a>

  <p style="margin-top: 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: ${MUTED_TEXT};">
    Joyous JellyArt &middot; Handcrafted Jellies, Crafted Memories, Joyous Moments
  </p>
</div>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!order.customerEmail) return;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed - Joyous Jelly Art`,
    html: buildOrderConfirmationEmailHtml(order),
  });
}

/**
 * Builds the order-received email HTML — sent the moment an order is
 * created, before any payment is confirmed (payment is now manual PayNow/
 * bank transfer, not an automatic HitPay webhook). Distinct from
 * buildOrderConfirmationEmailHtml above, which is the "payment confirmed"
 * email sent once an admin marks the order paid.
 */
export function buildOrderReceivedEmailHtml(order: Order): string {
  const baseUrl = process.env.PUBLIC_URL || "http://localhost:3000";
  const confirmationUrl = `${baseUrl}/order-confirmation?order=${order.orderNumber}`;
  const fulfillmentDate = new Date(order.fulfillmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemRows = order.items.map(renderItemRow).join("");

  const deliveryLine =
    order.deliveryMethod === "delivery" && order.deliveryAddress
      ? `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Delivery to: ${order.deliveryAddress}</p>`
      : `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Pickup: 2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846</p>`;

  return `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1e1b;">
  <h1 style="font-size: 24px; margin: 0 0 8px;">We have received your order</h1>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${MUTED_TEXT}; margin: 0 0 24px;">
    Thank you, ${order.customerName} &mdash; your order <strong>${order.orderNumber}</strong> has been received.
    Please complete payment via PayNow or bank transfer below, then send us a screenshot on WhatsApp to confirm.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
    ${itemRows}
  </table>

  <table style="width: 100%; margin-top: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">Subtotal</td>
      <td style="text-align: right; padding: 4px 0;">${formatPrice(order.subtotal)}</td>
    </tr>
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">${order.deliveryMethod === "delivery" ? "Delivery" : "Pickup"}</td>
      <td style="text-align: right; padding: 4px 0;">${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "FREE"}</td>
    </tr>
    <tr>
      <td style="font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">Total</td>
      <td style="text-align: right; font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">${formatPrice(order.total)}</td>
    </tr>
  </table>

  <div style="margin-top: 24px; font-family: Arial, Helvetica, sans-serif;">
    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">Fulfillment</p>
    <p style="margin: 0; font-size: 14px; color: #1a1e1b;">${fulfillmentDate}${order.timeRange ? ` &middot; ${order.timeRange}` : ""}</p>
    ${deliveryLine}
  </div>

  <div style="margin-top: 28px; padding: 20px; background: #faf7f3; border-radius: 16px; font-family: Arial, Helvetica, sans-serif;">
    <p style="margin: 0 0 12px; font-size: 15px; font-weight: 700;">Payment details</p>
    <img src="${baseUrl}/paynow-qr-email.png" alt="PayNow QR code" width="160" style="display: block; border-radius: 12px; margin-bottom: 12px;" />
    <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #1a1e1b;">PayNow</p>
    <p style="margin: 0 0 16px; font-size: 13px; color: ${MUTED_TEXT};">
      PROMETHEAN CONCEPT LLP<br />
      UEN: T22LL0093A
    </p>
    <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #1a1e1b;">Bank Transfer</p>
    <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">
      Beneficiary Name: PROMETHEAN CONCEPT LLP<br />
      Bank Account Number: 324-316261-9<br />
      Bank Name: United Overseas Bank Limited<br />
      Bank Address: 80 Raffles Place, Singapore 048624<br />
      SWIFT: UOVBSGSG
    </p>
  </div>

  <a href="${confirmationUrl}" style="display: inline-block; margin-top: 28px; padding: 12px 24px; background: ${BRAND_TEAL}; color: #ffffff; text-decoration: none; border-radius: 999px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    View order &amp; send payment screenshot
  </a>

  <p style="margin-top: 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: ${MUTED_TEXT};">
    Joyous JellyArt &middot; Handcrafted Jellies, Crafted Memories, Joyous Moments
  </p>
</div>`;
}

export async function sendOrderReceivedEmail(order: Order): Promise<void> {
  if (!order.customerEmail) return;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} received - Joyous Jelly Art`,
    html: buildOrderReceivedEmailHtml(order),
  });
}
