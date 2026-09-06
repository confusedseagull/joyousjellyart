// server/_core/vercelHandler.ts
import "dotenv/config";

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// server/_core/rateLimit.ts
var hits = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  hits.forEach((entry, key) => {
    if (entry.resetAt <= now) hits.delete(key);
  });
}, 6e4).unref();
function checkRateLimit(key, { windowMs, max }) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}
function rateLimitExpress(options) {
  return function middleware(req, res, next) {
    const key = clientIp(req);
    const result = checkRateLimit(key, options);
    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1e3).toString());
      return res.status(429).json({ error: "Too many requests" });
    }
    next();
  };
}

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
function rateLimited(options) {
  return t.middleware(async ({ ctx, next }) => {
    const result = checkRateLimit(clientIp(ctx.req), options);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests. Please try again in ${Math.ceil(result.retryAfterMs / 1e3)}s.`
      });
    }
    return next();
  });
}
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.admin) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        admin: ctx.admin
      }
    });
  })
);

// server/routers.ts
import { z as z4 } from "zod";

// server/db.ts
import { eq, desc, asc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).unique(),
  // Customer details
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  // Delivery details
  deliveryMethod: mysqlEnum("deliveryMethod", ["delivery", "pickup"]).notNull(),
  deliveryAddress: text("deliveryAddress"),
  // Only for delivery orders
  recipientPhone: varchar("recipientPhone", { length: 50 }),
  // Only for delivery orders; may differ from customerPhone
  // Order timing
  fulfillmentDate: timestamp("fulfillmentDate").notNull(),
  timeRange: varchar("timeRange", { length: 50 }),
  // e.g., "11:00 AM - 1:00 PM"
  // Cart items: one entry per item, from any collection
  items: json("items").$type().notNull(),
  // Order totals
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("deliveryFee").notNull(),
  total: int("total").notNull(),
  // Order-level additional notes (distinct from each item's own specialInstructions)
  notes: text("notes"),
  // Payment tracking
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending"),
  paymentId: varchar("paymentId", { length: 255 }),
  // Fulfillment status
  status: mysqlEnum("status", ["pending", "pending_confirmation", "in_progress", "completed", "delivered"]).default("pending_confirmation").notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var businessSettings = mysqlTable("businessSettings", {
  id: int("id").autoincrement().primaryKey(),
  pickupAddress: varchar("pickupAddress", { length: 500 }).notNull(),
  pickupInstructions: varchar("pickupInstructions", { length: 500 }),
  // Distance Matrix origin — the shop's address as Google Maps should read it.
  shopAddressForDistance: varchar("shopAddressForDistance", { length: 500 }).notNull(),
  deliveryTiers: json("deliveryTiers").$type().notNull(),
  beyondTierFee: int("beyondTierFee").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
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
async function createOrder(order) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(orders).values(order);
  const insertedId = Number(result[0].insertId);
  const orderNumber = `JJA${String(insertedId).padStart(4, "0")}`;
  await db.update(orders).set({ orderNumber }).where(eq(orders.id, insertedId));
  const newOrder = await db.select().from(orders).where(eq(orders.id, insertedId)).limit(1);
  if (newOrder.length === 0) {
    throw new Error("Failed to retrieve created order");
  }
  return newOrder[0];
}
async function getAllOrders() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}
async function listOrdersByBucket(options) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const conditions = [];
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
      )
    );
  }
  if (options.collection && options.collection !== "all") {
    conditions.push(sql`JSON_CONTAINS(JSON_EXTRACT(${orders.items}, '$[*].collection'), ${JSON.stringify(options.collection)})`);
  }
  const sortColumn = options.sortBy === "total" ? orders.total : options.sortBy === "customerName" ? orders.customerName : orders.fulfillmentDate;
  const orderByClause = options.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
  const limit = options.bucket === "past" ? options.limit ?? 20 : 500;
  const offset = options.bucket === "past" ? options.offset ?? 0 : 0;
  const rows = await db.select().from(orders).where(and(...conditions)).orderBy(orderByClause).limit(limit + 1).offset(offset);
  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), hasMore };
}
async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const [[newOrdersToday], [upcomingToday], [upcomingTomorrow]] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.createdAt} >= CURDATE() AND ${orders.createdAt} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`),
    db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.fulfillmentDate} >= CURDATE() AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`),
    db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.fulfillmentDate} >= DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL 2 DAY)`)
  ]);
  return {
    newOrdersToday: Number(newOrdersToday.count),
    upcomingToday: Number(upcomingToday.count),
    upcomingTomorrow: Number(upcomingTomorrow.count)
  };
}
async function getOrdersForDay(day) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const dayOffset = day === "today" ? 0 : 1;
  return await db.select().from(orders).where(
    sql`${orders.fulfillmentDate} >= DATE_ADD(CURDATE(), INTERVAL ${dayOffset} DAY) AND ${orders.fulfillmentDate} < DATE_ADD(CURDATE(), INTERVAL ${dayOffset + 1} DAY)`
  ).orderBy(asc(orders.fulfillmentDate));
}
function shiftDateString(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
async function getRevenueTrend(days) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const [todayRows] = await db.execute(sql`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') as today`);
  const todayStr = todayRows[0].today;
  const rangeStartStr = shiftDateString(todayStr, -(days - 1));
  const dateExpr = sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m-%d')`;
  const rows = await db.select({ date: dateExpr, revenue: sql`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(and(eq(orders.paymentStatus, "paid"), sql`${dateExpr} >= ${rangeStartStr}`)).groupBy(dateExpr);
  const byDate = new Map(rows.map((r) => [r.date, Number(r.revenue)]));
  const trend = [];
  for (let i = 0; i < days; i++) {
    const key = shiftDateString(rangeStartStr, i);
    trend.push({ date: key, revenue: byDate.get(key) ?? 0 });
  }
  return trend;
}
async function getOrderCountsForRange(startDateStr, endDateStr) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const dateExpr = sql`DATE_FORMAT(${orders.fulfillmentDate}, '%Y-%m-%d')`;
  const rows = await db.select({ date: dateExpr, count: sql`count(*)` }).from(orders).where(sql`${dateExpr} >= ${startDateStr} AND ${dateExpr} <= ${endDateStr}`).groupBy(dateExpr);
  return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
}
async function getOrdersByDate(dateStr) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const dateExpr = sql`DATE_FORMAT(${orders.fulfillmentDate}, '%Y-%m-%d')`;
  return await db.select().from(orders).where(sql`${dateExpr} = ${dateStr}`).orderBy(asc(orders.fulfillmentDate));
}
async function getOrderById(id) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateOrder(id, updates) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(orders).set(updates).where(eq(orders.id, id));
  return await getOrderById(id);
}

// server/hitpay.ts
import crypto from "crypto";
var HITPAY_API_KEY = process.env.HITPAY_API_KEY;
var HITPAY_API_URL = process.env.HITPAY_API_URL;
var HITPAY_SALT = process.env.HITPAY_SALT;
async function createPaymentRequest(params) {
  const response = await fetch(`${HITPAY_API_URL}/v1/payment-requests`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": HITPAY_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HitPay API error: ${response.status} - ${error}`);
  }
  return response.json();
}
function verifyWebhookSignature(data, receivedSignature) {
  const { hmac, ...dataWithoutSignature } = data;
  const sortedKeys = Object.keys(dataWithoutSignature).sort();
  const stringToSign = sortedKeys.map((key) => `${key}${dataWithoutSignature[key]}`).join("");
  const calculatedSignature = crypto.createHmac("sha256", HITPAY_SALT).update(stringToSign).digest("hex");
  return calculatedSignature === receivedSignature;
}

