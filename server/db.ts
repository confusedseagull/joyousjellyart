import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, orders, InsertOrder, Order, cnyOrders, InsertCnyOrder, CnyOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    // Always assign admin role to owner, even on update
    if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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
  const orderNumber = `CST${String(insertedId).padStart(4, '0')}`;
  
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


// CNY Order management functions
export async function createCnyOrder(order: InsertCnyOrder): Promise<CnyOrder> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(cnyOrders).values(order);
  const insertedId = Number(result[0].insertId);
  
  // Generate order number based on ID
  const orderNumber = `CNY${String(insertedId).padStart(4, '0')}`;
  
  // Update the order with the generated order number
  await db.update(cnyOrders).set({ orderNumber }).where(eq(cnyOrders.id, insertedId));
  
  const newOrder = await db.select().from(cnyOrders).where(eq(cnyOrders.id, insertedId)).limit(1);
  
  if (newOrder.length === 0) {
    throw new Error("Failed to retrieve created CNY order");
  }
  
  return newOrder[0];
}

export async function getAllCnyOrders(): Promise<CnyOrder[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(cnyOrders).orderBy(desc(cnyOrders.createdAt));
}

export async function getCnyOrderById(id: number): Promise<CnyOrder | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(cnyOrders).where(eq(cnyOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCnyOrder(id: number, updates: Partial<InsertCnyOrder>): Promise<CnyOrder | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(cnyOrders).set(updates).where(eq(cnyOrders.id, id));
  
  return await getCnyOrderById(id);
}

