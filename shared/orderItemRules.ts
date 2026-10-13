// Rules for editing a custom order item in the admin dashboard — which
// options go together, mirroring what the customer-facing builder
// (Customize.tsx) allows: shapes per format, sizes per shape, flavour counts
// for platters, cheesecake eligibility, and the price list.
import {
  THEMES,
  SHAPE_SIZES,
  CAKE_SHAPES,
  PLATTER_FORMAT_SHAPES,
  GIFT_BOX_FORMAT_SHAPES,
  BASE_FLAVORS,
  FLOWERS,
  SPORTS_THEME,
  TEXT_THEMES,
  CAKE_ONLY_THEMES,
} from "../client/src/lib/customizeOptions";
import { getCustomOrderPriceForThemes } from "./customOrderPricing";
import { boxCount } from "./orderLabels";

// Stored custom items are loose JSON; the admin edits them field by field.
export type EditableCustomItem = Record<string, any>;

export const MAX_FLOWERS = 5;
export const COLOR_SLOTS = 3;

export function shapesForFormat(format: string) {
  return format === "cake" ? CAKE_SHAPES : format === "jellyPlatter" ? PLATTER_FORMAT_SHAPES : GIFT_BOX_FORMAT_SHAPES;
}

/** Hand Drawn and Name and Initial are cake-only; platters and gift boxes don't offer them. */
export function themesForFormat(format: string) {
  return format === "cake" ? THEMES : THEMES.filter((t) => !CAKE_ONLY_THEMES.includes(t.value));
}

export function requiredFlavourCount(shape: string): number {
  if (shape === "platter9") return 3;
  if (shape === "platter6" || shape === "platter4") return 2;
  return 1;
}

export function maxPlatterShapes(shape: string, size: string): number {
  if (size !== "6cm") return 0;
  if (shape === "platter9" || shape === "platter6") return 3;
  if (shape === "platter4") return 2;
  return 0;
}

/** Cheesecake: a plain 6"/8" round cake, a 6cm round platter piece, or the cupcake gift box. */
export function isCheesecakeEligible(item: EditableCustomItem): boolean {
  const { format, shape, size, platterShapes } = item;
  if (format === "cake") return shape === "round" && (size === "6inch" || size === "8inch");
  if (format === "jellyPlatter") {
    return (
      (shape === "platter9" || shape === "platter6" || shape === "platter4") &&
      size === "6cm" &&
      Array.isArray(platterShapes) &&
      platterShapes.includes("circle")
    );
  }
  if (format === "miniGiftBox") return shape === "cupcake";
  return false;
}

export function flavourChoices(item: EditableCustomItem) {
  return isCheesecakeEligible(item) ? BASE_FLAVORS : BASE_FLAVORS.filter((f) => f.value !== "Cheesecake");
}

/** Numbers shape stores "1,8" or "8": how many digits the cake carries. */
export function numberCountOf(item: EditableCustomItem): 1 | 2 {
  return item.numbers === undefined || String(item.numbers).includes(",") ? 2 : 1;
}

export function numberDigits(item: EditableCustomItem): [string, string] {
  const parts = String(item.numbers ?? "").split(",");
  return [parts[0] ?? "", parts[1] ?? ""];
}

export function buildNumbers(count: 1 | 2, first: string, second: string): string {
  return count === 2 ? `${first},${second}` : first;
}

/**
 * The price list's price for this item (all its boxes, for a multi-box order), or null if it has none.
 * A design that combines two themes is priced at the more expensive theme.
 */
export function unitPrice(item: EditableCustomItem): number | null {
  const price = getCustomOrderPriceForThemes(
    [item.theme, item.secondTheme],
    item.shape,
    item.size,
    item.shape === "numbers" ? numberCountOf(item) : undefined
  );
  if (price === null) return null;
  // A multi-box Mini Gift Box order is one item priced for all its boxes.
  return Number((price * boxCount(item)).toFixed(2));
}

const PRICE_FIELDS = ["format", "theme", "secondTheme", "shape", "size", "numbers", "boxes"] as const;

function pricingChanged(before: EditableCustomItem, after: EditableCustomItem): boolean {
  return PRICE_FIELDS.some((field) => before[field] !== after[field]);
}

