import { eq, desc, asc, and, or, like, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { orders, InsertOrder, Order } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Order management functions
export async function createOrder(order: InsertOrder): Promise<Order> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(orders).values(order);
  const insertedId = Number(result[0].insertId);
  
  // Generate order number based on ID
  const orderNumber = `JJA${String(insertedId).padStart(4, '0')}`;
  
  // Update the order with the generated order number
  await db.update(orders).set({ orderNumber }).where(eq(orders.id, insertedId));
  
  const newOrder = await db.select().from(orders).where(eq(orders.id, insertedId)).limit(1);
  
  if (newOrder.length === 0) {
    throw new Error("Failed to retrieve created order");
  }
  
  return newOrder[0];
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export interface ListOrdersByBucketOptions {
  bucket: "upcoming" | "today" | "past";
  search?: string;
  collection?: "all" | "cny" | "custom";
  sortBy?: "fulfillmentDate" | "total" | "customerName";
  sortDir?: "asc" | "desc";
  // Only meaningful for the "past" bucket, the only one with unbounded growth.
  // Plain offset pagination is fine at this app's real scale (a small
  // business's order history) — true keyset pagination would need a
  // composite cursor to stay correct across arbitrary sortBy fields, which
  // isn't worth the complexity here.
  offset?: number;
  limit?: number;
}

export async function listOrdersByBucket(options: ListOrdersByBucketOptions): Promise<{ items: Order[]; hasMore: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Bucket boundaries are computed by MySQL itself (CURDATE(), relative to the
  // DB session's own timezone) rather than passed in as JS Date objects — a
  // JS `Date` gets serialized to a UTC-based literal by the driver, which
  // then gets re-interpreted under the DB session's local timezone, silently
  // shifting the boundary by the server's UTC offset (breaks "today"
  // filtering for several hours around each day's edges).
  const conditions: SQL[] = [];
  if (options.bucket === "past") {
    conditions.push(sql`${orders.fulfillmentDate} < CURDATE()`);
  } else if (options.bucket === "today") {
    conditions.push(sql`${orders.fulfillmentDate} >= CURDATE() AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`);
  } else {
    conditions.push(sql`${orders.fulfillmentDate} >= DATE_ADD(CURDATE(), INTERVAL 1 DAY)`);
  }

  if (options.search?.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(orders.orderNumber, q),
        like(orders.customerName, q),
        like(orders.customerPhone, q)
      )!
    );
  }

  if (options.collection && options.collection !== "all") {
    // JSON_CONTAINS forbids wildcards in its own path argument, so the
    // per-item collection values are extracted into a plain JSON array
    // first (which JSON_EXTRACT's path wildcard supports), then checked for
    // membership with the path-less two-argument form of JSON_CONTAINS.
    conditions.push(sql`JSON_CONTAINS(JSON_EXTRACT(${orders.items}, '$[*].collection'), ${JSON.stringify(options.collection)})`);
  }

  const sortColumn =
    options.sortBy === "total" ? orders.total :
    options.sortBy === "customerName" ? orders.customerName :
    orders.fulfillmentDate;
  const orderByClause = options.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const limit = options.bucket === "past" ? (options.limit ?? 20) : 500;
  const offset = options.bucket === "past" ? (options.offset ?? 0) : 0;

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), hasMore };
}

export interface DashboardStats {
  newOrdersToday: number;
  upcomingToday: number;
  upcomingTomorrow: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // See listOrdersByBucket for why these boundaries are computed in SQL
  // (CURDATE()) rather than passed in as JS Date objects.
  const [[newOrdersToday], [upcomingToday], [upcomingTomorrow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(sql`${orders.createdAt} >= CURDATE() AND ${orders.createdAt} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`),
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(sql`${orders.fulfillmentDate} >= CURDATE() AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`),
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(sql`${orders.fulfillmentDate} >= DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL 2 DAY)`),
  ]);

  return {
    newOrdersToday: Number(newOrdersToday.count),
    upcomingToday: Number(upcomingToday.count),
    upcomingTomorrow: Number(upcomingTomorrow.count),
  };
}

// Reused for both the dashboard's upcoming-orders quick-view and its
// pickup/delivery schedule frame, so both reflect the same Today/Tomorrow toggle.
export async function getOrdersForDay(day: "today" | "tomorrow"): Promise<Order[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const dayOffset = day === "today" ? 0 : 1;

  return await db
    .select()
    .from(orders)
    .where(
      sql`${orders.fulfillmentDate} >= DATE_ADD(CURDATE(), INTERVAL ${dayOffset} DAY) AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL ${dayOffset + 1} DAY)`
    )
    .orderBy(asc(orders.fulfillmentDate));
}

export interface RevenueTrendPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

// Shifts a "YYYY-MM-DD" calendar date string by N days using pure UTC-anchored
// date-part arithmetic (never a wall-clock instant), so this is safe to call
// regardless of what timezone the Node process itself runs in.
function shiftDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Revenue tracks when sales happened (createdAt), not future fulfillment
// dates. "Today" is read back from the DB itself (CURDATE()) rather than
// computed via a JS Date — see listOrdersByBucket for why a JS Date boundary
// would silently drift from what the DB considers "today".
export async function getRevenueTrend(days: number): Promise<RevenueTrendPoint[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [todayRows] = await db.execute(sql`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') as today`);
  const todayStr = (todayRows as unknown as { today: string }[])[0].today;
  const rangeStartStr = shiftDateString(todayStr, -(days - 1));

  const dateExpr = sql<string>`DATE_FORMAT(${orders.createdAt}, '%Y-%m-%d')`;

  const rows = await db
    .select({ date: dateExpr, revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), sql`${dateExpr} >= ${rangeStartStr}`))
    .groupBy(dateExpr);

  const byDate = new Map(rows.map((r) => [r.date, Number(r.revenue)]));

  const trend: RevenueTrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const key = shiftDateString(rangeStartStr, i);
    trend.push({ date: key, revenue: byDate.get(key) ?? 0 });
  }
  return trend;
}

export interface OrderCountByDate {
  date: string; // YYYY-MM-DD
  count: number;
}

// Order counts per fulfillment date across a range, for the calendar's
// per-day badges. Both boundaries and the grouping key are computed with
// DATE_FORMAT on a "YYYY-MM-DD" string comparison (never a JS Date object)
// so this is immune to the JS-Date/session-timezone double-conversion bug
// documented in listOrdersByBucket.
export async function getOrderCountsForRange(startDateStr: string, endDateStr: string): Promise<OrderCountByDate[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const dateExpr = sql<string>`DATE_FORMAT(${orders.fulfillmentDate}, '%Y-%m-%d')`;

  const rows = await db
    .select({ date: dateExpr, count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${dateExpr} >= ${startDateStr} AND ${dateExpr} <= ${endDateStr}`)
    .groupBy(dateExpr);

  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}

// Full order rows (with items) due on one specific calendar date, for the
// calendar's day side-panel. Same DATE_FORMAT-string-comparison approach as
// getOrderCountsForRange, for the same timezone-safety reason.
export async function getOrdersByDate(dateStr: string): Promise<Order[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const dateExpr = sql<string>`DATE_FORMAT(${orders.fulfillmentDate}, '%Y-%m-%d')`;

  return await db
    .select()
    .from(orders)
    .where(sql`${dateExpr} = ${dateStr}`)
    .orderBy(asc(orders.fulfillmentDate));
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(orders).set(updates).where(eq(orders.id, id));
  
  return await getOrderById(id);
}


