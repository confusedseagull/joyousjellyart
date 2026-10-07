import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Shared building blocks for the admin dashboard so every screen uses the same
// radii, borders, type scale and status colours.

export const adminCard = "rounded-lg border border-neutral-200 bg-white";

// The stored status values predate the current wording, so they keep their
// original names in the database (no migration needed) and only the labels
// differ: pending_confirmation = Pending Payment, in_progress = Order
// Confirmed, completed = Order Fulfilled; cancelled is its own value. Legacy "pending" and "delivered"
// rows fold into the nearest of the three.
export const STATUS_OPTIONS = [
  { value: "pending_confirmation", label: "Pending Payment" },
  { value: "in_progress", label: "Order Confirmed" },
  { value: "completed", label: "Order Fulfilled" },
  { value: "cancelled", label: "Order Cancelled" },
] as const;

export function normalizeStatus(status: string): string {
  if (status === "pending") return "pending_confirmation";
  if (status === "delivered") return "completed";
  return status;
}

export const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  pending_confirmation: { badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  in_progress: { badge: "bg-blue-50 text-blue-800 ring-blue-200", dot: "bg-blue-500" },
  completed: { badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { badge: "bg-red-50 text-red-700 ring-red-300", dot: "bg-red-500" },
};

export function statusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  return STATUS_OPTIONS.find((s) => s.value === normalized)?.label ?? status;
}

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const style = STATUS_STYLES[normalizeStatus(status)] ?? { badge: "bg-neutral-100 text-neutral-700 ring-neutral-200", dot: "bg-neutral-400" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium ring-1 ring-inset whitespace-nowrap ${style.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {statusLabel(status)}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5 md:mb-6">
      <div className="min-w-0">
        <h1>{title}</h1>
        {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2>{children}</h2>
      {aside}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const hasHints = options.some((o) => o.hint);
  return (
    <div className={`inline-flex rounded-lg bg-neutral-200/60 p-0.5 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-w-0 flex-1 px-3 sm:px-4 rounded-md text-sm transition-colors flex flex-col items-center justify-center ${
            hasHints ? "h-12" : "h-8"
          } ${value === o.value ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}
        >
          <span className="leading-tight">{o.label}</span>
          {o.hint && (
            <span className={`text-[11px] leading-tight tabular-nums font-normal ${value === o.value ? "text-neutral-500" : "text-neutral-400"}`}>
              {o.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={`${adminCard} py-10 px-4 text-center text-sm text-neutral-500`}>{children}</div>;
}

export function LoadingBlock() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

/** Label above a value, for read-only detail views. */
export function DetailField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs font-medium text-neutral-500 mb-0.5">{label}</p>
      <div className="text-sm text-neutral-900 break-words">{children}</div>
    </div>
  );
}

export const adminInput =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export const adminButton =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md border border-neutral-300 bg-white text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed";

export const adminButtonPrimary =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed";
