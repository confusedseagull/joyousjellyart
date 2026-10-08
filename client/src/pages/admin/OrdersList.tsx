import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Truck, Store, Image as ImageIcon } from "lucide-react";
import {
  PageHeader,
  Segmented,
  EmptyState,
  LoadingBlock,
  adminCard,
  adminButton,
  STATUS_OPTIONS,
  STATUS_STYLES,
  normalizeStatus,
} from "@/components/admin/AdminUI";
import { format } from "date-fns";
import { formatPrice, formatTimeRange, formatOrderCount } from "@/lib/utils";
import { toast } from "sonner";
import { ADMIN_LIVE } from "@/lib/adminLive";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type Order = inferRouterOutputs<AppRouter>["orders"]["listByBucket"]["items"][number];

const BUCKETS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function orderCollections(order: Order): string[] {
  return Array.from(new Set((order.items || []).map((i) => i.collection)));
}

function itemSummary(order: Order): string {
  const count = order.items?.length || 0;
  return `${count} item${count === 1 ? "" : "s"}`;
}

const collectionTag = "inline-flex items-center h-5 px-1.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600";

function StatusSelect({ order, onChange }: { order: Order; onChange: (status: string) => void }) {
  const status = normalizeStatus(order.status);
  const style = STATUS_STYLES[status];
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={status} onValueChange={onChange}>
        <SelectTrigger
          className={`!h-7 w-auto gap-1.5 rounded-md border-0 px-2 text-xs font-medium shadow-none ring-1 ring-inset focus-visible:ring-2 ${style?.badge ?? "bg-neutral-100 text-neutral-700 ring-neutral-200"}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OrderRow({ order, onOpen, onStatus }: { order: Order; onOpen: () => void; onStatus: (status: string) => void }) {
  const collections = orderCollections(order);
  const number = order.orderNumber || `JJA${String(order.id).padStart(4, "0")}`;
  const when = format(new Date(order.fulfillmentDate), "d MMM yyyy");
  const time = order.timeRange ? formatTimeRange(order.timeRange) : format(new Date(order.fulfillmentDate), "h:mm a");
  const DeliveryIcon = order.deliveryMethod === "delivery" ? Truck : Store;

  const referenceCount = (order.items as any[]).reduce((n, item) => n + (item.referenceImages?.length ?? 0), 0);

  const tags = (
    <>
      {referenceCount > 0 && (
        <span className={`${collectionTag} gap-1`} title="Customer attached reference images">
          <ImageIcon className="h-3 w-3" />
          {referenceCount}
        </span>
      )}
      {collections.includes("custom") && <span className={collectionTag}>Custom</span>}
      {collections.includes("cny") && <span className={collectionTag}>CNY</span>}
    </>
  );

  return (
    <div
      onClick={onOpen}
      className="cursor-pointer px-4 py-3.5 hover:bg-neutral-50 transition-colors"
    >
      {/* Phone: compact card */}
      <div className="md:hidden flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold">{number}</span>
            {tags}
          </div>
          <StatusSelect order={order} onChange={onStatus} />
        </div>
        <p className="text-sm text-neutral-700 truncate">
          {order.customerName} <span className="text-neutral-400">·</span> <span className="text-neutral-500">{itemSummary(order)}</span>
        </p>
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 min-w-0">
            <DeliveryIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="capitalize">{order.deliveryMethod}</span>
            <span className="text-neutral-300">·</span>
            <span className="truncate">{when}, {time}</span>
          </span>
          <span className="text-sm font-semibold text-neutral-900 tabular-nums shrink-0">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Desktop: single-line row */}
      <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_96px_88px_auto] items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{number}</span>
            {tags}
          </div>
          <p className="text-sm text-neutral-500 truncate mt-0.5">{order.customerName} · {itemSummary(order)}</p>
        </div>
        <div className="text-sm text-neutral-600 min-w-0">
          <p className="truncate">{when}</p>
          <p className="text-xs text-neutral-500 truncate">{time}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
          <DeliveryIcon className="h-3.5 w-3.5 text-neutral-400" />
          <span className="capitalize">{order.deliveryMethod}</span>
        </div>
        <div className="text-sm font-semibold tabular-nums text-right">{formatPrice(order.total)}</div>
        <StatusSelect order={order} onChange={onStatus} />
      </div>
    </div>
  );
}

export default function OrdersList() {
  const [, navigate] = useLocation();
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]["value"]>("upcoming");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<"all" | "cny" | "custom">("all");
  const [sortBy, setSortBy] = useState<"fulfillmentDate" | "total" | "customerName">("fulfillmentDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Order[]>([]);

  const utils = trpc.useUtils();

  // Wait for a pause in typing before querying, so a search doesn't fire a
  // request (plus the counts) on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: counts } = trpc.orders.getBucketCounts.useQuery(
    { search: debouncedSearch || undefined, collection },
    ADMIN_LIVE
  );

  // Once "Load more" has appended extra pages, refetching would re-append the
  // same page, so live updates only run while showing the first page.
  const { data, isLoading } = trpc.orders.listByBucket.useQuery(
    { bucket, search: debouncedSearch || undefined, collection, sortBy, sortDir, offset },
    { ...ADMIN_LIVE, refetchInterval: offset === 0 ? ADMIN_LIVE.refetchInterval : false }
  );

  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      // A status change can move the order to another tab and changes the
      // counts, dashboard and calendar, so refresh everything order-related.
      utils.orders.invalidate();
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
      <PageHeader title="Orders" description="Browse, search, and update every order." />

      <Segmented
        options={BUCKETS.map((b) => ({ ...b, hint: counts ? formatOrderCount(counts[b.value]) : undefined }))}
        value={bucket}
        onChange={(v) => resetAndSet(setBucket, v)}
        className="w-full sm:w-96 mb-4"
      />

      {/* Search / sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => resetAndSet(setSearch, e.target.value)}
            placeholder="Search order number, name or phone"
            className="w-full h-10 rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select
          value={`${sortBy}:${sortDir}`}
          onValueChange={(v) => {
            const [by, dir] = v.split(":") as [typeof sortBy, typeof sortDir];
            resetAndSet(setSortBy, by);
            setSortDir(dir);
          }}
        >
          <SelectTrigger className="!h-10 rounded-md border-neutral-300 bg-white w-full sm:w-[210px] shadow-none">
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
        <LoadingBlock />
      ) : orders.length === 0 ? (
        <EmptyState>{bucket === "cancelled" ? "No cancelled orders." : "No orders in this view."}</EmptyState>
      ) : (
        <div className={`${adminCard} divide-y divide-neutral-200 overflow-hidden`}>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onOpen={() => navigate(`/admin/orders/${order.id}`)}
              onStatus={(status) => updateStatus.mutate({ id: order.id, status: status as any })}
            />
          ))}
        </div>
      )}

      {(bucket === "past" || bucket === "cancelled") && data?.hasMore && (
        <div className="flex justify-center mt-5">
          <button type="button" onClick={() => setOffset((prev) => prev + 20)} className={adminButton}>
            Load more
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
