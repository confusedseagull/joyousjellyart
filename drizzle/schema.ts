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
 * Orders table storing a cart of custom jelly cake configurations plus customer/delivery details.
 * Mirrors the cnyOrders table's "items array + order-level fields" shape.
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

  // Order timing
  fulfillmentDate: timestamp("fulfillmentDate").notNull(),
  timeRange: varchar("timeRange", { length: 50 }), // e.g., "11:00 AM - 1:00 PM"

  // Cart items: one entry per custom cake configuration
  items: json("items").$type<Array<{
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
  }>>().notNull(),

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
export type OrderItem = Order["items"][number];

/**
 * CNY Collection cart orders table
 */
export const cnyOrders = mysqlTable("cnyOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).unique(),
  
  // Customer details
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  
  // Delivery details
  deliveryMethod: mysqlEnum("deliveryMethod", ["delivery", "pickup"]).notNull(),
  deliveryAddress: text("deliveryAddress"),
  
  // Order timing
  fulfillmentDate: timestamp("fulfillmentDate").notNull(),
  timeRange: varchar("timeRange", { length: 50 }), // e.g., "15:00-17:00"
  
  // Cart items stored as JSON
  items: json("items").$type<Array<{
    id: string;
    name: string;
    edition: string;
    size: string;
    flavor: string;
    price: number;
    quantity: number;
    image: string;
    dietaryRequirements?: string[];
  }>>().notNull(),
  
  // Order totals
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("deliveryFee").notNull(),
  total: int("total").notNull(),
  
  // Additional notes
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

export type CnyOrder = typeof cnyOrders.$inferSelect;
export type InsertCnyOrder = typeof cnyOrders.$inferInsert;
