import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { itemQuickSummary } from "@/lib/adminOrderSummary";
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
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHeader, Segmented, LoadingBlock, adminCard, adminButton } from "@/components/admin/AdminUI";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type DateOrder = inferRouterOutputs<AppRouter>["orders"]["getOrdersByDate"][number];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Shared order-card content for both the month view's side sheet (stacked
// full-width) and the week view's horizontal panel (fixed-width, in a row).
function OrderDayCard({ order, className }: { order: DateOrder; className?: string }) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className={`${adminCard} p-3.5 hover:border-neutral-300 transition-colors block ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</span>
        <span className="text-xs text-neutral-500">{order.timeRange || "No time"}</span>
      </div>
      <p className="text-sm text-neutral-600">
        {order.customerName} <span className="text-neutral-400">·</span> <span className="capitalize">{order.deliveryMethod}</span>
      </p>
      <ul className="mt-1 text-xs text-neutral-500 space-y-0.5">
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

  const VIEW_OPTIONS = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ] as const;

  return (
    <AdminLayout>
      <PageHeader title="Calendar" description="Order volume by day. Tap a day to see its orders." />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrev} aria-label="Previous" className={`${adminButton} !px-0 w-9`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={goNext} aria-label="Next" className={`${adminButton} !px-0 w-9`}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={goToday} className={adminButton}>
            Today
          </button>
          <h2 className="ml-1 text-base">
            {view === "month" ? format(anchorDate, "MMMM yyyy") : `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`}
          </h2>
        </div>
        <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} className="w-full sm:w-44" />
      </div>

      <div className={`${adminCard} overflow-hidden`}>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-b border-neutral-200 bg-neutral-50 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-neutral-500"
            >
              {label}
            </div>
          ))}
          {days.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const count = countByDate.get(dateStr) ?? 0;
            const inCurrentMonth = view === "week" || isSameMonth(day, anchorDate);
            const today = isToday(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const lastCol = i % 7 === 6;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`min-w-0 border-b border-neutral-200 ${lastCol ? "" : "border-r"} text-left p-1.5 sm:p-2.5 flex flex-col items-start gap-1.5 transition-colors hover:bg-neutral-50 ${
                  view === "month" ? "min-h-[72px] sm:min-h-[96px]" : "min-h-[120px]"
                } ${selected ? "bg-primary/10" : inCurrentMonth ? "bg-white" : "bg-neutral-50/60"}`}
              >
                <span
                  className={`text-xs sm:text-sm h-6 min-w-6 px-1 inline-flex items-center justify-center rounded-full ${
                    today
                      ? "bg-primary text-primary-foreground font-medium"
                      : inCurrentMonth
                        ? "text-neutral-900"
                        : "text-neutral-400"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <span className="inline-flex items-center h-5 px-1.5 rounded bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
                    {count}
                    <span className="hidden sm:inline">&nbsp;order{count > 1 ? "s" : ""}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {countsLoading && <LoadingBlock />}

      {/* Week view: an inline panel below the grid; month view uses the side sheet. */}
      {view === "week" && selectedDate && (
        <div className={`${adminCard} mt-5 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm">{format(selectedDate, "EEEE, d MMMM yyyy")}</h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Close"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {dayLoading ? (
            <LoadingBlock />
          ) : !dayOrders || dayOrders.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No orders due this day.</p>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
              {dayOrders.map((order) => (
                <OrderDayCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}

      <Sheet open={view === "month" && !!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="right" className="admin-ui w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">
              {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 flex flex-col gap-2.5">
            {dayLoading ? (
              <LoadingBlock />
            ) : !dayOrders || dayOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center">No orders due this day.</p>
            ) : (
              dayOrders.map((order) => <OrderDayCard key={order.id} order={order} />)
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