// server/routers.ts
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/adminAuth.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq as eq2 } from "drizzle-orm";
import { z } from "zod";

// server/_core/adminSession.ts
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  orderEmailFrom: process.env.ORDER_EMAIL_FROM ?? "Joyous JellyArt <onboarding@resend.dev>"
};

// server/_core/adminSession.ts
function getSessionSecret() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is required to sign admin sessions");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}
async function createAdminSessionToken(adminId) {
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1e3);
  return new SignJWT({ adminId }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(getSessionSecret());
}
async function verifyAdminSessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"]
    });
    const { adminId } = payload;
    return typeof adminId === "number" ? adminId : null;
  } catch {
    return null;
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    // Client and API share one origin (no cross-site redirect flow), so
    // Lax is correct — and required here, since SameSite=None demands
    // Secure, which would silently drop the cookie over plain http.
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// server/adminAuth.ts
var adminAuthRouter = router({
  // Sign up a new admin. Requires an existing admin session so the
  // dashboard can't be self-served into by anyone who finds the URL.
  signup: adminProcedure.input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const existing = await db.select().from(adminUsers).where(eq2(adminUsers.email, input.email)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError2({
        code: "CONFLICT",
        message: "Admin with this email already exists"
      });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    await db.insert(adminUsers).values({
      email: input.email,
      passwordHash,
      name: input.name
    });
    return {
      success: true,
      message: "Admin account created successfully"
    };
  }),
  // Login — rate-limited to blunt brute-force password guessing.
  login: publicProcedure.use(rateLimited({ windowMs: 15 * 6e4, max: 5 })).input(
    z.object({
      email: z.string().email(),
      password: z.string()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [admin] = await db.select().from(adminUsers).where(eq2(adminUsers.email, input.email)).limit(1);
    if (!admin) {
      throw new TRPCError2({
        code: "UNAUTHORIZED",
        message: "Invalid email or password"
      });
    }
    const validPassword = await bcrypt.compare(input.password, admin.passwordHash);
    if (!validPassword) {
      throw new TRPCError2({
        code: "UNAUTHORIZED",
        message: "Invalid email or password"
      });
    }
    await db.update(adminUsers).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq2(adminUsers.id, admin.id));
    const sessionToken = await createAdminSessionToken(admin.id);
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name
    };
  }),
  // Get current admin session
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.admin) return null;
    return {
      id: ctx.admin.id,
      email: ctx.admin.email,
      name: ctx.admin.name
    };
  }),
  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
  updateProfile: adminProcedure.input(
    z.object({
      name: z.string().optional(),
      email: z.string().email().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    if (input.email) {
      const existing = await db.select().from(adminUsers).where(eq2(adminUsers.email, input.email)).limit(1);
      if (existing.length > 0 && existing[0].id !== ctx.admin.id) {
        throw new TRPCError2({ code: "CONFLICT", message: "Another admin already uses this email" });
      }
    }
    await db.update(adminUsers).set(input).where(eq2(adminUsers.id, ctx.admin.id));
    const [updated] = await db.select().from(adminUsers).where(eq2(adminUsers.id, ctx.admin.id)).limit(1);
    return { id: updated.id, email: updated.email, name: updated.name };
  }),
  changePassword: adminProcedure.input(
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8)
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [admin] = await db.select().from(adminUsers).where(eq2(adminUsers.id, ctx.admin.id)).limit(1);
    if (!admin) throw new TRPCError2({ code: "NOT_FOUND", message: "Admin not found" });
    const validPassword = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!validPassword) {
      throw new TRPCError2({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await db.update(adminUsers).set({ passwordHash }).where(eq2(adminUsers.id, ctx.admin.id));
    return { success: true };
  })
});

