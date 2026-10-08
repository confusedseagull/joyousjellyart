import { formatLabel, themeLabel, shapeLabel, sizeLabel } from "../../../shared/orderLabels";

// One-line, human-readable description of an order item for lists, using the
// same customer-facing names as the builder and the customer's emails.
export function itemQuickSummary(item: any): string {
  if (item.collection === "custom") {
    return [
      formatLabel(item.format),
      themeLabel(item.theme, item.themeLabel),
      `${shapeLabel(item.shape)}, ${sizeLabel(item.shape, item.size)}`,
    ].join(" · ");
  }
  return `${item.name} · ${item.size}`;
}