/**
 * Applies a change to one item and fixes everything that depends on it, the
 * same way the builder resets later steps: a new format picks a valid shape, a
 * new shape picks a valid size, platter pieces and flavours are trimmed to
 * what the new choice allows, and theme-specific extras are cleared when the
 * theme changes. The price follows the price list only when something that
 * affects price changed, so a hand-set price survives unrelated edits.
 */
export function applyItemChange(item: EditableCustomItem, changes: EditableCustomItem): EditableCustomItem {
  const next: EditableCustomItem = { ...item, ...changes };

  if (!shapesForFormat(next.format).some((s) => s.value === next.shape)) {
    next.shape = shapesForFormat(next.format)[0].value;
  }
  const sizes = SHAPE_SIZES[next.shape] ?? [];
  if (!sizes.some((s) => s.value === next.size)) next.size = sizes[0]?.value ?? "";

  if (!themesForFormat(next.format).some((t) => t.value === next.theme)) {
    next.theme = themesForFormat(next.format)[0].value;
  }
  next.themeLabel = THEMES.find((t) => t.value === next.theme)?.label ?? next.theme;

  // An optional second theme: it must differ from the first and be offered for this format.
  if (next.secondTheme && (next.secondTheme === next.theme || !themesForFormat(next.format).some((t) => t.value === next.secondTheme))) {
    next.secondTheme = undefined;
  }
  next.secondThemeLabel = next.secondTheme ? (THEMES.find((t) => t.value === next.secondTheme)?.label ?? next.secondTheme) : undefined;

  const maxShapes = maxPlatterShapes(next.shape, next.size);
  next.platterShapes = maxShapes > 0 ? (next.platterShapes ?? []).slice(0, maxShapes) : undefined;

  if (next.shape === "numbers") {
    if (next.numbers === undefined) next.numbers = buildNumbers(2, "", "");
  } else {
    next.numbers = undefined;
  }

  const count = requiredFlavourCount(next.shape);
  const allowed = new Set(flavourChoices(next).map((f) => f.value));
  next.flavours = Array.from({ length: count }, (_, i) => {
    const flavour = (next.flavours ?? [])[i];
    return flavour && allowed.has(flavour) ? flavour : "";
  });

  // Only Mini Gift Boxes come in several boxes, and that is still ONE item (quantity 1).
  next.quantity = 1;
  next.boxes = next.format === "miniGiftBox" && Number(next.boxes) > 1 ? Math.floor(Number(next.boxes)) : undefined;

  // Each theme's extras are kept only while one of the chosen themes still asks for them.
  const hasTheme = (value: string) => next.theme === value || next.secondTheme === value;
  if (!hasTheme("floralBouquet")) next.selectedFlowers = undefined;
  if (!hasTheme("cartoonCharacters")) next.cartoonCharacter = undefined;
  if (!hasTheme(SPORTS_THEME)) next.sport = undefined;
  if (!hasTheme("coutureFashion")) next.fashionBrand = undefined;
  // Typed text belongs to a theme slot (a design may combine Hand Drawn with Name and Initial).
  if (!TEXT_THEMES.includes(next.theme)) next.themeCustomText = undefined;
  if (!next.secondTheme || !TEXT_THEMES.includes(next.secondTheme)) next.secondThemeCustomText = undefined;

  if (pricingChanged(item, next)) {
    const price = unitPrice(next);
    if (price !== null) next.price = price;
  }
  return next;
}

/** Flower names that exist in the builder; anything else already on an order is kept as-is. */
export const FLOWER_VALUES = FLOWERS.map((f) => f.value);

/** Returns what's wrong with an edited item, or null if it can be saved. */
export function validateCustomItem(item: EditableCustomItem): string | null {
  if (!item.theme || !item.shape || !item.size) return "Choose a theme, shape and size";
  const needed = requiredFlavourCount(item.shape);
  const flavours = (item.flavours ?? []).filter(Boolean);
  if (flavours.length < needed) return `Choose ${needed === 1 ? "a flavour" : `${needed} flavours`}`;
  if (maxPlatterShapes(item.shape, item.size) > 0 && !(item.platterShapes ?? []).length) {
    return "Choose at least one platter shape";
  }
  if (item.shape === "numbers") {
    const [first, second] = numberDigits(item);
    if (first === "" || (numberCountOf(item) === 2 && second === "")) return "Enter the number(s) for the cake";
  }
  if (!(Number(item.price) >= 0)) return "Enter a valid price";
  return null;
}
