import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, Package, Clock3, Truck, Store } from "lucide-react";
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

const FORMAT_LABELS: Record<string, string> = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box",
};

const DAYS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
] as const;

function itemQuickSummary(item: OrderItem): string {
  if (item.collection === "custom") {
    return `${FORMAT_LABELS[item.format] || item.format} · ${item.theme} · ${item.shape}, ${item.size}`;
  }
  return `${item.name} · ${item.size}`;
}

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
    <div className={`border border-[#e5e5e5] bg-[#faf7f3] rounded-2xl p-5 flex items-center gap-4 ${href ? "hover:border-primary/40 transition-colors" : ""}`}>
      <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-[#603b17]" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />
        ) : (
          <p className="font-display text-3xl leading-tight">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#6fa4a6" },
};

export default function DashboardOverview() {
  const [day, setDay] = useState<"today" | "tomorrow">("today");

  const { data: stats, isLoading: statsLoading } = trpc.orders.getDashboardStats.useQuery();
  const { data: dayOrders, isLoading: dayLoading } = trpc.orders.getOrdersForDay.useQuery({ day });
  const { data: revenueTrend, isLoading: revenueLoading } = trpc.orders.getRevenueTrend.useQuery({ days: 30 });

  const upcomingCount = day === "today" ? stats?.upcomingToday : stats?.upcomingTomorrow;

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
      <div className="p-6 md:p-10 max-w-6xl">
        <h1 className="mb-1">Dashboard</h1>
        <p className="text-muted-foreground mb-8">A quick view of today's orders and business at a glance.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatTile label="New Orders Today" value={stats?.newOrdersToday} icon={Package} loading={statsLoading} href="/admin/orders" />
          <StatTile label={`Upcoming Orders (${day === "today" ? "Today" : "Tomorrow"})`} value={upcomingCount} icon={Clock3} loading={statsLoading} href="/admin/orders" />
        </div>

        <div className="bg-[#faf7f3] flex gap-1 h-[46px] items-center p-1 rounded-full w-fit mb-6">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDay(d.value)}
              className={`px-5 h-full rounded-full text-sm transition-colors ${
                day === d.value ? "bg-white text-foreground font-semibold shadow-sm" : "text-muted-foreground font-medium"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <section>
            <h2 className="font-display text-xl mb-4">Upcoming Orders</h2>
            {dayLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !dayOrders || dayOrders.length === 0 ? (
              <div className="border border-[#e5e5e5] rounded-2xl py-10 text-center text-muted-foreground text-sm">
                No orders scheduled for {day}.
              </div>
            ) : (
              <div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
                {dayOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="border border-[#e5e5e5] -mt-px first:mt-0 px-4 py-3 block hover:bg-[#faf7f3]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</span>
                      <span className="text-xs text-muted-foreground">{order.timeRange || "No time"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{order.customerName}</p>
                    <ul className="text-sm text-foreground space-y-0.5">
                      {order.items.map((item) => (
                        <li key={item.id}>{itemQuickSummary(item)}</li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl mb-4">Day's Schedule</h2>
            {dayLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : scheduleGroups.length === 0 ? (
              <div className="border border-[#e5e5e5] rounded-2xl py-10 text-center text-muted-foreground text-sm">
                Nothing scheduled for {day}.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {scheduleGroups.map(([timeRange, groupOrders]) => (
                  <div key={timeRange} className="border border-[#e5e5e5] rounded-2xl p-4">
                    <p className="font-display text-base mb-2">{timeRange}</p>
                    <div className="flex flex-col gap-2">
                      {groupOrders.map((order) => {
                        const Icon = order.deliveryMethod === "delivery" ? Truck : Store;
                        return (
                          <div key={order.id} className="flex items-start gap-2 text-sm">
                            <Icon className="h-4 w-4 text-[#603b17] mt-0.5 shrink-0" />
                            <span>
                              <span className="capitalize font-medium">{order.deliveryMethod}</span>
                              {order.deliveryMethod === "delivery" && order.deliveryAddress ? ` at ${order.deliveryAddress}` : ""}
                              {" — "}
                              <span className="text-muted-foreground">{order.customerName}</span>
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
          <h2 className="font-display text-xl mb-4">Revenue — Last 30 Days</h2>
          {revenueLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border border-[#e5e5e5] rounded-2xl p-5">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval={4} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} width={56} fontSize={12} tickFormatter={(v) => formatPrice(v)} />
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
      </div>
    </AdminLayout>
  );
}
