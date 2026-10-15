// Custom Order Pricing Structure based on Theme + Shape + Size
// Source of truth: "Joyous Jelly Art Custom.xlsx" (Custom sheet)

export interface PriceEntry {
  round?: { [size: string]: number };
  square?: { [size: string]: number };
  octagon?: { [size: string]: number };
  heart?: { [size: string]: number };
  star?: { [size: string]: number };
  teddyBear?: { [size: string]: number };
  fan?: { [size: string]: number };
  rectangle?: { [size: string]: number };
  scalloped?: { [size: string]: number };
  sakura?: { [size: string]: number };
  platter9?: { [size: string]: number };
  platter6?: { [size: string]: number };
  platter4?: { [size: string]: number };
  numbers?: { [size: string]: number | { "1number": number; "2numbers": number } };
  miniGiftBox?: { [size: string]: number };
  cupcake?: { [size: string]: number };
  huatBox?: { [size: string]: number };
}

const floralBouquet: PriceEntry = {
  round: { "6inch": 88, "8inch": 108, "10inch": 158, "2tier_6_8": 138, "2tier_6_10": 168, "2tier_8_10": 188 },
  square: { "6inch": 88, "8inch": 108, "10inch": 158, "2tier_6_8": 138, "2tier_6_10": 168, "2tier_8_10": 188 },
  octagon: { "6inch": 88, "8inch": 108, "2tier_6_8": 138 },
  heart: { "7inch": 88, "8inch": 108, "10inch": 158, "2tier_7_8": 138, "2tier_7_10": 168, "2tier_8_10": 188 },
  star: { "10inch": 158 },
  teddyBear: { "10inch": 158 },
  fan: { "10inch": 158 },
  rectangle: { "10x7inch": 128 },
  scalloped: { "8inch": 108 },
  sakura: { "6inch": 88, "8inch": 108, "2tier_6_8": 138 },
  // Excel quotes a $108-$128 range for both Floral Bouquet and other-theme
  // Platter of 9 pricing; kept at the low/high ends of that range respectively
  // rather than guessing a single mid-point.
  platter9: { "6cm": 108 },
  platter6: { "6cm": 78 },
  platter4: { "6cm": 48, "10cm": 68 },
  numbers: { "8x8": { "1number": 108, "2numbers": 158 } },
  miniGiftBox: { "10cm": 18.90 },
  cupcake: { "6cm": 12.90 },
};

// All non-Floral-Bouquet themes (cartoonCharacters, handDrawn, lego, and every
// other custom theme via the getCustomOrderPrice fallback) share this pricing.
const otherCustomTheme: PriceEntry = {
  round: { "6inch": 99, "8inch": 118, "10inch": 138, "2tier_6_8": 138, "2tier_6_10": 168, "2tier_8_10": 188 },
  square: { "6inch": 99, "8inch": 118, "10inch": 138, "2tier_6_8": 138, "2tier_6_10": 168, "2tier_8_10": 188 },
  octagon: { "6inch": 99, "8inch": 118, "2tier_6_8": 148 },
  heart: { "7inch": 99, "8inch": 118, "10inch": 138, "2tier_7_8": 138, "2tier_7_10": 168, "2tier_8_10": 188 },
  star: { "10inch": 138 },
  teddyBear: { "10inch": 138 },
  fan: { "10inch": 138 },
  rectangle: { "10x7inch": 138 },
  scalloped: { "8inch": 118 },
  sakura: { "6inch": 99, "8inch": 118, "2tier_6_8": 138 },
  platter9: { "6cm": 128 },
  platter6: { "6cm": 78 },
  platter4: { "6cm": 48, "10cm": 68 },
  numbers: { "8x8": { "1number": 118, "2numbers": 158 } },
  miniGiftBox: { "10cm": 18.90 },
  cupcake: { "6cm": 12.90 },
};

// Mahjong is priced like any custom theme, plus its Huat Huat Box at a flat $128.
const mahjong: PriceEntry = { ...otherCustomTheme, huatBox: { standard: 128 } };

export const CUSTOM_ORDER_PRICING: { [theme: string]: PriceEntry } = {
  floralBouquet,
  cartoonCharacters: otherCustomTheme,
  handDrawn: otherCustomTheme,
  lego: otherCustomTheme,
  mahjong,
};

// Helper function to get price
export function getCustomOrderPrice(theme: string, shape: string, size: string, numberCount?: 1 | 2): number | null {
  const themeKey = theme as keyof typeof CUSTOM_ORDER_PRICING;
  const themePricing = CUSTOM_ORDER_PRICING[themeKey] || CUSTOM_ORDER_PRICING.lego; // Default to custom theme pricing

  if (!themePricing) return null;

  const shapeKey = shape as keyof PriceEntry;
  const shapePricing = themePricing[shapeKey];

  if (!shapePricing) return null;

  const priceValue = shapePricing[size];

  // Handle Numbers shape with 1 or 2 numbers pricing
  if (shape === "numbers" && typeof priceValue === "object" && priceValue !== null) {
    return numberCount === 1 ? priceValue["1number"] : priceValue["2numbers"];
  }

  return typeof priceValue === "number" ? priceValue : null;
}

/**
 * Price for a design that combines themes (one or two): the most expensive
 * theme's price applies. Returns null if none of the themes has a price for
 * this shape and size.
 */
export function getCustomOrderPriceForThemes(
  themes: string[],
  shape: string,
  size: string,
  numberCount?: 1 | 2
): number | null {
  const prices = themes
    .filter(Boolean)
    .map((theme) => getCustomOrderPrice(theme, shape, size, numberCount))
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.max(...prices) : null;
}

/**
 * The lowest and highest price a shape and size can have, across every theme. The size step comes before
 * the theme is chosen, so a size can only be quoted as a range (e.g. Floral Bouquet is cheaper than the
 * other themes). Returns null if no theme has a price for it.
 */
export function getCustomOrderPriceRange(
  shape: string,
  size: string,
  numberCount?: 1 | 2
): { min: number; max: number } | null {
  // Any theme without its own price list is priced like "lego", so one extra key covers all of them.
  const themes = [...Object.keys(CUSTOM_ORDER_PRICING), "anyOtherTheme"];
  const prices = themes
    .map((theme) => getCustomOrderPrice(theme, shape, size, numberCount))
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
}