// server/_core/map.ts
async function getDistanceMatrix(origins, destinations) {
  if (!ENV.googleMapsApiKey) {
    throw new Error("Google Maps credentials missing: set GOOGLE_MAPS_API_KEY");
  }
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origins);
  url.searchParams.set("destinations", destinations);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", ENV.googleMapsApiKey);
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }
  return await response.json();
}

// server/settings.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq3 } from "drizzle-orm";
import { z as z2 } from "zod";
var DEFAULT_SETTINGS = {
  pickupAddress: "2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846",
  pickupInstructions: "Usually ready in 2-4 days",
  shopAddressForDistance: "2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846",
  deliveryTiers: [
    { maxKm: 5, fee: 18 },
    { maxKm: 10, fee: 19 },
    { maxKm: 20, fee: 22 }
  ],
  beyondTierFee: 25
};
async function getOrCreateBusinessSettings() {
  const db = await getDb();
  if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const existing = await db.select().from(businessSettings).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(businessSettings).values(DEFAULT_SETTINGS);
  const [seeded] = await db.select().from(businessSettings).limit(1);
  return seeded;
}
var deliveryTierSchema = z2.object({
  maxKm: z2.number().positive(),
  fee: z2.number().nonnegative()
});
var settingsRouter = router({
  // Public: pickup address/instructions are already shown to customers on
  // the checkout page, nothing sensitive here.
  get: publicProcedure.query(async () => {
    return await getOrCreateBusinessSettings();
  }),
  update: adminProcedure.input(
    z2.object({
      pickupAddress: z2.string().min(1).optional(),
      pickupInstructions: z2.string().optional(),
      shopAddressForDistance: z2.string().min(1).optional(),
      deliveryTiers: z2.array(deliveryTierSchema).min(1).optional(),
      beyondTierFee: z2.number().nonnegative().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const current = await getOrCreateBusinessSettings();
    await db.update(businessSettings).set(input).where(eq3(businessSettings.id, current.id));
    return await getOrCreateBusinessSettings();
  })
});

// server/deliveryCalculator.ts
async function calculateDeliveryFee(customerAddress) {
  try {
    const settings = await getOrCreateBusinessSettings();
    const response = await getDistanceMatrix(settings.shopAddressForDistance, customerAddress);
    if (response.status !== "OK") {
      throw new Error(`Distance Matrix API error: ${response.status}`);
    }
    const element = response.rows[0]?.elements[0];
    if (!element || element.status !== "OK") {
      throw new Error("Unable to calculate distance to the provided address");
    }
    const distanceInKm = element.distance.value / 1e3;
    const tiers = [...settings.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm);
    let fee = settings.beyondTierFee;
    let distanceTier = tiers.length > 0 ? `Over ${tiers[tiers.length - 1].maxKm}km` : "N/A";
    let prevMax = 0;
    for (const tier of tiers) {
      if (distanceInKm <= tier.maxKm) {
        fee = tier.fee;
        distanceTier = prevMax === 0 ? `${tier.maxKm}km and below` : `${prevMax}-${tier.maxKm}km`;
        break;
      }
      prevMax = tier.maxKm;
    }
    return {
      distance: Math.round(distanceInKm * 10) / 10,
      // Round to 1 decimal place
      fee,
      distanceTier
    };
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    throw new Error("Failed to calculate delivery fee. Please check the address and try again.");
  }
}

// server/_core/systemRouter.ts
import { z as z3 } from "zod";
var systemRouter = router({
  health: publicProcedure.input(
    z3.object({
      timestamp: z3.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  }))
});

// server/routers.ts
var customOrderItemSchema = z4.object({
  collection: z4.literal("custom"),
  id: z4.string(),
  format: z4.enum(["cake", "jellyPlatter", "miniGiftBox"]),
  theme: z4.string(),
  selectedFlowers: z4.array(z4.string()).optional(),
  selectedColors: z4.array(z4.string()).optional(),
  cartoonCharacter: z4.string().optional(),
  themeCustomText: z4.string().optional(),
  fashionBrand: z4.string().optional(),
  shape: z4.string(),
  size: z4.string(),
  numbers: z4.string().optional(),
  platterShapes: z4.array(z4.string()).optional(),
  flavours: z4.array(z4.string()),
  cakeText: z4.string().optional(),
  cakeTextLanguage: z4.enum(["english", "chinese"]).optional(),
  dietaryRequirements: z4.string().optional(),
  referenceLinks: z4.string().optional(),
  specialInstructions: z4.string().optional(),
  price: z4.number(),
  quantity: z4.number()
});
var cnyOrderItemSchema = z4.object({
  collection: z4.literal("cny"),
  id: z4.string(),
  name: z4.string(),
  edition: z4.string(),
  size: z4.string(),
  flavor: z4.string(),
  price: z4.number(),
  quantity: z4.number(),
  image: z4.string(),
  dietaryRequirements: z4.array(z4.string()).optional()
});
var orderItemSchema = z4.discriminatedUnion("collection", [customOrderItemSchema, cnyOrderItemSchema]);
var appRouter = router({
  system: systemRouter,
  adminAuth: adminAuthRouter,
  settings: settingsRouter,
  // Delivery fee calculation — rate-limited since every call hits the
  // (billed) Google Maps Distance Matrix API, not just abuse protection.
  delivery: router({
    calculateFee: publicProcedure.use(rateLimited({ windowMs: 15 * 6e4, max: 20 })).input(z4.object({
      address: z4.string().min(1, "Address is required")
    })).query(async ({ input }) => {
      return await calculateDeliveryFee(input.address);
    })
  }),
  // Payment processing
  payment: router({
    createRequest: publicProcedure.use(rateLimited({ windowMs: 15 * 6e4, max: 10 })).input(z4.object({
      orderId: z4.number(),
      amount: z4.string(),
      customerName: z4.string(),
      customerEmail: z4.string(),
      customerPhone: z4.string()
    })).mutation(async ({ input, ctx }) => {
      const baseUrl = process.env.PUBLIC_URL || (() => {
        const protocol = ctx.req.headers["x-forwarded-proto"] || (ctx.req.secure ? "https" : "http");
        const host = ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host || "localhost:3000";
        return `${protocol}://${host}`;
      })();
      const orderNumber = `JJA${String(input.orderId).padStart(4, "0")}`;
      const paymentRequest = await createPaymentRequest({
        amount: input.amount,
        currency: "SGD",
        purpose: `Order ${orderNumber} - Joyous Jelly Art`,
        reference_number: `ORD-${input.orderId}`,
        webhook: `${baseUrl}/api/webhooks/hitpay`,
        redirect_url: `${baseUrl}/order-confirmation?order=${orderNumber}`,
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        payment_methods: ["paynow_online", "card"]
      });
      return paymentRequest;
    })
  }),
  orders: router({
    // Public procedure for customers to create orders
    create: publicProcedure.use(rateLimited({ windowMs: 15 * 6e4, max: 10 })).input(z4.object({
      customerName: z4.string().min(1),
      customerEmail: z4.string().email(),
      customerPhone: z4.string().min(1),
      deliveryMethod: z4.enum(["delivery", "pickup"]),
      deliveryAddress: z4.string().optional(),
      recipientPhone: z4.string().optional(),
      fulfillmentDate: z4.date(),
      timeRange: z4.string().optional(),
      items: z4.array(orderItemSchema),
      subtotal: z4.number(),
      deliveryFee: z4.number(),
      total: z4.number(),
      notes: z4.string().optional()
    })).mutation(async ({ input }) => {
      const order = await createOrder(input);
      return order;
    }),
    // Public procedure for order confirmation (no auth required)
    getByIdForConfirmation: publicProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const order = await getOrderById(input.id);
      if (!order) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }
      return order;
    }),
    list: adminProcedure.query(async () => {
      return await getAllOrders();
    }),
    listByBucket: adminProcedure.input(z4.object({
      bucket: z4.enum(["upcoming", "today", "past"]),
      search: z4.string().optional(),
      collection: z4.enum(["all", "cny", "custom"]).optional(),
      sortBy: z4.enum(["fulfillmentDate", "total", "customerName"]).optional(),
      sortDir: z4.enum(["asc", "desc"]).optional(),
      offset: z4.number().optional(),
      limit: z4.number().optional()
    })).query(async ({ input }) => {
      return await listOrdersByBucket(input);
    }),
    getById: adminProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
      const order = await getOrderById(input.id);
      if (!order) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }
      return order;
    }),
    update: adminProcedure.input(z4.object({
      id: z4.number(),
      customerName: z4.string().optional(),
      customerEmail: z4.string().email().optional(),
      customerPhone: z4.string().optional(),
      deliveryMethod: z4.enum(["delivery", "pickup"]).optional(),
      deliveryAddress: z4.string().optional(),
      recipientPhone: z4.string().optional(),
      fulfillmentDate: z4.date().optional(),
      timeRange: z4.string().optional(),
      items: z4.array(orderItemSchema).optional(),
      subtotal: z4.number().optional(),
      deliveryFee: z4.number().optional(),
      total: z4.number().optional(),
      notes: z4.string().optional(),
      paymentStatus: z4.enum(["pending", "paid", "failed", "refunded"]).optional(),
      status: z4.enum(["pending", "pending_confirmation", "in_progress", "completed", "delivered"]).optional()
    })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const order = await updateOrder(id, updates);
      if (!order) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }
      return order;
    }),
    updateStatus: adminProcedure.input(z4.object({
      id: z4.number(),
      status: z4.enum(["pending", "pending_confirmation", "in_progress", "completed", "delivered"])
    })).mutation(async ({ input }) => {
      const order = await updateOrder(input.id, { status: input.status });
      if (!order) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }
      return order;
    }),
    getDashboardStats: adminProcedure.query(async () => {
      return await getDashboardStats();
    }),
    getOrdersForDay: adminProcedure.input(z4.object({ day: z4.enum(["today", "tomorrow"]) })).query(async ({ input }) => {
      return await getOrdersForDay(input.day);
    }),
    getRevenueTrend: adminProcedure.input(z4.object({ days: z4.number().optional() })).query(async ({ input }) => {
      return await getRevenueTrend(input.days ?? 30);
    }),
    getOrderCountsForRange: adminProcedure.input(z4.object({
      start: z4.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
      end: z4.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    })).query(async ({ input }) => {
      return await getOrderCountsForRange(input.start, input.end);
    }),
    getOrdersByDate: adminProcedure.input(z4.object({
      date: z4.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    })).query(async ({ input }) => {
      return await getOrdersByDate(input.date);
    })
  })
});

