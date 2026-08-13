import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Admin users table for email/password authentication
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * A single custom jelly cake configuration within an order's items array.
 */
export type CustomOrderItem = {
  collection: "custom";
  id: string;
  format: "cake" | "jellyPlatter" | "miniGiftBox";
  theme: string;
  selectedFlowers?: string[];
  selectedColors?: string[];
  cartoonCharacter?: string;
  themeCustomText?: string;
  fashionBrand?: string;
  shape: string;
  size: string;
  numbers?: string;
  platterShapes?: string[];
  flavours: string[];
  cakeText?: string;
  cakeTextLanguage?: "english" | "chinese";
  dietaryRequirements?: string;
  referenceLinks?: string;
  specialInstructions?: string;
  price: number;
  quantity: number;
};

/**
 * A single CNY collection design within an order's items array.
 */
export type CnyOrderItem = {
  collection: "cny";
  id: string;
  name: string;
  edition: string;
  size: string;
  flavor: string;
  price: number;
  quantity: number;
  image: string;
  dietaryRequirements?: string[];
};

export type OrderItem = CustomOrderItem | CnyOrderItem;

/**
 * Orders table storing a cart of items from any collection (custom jelly cakes,
 * CNY collection designs, and future collections) plus customer/delivery details.
 * Each item is tagged with `collection` so a single order can mix collections
 * and be paid for in one HitPay payment.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).unique(),

  // Customer details
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),

  // Delivery details
  deliveryMethod: mysqlEnum("deliveryMethod", ["delivery", "pickup"]).notNull(),
  deliveryAddress: text("deliveryAddress"), // Only for delivery orders
  recipientPhone: varchar("recipientPhone", { length: 50 }), // Only for delivery orders; may differ from customerPhone

  // Order timing
  fulfillmentDate: timestamp("fulfillmentDate").notNull(),
  timeRange: varchar("timeRange", { length: 50 }), // e.g., "11:00 AM - 1:00 PM"

  // Cart items: one entry per item, from any collection
  items: json("items").$type<OrderItem[]>().notNull(),

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
  status: mysqlEnum("status", ["pending", "pending_confirmation", "in_progress", "completed", "delivered"])
    .default("pending_confirmation")
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
