import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { itemQuickSummary } from "@/lib/adminOrderSummary";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Package, Truck, Store, ChevronRight } from "lucide-react";
import { PageHeader, SectionTitle, Segmented, EmptyState, LoadingBlock, adminCard } from "@/components/admin/AdminUI";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type DayOrder = inferRouterOutputs<AppRouter>["orders"]["getOrdersForDay"][number];
type OrderItem = DayOrder["items"][number];

const DAYS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
] as const;

// Sorts time-range strings like "11:00 AM - 1:00 PM" chronologically by
// extracting the start time, mirroring the parsing already written for
// Cart.tsx's own slot handling.
function scheduleSortKey(range: string): number {
  const match = range.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function StatTile({ label, value, icon: Icon, loading, href }: { label: string; value: number | undefined; icon: typeof Package; loading: boolean; href?: string }) {
  const content = (
    <div className={`${adminCard} p-4 flex items-center gap-3 ${href ? "hover:border-neutral-300 transition-colors" : ""}`}>
      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 leading-tight">{label}</p>
        <p className="text-2xl font-semibold leading-tight tabular-nums">{loading ? "–" : (value ?? 0)}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#4b8385" },
};

export default function DashboardOverview() {
  const [day, setDay] = useState<"today" | "tomorrow">("today");

  const { data: stats, isLoading: statsLoading } = trpc.orders.getDashboardStats.useQuery();
  const { data: dayOrders, isLoading: dayLoading } = trpc.orders.getOrdersForDay.useQuery({ day });
  const { data: revenueTrend, isLoading: revenueLoading } = trpc.orders.getRevenueTrend.useQuery({ days: 30 });

  const dayOptions = DAYS.map((d) => ({
    ...d,
    hint: stats ? formatPrice(d.value === "today" ? stats.totalToday : stats.totalTomorrow) : undefined,
  }));

  const scheduleGroups = useMemo(() => {
    if (!dayOrders) return [];
    const map = new Map<string, DayOrder[]>();
    for (const order of dayOrders) {
      const key = order.timeRange || "No time specified";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(order);
    }
    return Array.from(map.entries()).sort((a, b) => scheduleSortKey(a[0]) - scheduleSortKey(b[0]));
  }, [dayOrders]);

  const chartData = useMemo(
    () => (revenueTrend || []).map((point) => ({ ...point, label: format(new Date(`${point.date}T00:00:00`), "d MMM") })),
    [revenueTrend]
  );

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="Today's orders and business at a glance." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
        <StatTile label="New Orders Received Today" value={stats?.newOrdersToday} icon={Package} loading={statsLoading} href="/admin/orders" />
      </div>

      <Segmented options={dayOptions} value={day} onChange={setDay} className="w-full sm:w-72 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section>
          <SectionTitle>Orders</SectionTitle>
          {dayLoading ? (
            <LoadingBlock />
          ) : !dayOrders || dayOrders.length === 0 ? (
            <EmptyState>No orders scheduled for {day}.</EmptyState>
          ) : (
            <div className={`${adminCard} divide-y divide-neutral-200 max-h-[420px] overflow-y-auto`}>
              {dayOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</span>
                      <span className="text-xs text-neutral-500">{order.timeRange || "No time"}</span>
                    </div>
                    <p className="text-sm text-neutral-600">{order.customerName}</p>
                    <ul className="mt-1 text-xs text-neutral-500 space-y-0.5">
                      {order.items.map((item) => (
                        <li key={item.id}>{itemQuickSummary(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300 mt-1 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Schedule</SectionTitle>
          {dayLoading ? (
            <LoadingBlock />
          ) : scheduleGroups.length === 0 ? (
            <EmptyState>Nothing scheduled for {day}.</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {scheduleGroups.map(([timeRange, groupOrders]) => (
                <div key={timeRange} className={`${adminCard} p-4`}>
                  <p className="text-sm font-semibold mb-2">{timeRange}</p>
                  <div className="flex flex-col gap-2">
                    {groupOrders.map((order) => {
                      const Icon = order.deliveryMethod === "delivery" ? Truck : Store;
                      return (
                        <div key={order.id} className="flex items-start gap-2 text-sm">
                          <Icon className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="capitalize font-medium">{order.deliveryMethod}</span>
                            {order.deliveryMethod === "delivery" && order.deliveryAddress ? ` at ${order.deliveryAddress}` : ""}
                            <span className="text-neutral-500"> · {order.customerName}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <SectionTitle>Revenue · last 30 days</SectionTitle>
        {revenueLoading ? (
          <LoadingBlock />
        ) : (
          <div className={`${adminCard} p-4`}>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eeeeee" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={4} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatPrice(Number(value))}
                      labelKey="label"
                    />
                  }
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
