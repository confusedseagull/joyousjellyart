import { eq, desc, asc, and, or, gte, lt, like, sql, type SQL } from "drizzle-orm";
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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const conditions: SQL[] = [];
  if (options.bucket === "past") {
    conditions.push(lt(orders.fulfillmentDate, todayStart));
  } else if (options.bucket === "today") {
    conditions.push(gte(orders.fulfillmentDate, todayStart));
    conditions.push(lt(orders.fulfillmentDate, todayEnd));
  } else {
    conditions.push(gte(orders.fulfillmentDate, todayEnd));
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
    conditions.push(sql`JSON_CONTAINS(${orders.items}, ${JSON.stringify(options.collection)}, '$[*].collection')`);
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


