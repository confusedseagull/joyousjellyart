import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
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