// server/_core/context.ts
import { parse as parseCookieHeader } from "cookie";
import { eq as eq4 } from "drizzle-orm";
async function createContext(opts) {
  let admin = null;
  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
    const adminId = await verifyAdminSessionToken(cookies[COOKIE_NAME]);
    if (adminId !== null) {
      const db = await getDb();
      if (db) {
        const [row] = await db.select().from(adminUsers).where(eq4(adminUsers.id, adminId)).limit(1);
        admin = row ?? null;
      }
    }
  } catch (error) {
    admin = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    admin
  };
}

// server/webhooks/hitpay.ts
import { eq as eq5 } from "drizzle-orm";

// server/email.ts
var RESEND_API_URL = "https://api.resend.com/emails";
var BRAND_TEAL = "#6fa4a6";
var BORDER_COLOR = "#e5e5e5";
var MUTED_TEXT = "#6d726e";
function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}
var FORMAT_LABELS = {
  cake: "Cake",
  jellyPlatter: "Jelly Platter",
  miniGiftBox: "Mini Gift Box"
};
async function sendEmail(params) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: ENV.orderEmailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }
}
function renderItemRow(item) {
  if (item.collection === "cny") {
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${BORDER_COLOR};">
          <p style="margin: 0 0 4px; font-weight: 600; color: #1a1e1b;">${item.name}</p>
          <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">${item.edition}</p>
          <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">Size: ${item.size} &middot; Flavour: ${item.flavor}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED_TEXT};">Qty: ${item.quantity} &middot; ${formatPrice(item.price)} each</p>
        </td>
      </tr>`;
  }
  const formatLabel = FORMAT_LABELS[item.format] || item.format;
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${BORDER_COLOR};">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1a1e1b;">Custom Cake</p>
        <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">${formatLabel} &middot; ${item.shape} &middot; ${item.size}</p>
        <p style="margin: 0; font-size: 13px; color: ${MUTED_TEXT};">Theme: ${item.theme} &middot; Flavour: ${item.flavours.join(", ")}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED_TEXT};">Qty: ${item.quantity} &middot; ${formatPrice(item.price)} each</p>
      </td>
    </tr>`;
}
function buildOrderConfirmationEmailHtml(order) {
  const baseUrl = process.env.PUBLIC_URL || "http://localhost:3000";
  const confirmationUrl = `${baseUrl}/order-confirmation?order=${order.orderNumber}`;
  const fulfillmentDate = new Date(order.fulfillmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const itemRows = order.items.map(renderItemRow).join("");
  const deliveryLine = order.deliveryMethod === "delivery" && order.deliveryAddress ? `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Delivery to: ${order.deliveryAddress}</p>` : `<p style="margin: 0; font-size: 14px; color: #1a1e1b;">Pickup: 2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846</p>`;
  return `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1e1b;">
  <h1 style="font-size: 24px; margin: 0 0 8px;">Payment confirmed</h1>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${MUTED_TEXT}; margin: 0 0 24px;">
    Thank you, ${order.customerName} &mdash; your order <strong>${order.orderNumber}</strong> is confirmed.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
    ${itemRows}
  </table>

  <table style="width: 100%; margin-top: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">Subtotal</td>
      <td style="text-align: right; padding: 4px 0;">${formatPrice(order.subtotal)}</td>
    </tr>
    <tr>
      <td style="color: ${MUTED_TEXT}; padding: 4px 0;">${order.deliveryMethod === "delivery" ? "Delivery" : "Pickup"}</td>
      <td style="text-align: right; padding: 4px 0;">${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "FREE"}</td>
    </tr>
    <tr>
      <td style="font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">Total</td>
      <td style="text-align: right; font-weight: 700; padding: 8px 0 0; border-top: 1px solid ${BORDER_COLOR};">${formatPrice(order.total)}</td>
    </tr>
  </table>

  <div style="margin-top: 24px; font-family: Arial, Helvetica, sans-serif;">
    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">Fulfillment</p>
    <p style="margin: 0; font-size: 14px; color: #1a1e1b;">${fulfillmentDate}${order.timeRange ? ` &middot; ${order.timeRange}` : ""}</p>
    ${deliveryLine}
  </div>

  <a href="${confirmationUrl}" style="display: inline-block; margin-top: 28px; padding: 12px 24px; background: ${BRAND_TEAL}; color: #ffffff; text-decoration: none; border-radius: 999px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
    View your order
  </a>

  <p style="margin-top: 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: ${MUTED_TEXT};">
    Joyous JellyArt &middot; Handcrafted Jellies, Crafted Memories, Joyous Moments
  </p>
</div>`;
}
async function sendOrderConfirmationEmail(order) {
  if (!order.customerEmail) return;
  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed - Joyous Jelly Art`,
    html: buildOrderConfirmationEmailHtml(order)
  });
}

// server/webhooks/hitpay.ts
async function handleHitPayWebhook(req, res) {
  try {
    const webhookData = req.body;
    const receivedSignature = webhookData.hmac;
    if (!verifyWebhookSignature(webhookData, receivedSignature)) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }
    const { payment_id, reference_number, status, amount, currency } = webhookData;
    console.log("HitPay webhook received:", {
      payment_id,
      reference_number,
      status,
      amount,
      currency
    });
    if (status !== "completed") {
      return res.status(200).json({ message: "Payment not completed yet" });
    }
    const [prefix, orderIdStr] = reference_number.split("-");
    const orderId = parseInt(orderIdStr, 10);
    if (prefix !== "ORD" || !orderId) {
      console.error("Invalid reference number:", reference_number);
      return res.status(400).json({ error: "Invalid reference number" });
    }
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    await db.update(orders).set({
      paymentStatus: "paid",
      paymentId: payment_id
    }).where(eq5(orders.id, orderId));
    console.log(`Order ${orderId} marked as paid`);
    try {
      const order = await getOrderById(orderId);
      if (order) {
        await sendOrderConfirmationEmail(order);
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }
    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing HitPay webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// server/_core/app.ts
function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post(
    "/api/webhooks/hitpay",
    rateLimitExpress({ windowMs: 6e4, max: 60 }),
    handleHitPayWebhook
  );
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_core/vercelHandler.ts
var vercelHandler_default = createApp();
export {
  vercelHandler_default as default
};
