// Customer-facing names for the options chosen in the customise flow.
//
// Orders store raw option values ("2tier_6_8", "teddyBear", "noDairy"); anywhere
// a customer reads about their order (emails, confirmation page, WhatsApp
// message) those must be shown exactly as they were named while customising,
// never as the stored values. Every lookup resolves against the same option
// lists the builder renders, so a rename there flows through automatically.
import {
  THEMES,
  SHAPES,
  SHAPE_SIZES,
  BASE_FLAVORS,
  PLATTER_INDIVIDUAL_SHAPES,
  DIETARY_OPTIONS,
} from "../client/src/lib/customizeOptions";

export const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

/** Last-resort readable text for a raw value with no matching option: "teddyBear" -> "Teddy Bear". */
export function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? humanize(format);
}

export function themeLabel(theme: string, storedLabel?: string): string {
  return THEMES.find((t) => t.value === theme)?.label ?? storedLabel ?? humanize(theme);
}

/**
 * A Mini Gift Box order for several boxes is ONE order item: its price is the
 * price of all the boxes together, its quantity stays 1, and `boxes` records
 * how many boxes to make.
 */
export function boxCount(item: { format?: string; boxes?: number }): number {
  return item.format === "miniGiftBox" && Number(item.boxes) > 1 ? Math.floor(Number(item.boxes)) : 1;
}

/** "Mini Gift Box", or "Mini Gift Box (3 boxes)" for a multi-box order. */
export function formatText(item: { format: string; boxes?: number }): string {
  const boxes = boxCount(item);
  return boxes > 1 ? `${formatLabel(item.format)} (${boxes} boxes)` : formatLabel(item.format);
}

/** The item's headline: "Space Cake", or "3 Mini Gift Boxes - Space" for a multi-box order. */
export function itemTitle(item: { format: string; theme: string; themeLabel?: string; boxes?: number }): string {
  const boxes = boxCount(item);
  const theme = themeLabel(item.theme, item.themeLabel);
  return boxes > 1 ? `${boxes} Mini Gift Boxes - ${theme}` : `${theme} ${formatLabel(item.format)}`;
}

export function shapeLabel(shape: string): string {
  return SHAPES.find((s) => s.value === shape)?.label ?? humanize(shape);
}

export function platterShapeLabel(value: string): string {
  return PLATTER_INDIVIDUAL_SHAPES.find((s) => s.value === value)?.label ?? humanize(value);
}

// Size values are only unique within a shape ("8inch" means different real
// dimensions per shape), so the lookup is scoped to the item's shape. The
// parenthetical hint some labels carry ("6cm (Choose up to 3 shapes: ...)")
// is builder guidance, not part of the size, so it's dropped.
export function sizeLabel(shape: string, size: string): string {
  const label = SHAPE_SIZES[shape]?.find((s) => s.value === size)?.label ?? humanize(size);
  return label.replace(/\s*\(.*\)$/, "");
}

export function flavourLabel(flavour: string): string {
  return BASE_FLAVORS.find((f) => f.value === flavour)?.label ?? flavour;
}

export function dietaryLabels(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/,\s*/) : [];
  return raw
    .filter(Boolean)
    .map((v: string) => DIETARY_OPTIONS.find((d) => d.value === v)?.label ?? humanize(v));
}

/** "Heart" / "Platter of 9 (Heart, Round)" / "Numbers (1, 8)" — the shape line as chosen. */
export function shapeDescription(item: { shape: string; platterShapes?: string[]; numbers?: string }): string {
  const base = shapeLabel(item.shape);
  if (item.platterShapes?.length) return `${base} (${item.platterShapes.map(platterShapeLabel).join(", ")})`;
  if (item.numbers) return `${base} (${String(item.numbers).replace(/,\s*/g, ", ")})`;
  return base;
}
