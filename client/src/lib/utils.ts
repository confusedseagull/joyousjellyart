import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Strips a parenthetical instruction suffix (e.g. "6cm (Choose up to 3
 * shapes: Heart, Square, Round, Clover)") down to just the dimension. That
 * suffix is customer-facing guidance for the Customize builder's own size
 * picker — redundant (and clutter) anywhere else the size label is reused,
 * like an order summary or the admin order detail page.
 */
export function shortSizeLabel(sizeLabel: string): string {
  return sizeLabel.replace(/\s*\(.*\)$/, "");
}

/**
 * Builds a WhatsApp deep-link (wa.me) from a free-text phone number.
 * Strips everything but digits; an 8-digit result (a bare local number
 * typed without a country code) gets Singapore's "65" prepended, matching
 * the "+65 8123 4567" placeholder format used throughout the checkout form.
 * Returns null if there aren't enough digits to be a real number.
 */
export function toWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8) digits = `65${digits}`;
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
