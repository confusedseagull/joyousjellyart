import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type Order = inferRouterOutputs<AppRouter>["orders"]["listByBucket"]["items"][number];

const BUCKETS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past" },
] as const;

const STATUS_OPTIONS = [
  { value: "pending_confirmation", label: "Pending Confirmation" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_STYLES: Record<string, string> = {
  pending_confirmation: "bg-[#fdf3e0] text-[#8a5a13]",
  in_progress: "bg-[#e3edf7] text-[#2c5a8a]",
  completed: "bg-[#e6f2ea] text-[#2f6b45]",
  delivered: "bg-[#efe6f7] text-[#6b3f9e]",
};

function orderCollections(order: Order): string[] {
  return Array.from(new Set((order.items || []).map((i) => i.collection)));
}

function itemSummary(order: Order): string {
  const count = order.items?.length || 0;
  return `${count} item${count === 1 ? "" : "s"}`;
}

export default function OrdersList() {
  const [, navigate] = useLocation();
  const [bucket, setBucket] = useState<"upcoming" | "today" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<"all" | "cny" | "custom">("all");
  const [sortBy, setSortBy] = useState<"fulfillmentDate" | "total" | "customerName">("fulfillmentDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Order[]>([]);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.orders.listByBucket.useQuery({
    bucket, search: search || undefined, collection, sortBy, sortDir, offset,
  });

  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.orders.listByBucket.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetAndSet<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setOffset(0);
    setAccumulated([]);
  }

  const orders = offset === 0 ? data?.items ?? [] : accumulated;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-6xl">
        <h1 className="mb-1">Orders</h1>
        <p className="text-muted-foreground mb-8">Browse, search, and update every order.</p>

        {/* Bucket toggle */}
        <div className="bg-[#faf7f3] flex gap-1 h-[46px] items-center p-1 rounded-full w-fit mb-6">
          {BUCKETS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => resetAndSet(setBucket, b.value)}
              className={`px-5 h-full rounded-full text-sm transition-colors ${
                bucket === b.value ? "bg-white text-foreground font-semibold shadow-sm" : "text-muted-foreground font-medium"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Search / filter / sort row */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => resetAndSet(setSearch, e.target.value)}
              placeholder="Search by order number, name, or phone"
              className="w-full h-[46px] rounded-2xl border border-[#e5e5e5] pl-11 pr-4 text-sm bg-white outline-none focus:border-primary/40"
            />
          </div>
          <Select value={collection} onValueChange={(v) => resetAndSet(setCollection, v as typeof collection)}>
            <SelectTrigger className="!h-[46px] rounded-2xl border-[#e5e5e5] w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              <SelectItem value="custom">Custom cakes</SelectItem>
              <SelectItem value="cny">CNY collection</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={`${sortBy}:${sortDir}`}
            onValueChange={(v) => {
              const [by, dir] = v.split(":") as [typeof sortBy, typeof sortDir];
              resetAndSet(setSortBy, by);
              setSortDir(dir);
            }}
          >
            <SelectTrigger className="!h-[46px] rounded-2xl border-[#e5e5e5] w-full md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fulfillmentDate:asc">Date (soonest first)</SelectItem>
              <SelectItem value="fulfillmentDate:desc">Date (latest first)</SelectItem>
              <SelectItem value="total:desc">Total (high to low)</SelectItem>
              <SelectItem value="total:asc">Total (low to high)</SelectItem>
              <SelectItem value="customerName:asc">Customer name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Order list */}
        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-[#e5e5e5] rounded-2xl py-16 text-center text-muted-foreground">
            No orders in this view.
          </div>
        ) : (
          <div className="flex flex-col">
            {orders.map((order) => {
              const collections = orderCollections(order);
              return (
                <div
                  key={order.id}
                  className="border border-[#e5e5e5] -mt-px first:mt-0 px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 cursor-pointer hover:bg-[#faf7f3]/60 transition-colors"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-lg">{order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`}</span>
                      {collections.includes("custom") && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eef3f0] text-[#426b57]">Custom</span>
                      )}
                      {collections.includes("cny") && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f7eee0] text-[#8a5a13]">CNY</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{order.customerName} &middot; {itemSummary(order)}</p>
                  </div>

                  <div className="text-sm text-muted-foreground w-full md:w-[160px]">
                    <p>{format(new Date(order.fulfillmentDate), "d MMM yyyy")}</p>
                    <p>{order.timeRange || format(new Date(order.fulfillmentDate), "h:mm a")}</p>
                  </div>

                  <div className="text-sm text-muted-foreground w-full md:w-[90px] capitalize">{order.deliveryMethod}</div>

                  <div className="font-semibold w-full md:w-[80px]">{formatPrice(order.total)}</div>

                  <div onClick={(e) => e.stopPropagation()} className="w-full md:w-[190px]">
                    <Select
                      value={order.status}
                      onValueChange={(status) => updateStatus.mutate({ id: order.id, status: status as any })}
                    >
                      <SelectTrigger className={`!h-[38px] rounded-full border-0 text-xs font-semibold ${STATUS_STYLES[order.status] || "bg-muted"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {bucket === "past" && data?.hasMore && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setOffset((prev) => prev + 20)}
              className="h-[46px] px-6 rounded-full border border-[#e5e5e5] text-sm font-medium hover:border-primary/40 transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
