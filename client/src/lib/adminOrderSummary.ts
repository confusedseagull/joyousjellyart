import { THEMES, SHAPES, SHAPE_SIZES } from "@/lib/customizeOptions";
import { shortSizeLabel } from "@/lib/utils";

const THEME_LABEL: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.value, t.label]));
const SHAPE_LABEL: Record<string, string> = Object.fromEntries(SHAPES.map((s) => [s.value, s.label]));
const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

// One-line, human-readable description of an order item for lists, using the
// same customer-facing labels as the builder instead of raw option values.
export function itemQuickSummary(item: any): string {
  if (item.collection === "custom") {
    const size = shortSizeLabel(SHAPE_SIZES[item.shape]?.find((s) => s.value === item.size)?.label ?? item.size);
    return [
      FORMAT_LABELS[item.format] || item.format,
      THEME_LABEL[item.theme] || item.themeLabel || item.theme,
      `${SHAPE_LABEL[item.shape] || item.shape}, ${size}`,
    ].join(" · ");
  }
  return `${item.name} · ${item.size}`;
}
