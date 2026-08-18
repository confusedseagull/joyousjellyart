import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type DateOrder = inferRouterOutputs<AppRouter>["orders"]["getOrdersByDate"][number];

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function itemQuickSummary(item: DateOrder["items"][number]): string {
  if (item.collection === "custom") {
    return `${FORMAT_LABELS[item.format] || item.format} · ${item.theme} · ${item.shape}, ${item.size}`;
  }
  return `${item.name} · ${item.size}`;
}

// Shared order-card content for both the month view's side sheet (stacked
// full-width) and the week view's horizontal panel (fixed-width, in a row).
function OrderDayCard({ order, className }: { order: DateOrder; className?: string }) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className={`border border-[#e5e5e5] rounded-2xl p-4 hover:border-primary/40 transition-colors block ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</span>
        <span className="text-xs text-muted-foreground">{order.timeRange || "No time"}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-1">
        {order.customerName} &middot; <span className="capitalize">{order.deliveryMethod}</span>
      </p>
      <ul className="text-sm text-foreground space-y-0.5">
        {order.items.map((item) => (
          <li key={item.id}>{itemQuickSummary(item)}</li>
        ))}
      </ul>
    </Link>
  );
}

export default function AdminCalendar() {
  const [view, setView] = useState<"week" | "month">("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const rangeStart = view === "month" ? startOfWeek(startOfMonth(anchorDate)) : startOfWeek(anchorDate);
  const rangeEnd = view === "month" ? endOfWeek(endOfMonth(anchorDate)) : endOfWeek(anchorDate);
  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd]);

  const { data: counts, isLoading: countsLoading } = trpc.orders.getOrderCountsForRange.useQuery({
    start: format(rangeStart, "yyyy-MM-dd"),
    end: format(rangeEnd, "yyyy-MM-dd"),
  });
  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    (counts || []).forEach((c) => map.set(c.date, c.count));
    return map;
  }, [counts]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: dayOrders, isLoading: dayLoading } = trpc.orders.getOrdersByDate.useQuery(
    { date: selectedDateStr! },
    { enabled: !!selectedDateStr }
  );

  function goPrev() {
    setAnchorDate((d) => (view === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  }
  function goNext() {
    setAnchorDate((d) => (view === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  }
  function goToday() {
    setAnchorDate(new Date());
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-6xl">
        <h1 className="mb-1">Calendar</h1>
        <p className="text-muted-foreground mb-8">See order volume by day and drill into a specific day's orders.</p>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#e5e5e5] hover:border-primary/40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-display text-xl min-w-[200px] text-center">
              {view === "month" ? format(anchorDate, "MMMM yyyy") : `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`}
            </h2>
            <button
              type="button"
              onClick={goNext}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#e5e5e5] hover:border-primary/40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="h-10 px-4 rounded-full border border-[#e5e5e5] text-sm font-medium hover:border-primary/40 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="bg-[#faf7f3] flex gap-1 h-[46px] items-center p-1 rounded-full w-fit">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-5 h-full rounded-full text-sm capitalize transition-colors ${
                  view === v ? "bg-white text-foreground font-semibold shadow-sm" : "text-muted-foreground font-medium"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-[#e5e5e5] rounded-2xl overflow-hidden">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r border-b border-[#e5e5e5] bg-[#faf7f3] py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const count = countByDate.get(dateStr) ?? 0;
            const inCurrentMonth = view === "week" || isSameMonth(day, anchorDate);
            const today = isToday(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`border-r border-b border-[#e5e5e5] text-left p-2 md:p-3 flex flex-col gap-2 transition-colors hover:bg-[#faf7f3]/60 ${
                  view === "month" ? "min-h-[100px]" : "min-h-[140px]"
                } ${selected ? "bg-primary/10" : inCurrentMonth ? "bg-white" : "bg-[#faf7f3]/40"}`}
              >
                <span
                  className={`text-sm ${
                    today
                      ? "h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      : inCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <span className="inline-flex items-center justify-center self-start px-2 py-0.5 rounded-full bg-[#eef3f0] text-[#426b57] text-xs font-semibold">
                    {count} order{count > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {countsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Week view: an inline horizontal panel below the grid, instead of
            the month view's side sheet — the day's orders read left-to-right
            in a scrollable row, matching the wide single-week layout above it. */}
        {view === "week" && selectedDate && (
          <div className="mt-6 border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">{format(selectedDate, "EEEE, d MMMM yyyy")}</h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {dayLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !dayOrders || dayOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No orders due this day.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {dayOrders.map((order) => (
                  <OrderDayCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Sheet open={view === "month" && !!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">
              {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 flex flex-col gap-3">
            {dayLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !dayOrders || dayOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No orders due this day.</p>
            ) : (
              dayOrders.map((order) => <OrderDayCard key={order.id} order={order} />)
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
