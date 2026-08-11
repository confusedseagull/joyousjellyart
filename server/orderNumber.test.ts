import { describe, it, expect } from "vitest";
import { createOrder } from "./db";
import type { InsertOrder } from "../drizzle/schema";

describe("Order Number Generation", () => {
  it("should generate order number with JJA prefix and 4-digit padded ID", async () => {
    const testOrder: InsertOrder = {
      customerName: "Test Customer",
      customerPhone: "+65 9123 4567",
      deliveryMethod: "pickup",
      fulfillmentDate: new Date("2026-01-25"),
      items: [{
        collection: "custom",
        id: "test-item",
        format: "cake",
        theme: "floralBouquet",
        shape: "round",
        size: "8inch",
        selectedColors: ["pink", "white", "gold"],
        flavours: ["longan", "lychee"],
        price: 108,
        quantity: 1,
      }],
      subtotal: 108,
      deliveryFee: 0,
      total: 108,
      status: "pending_confirmation"
    };

    const createdOrder = await createOrder(testOrder);

    expect(createdOrder.orderNumber).toBeDefined();
    expect(createdOrder.orderNumber).toMatch(/^JJA\d+$/);
    // Order number should have at least 4 digits, padded with zeros if needed
    const expectedNumber = String(createdOrder.id).padStart(4, '0');
    expect(createdOrder.orderNumber).toBe(`JJA${expectedNumber}`);
  });

  it("should have unique order numbers across orders", async () => {
    const testOrder1: InsertOrder = {
      customerName: "Customer 1",
      customerPhone: "+65 9123 4567",
      deliveryMethod: "pickup",
      fulfillmentDate: new Date("2026-01-25"),
      items: [{
        collection: "cny",
        id: "test-item",
        name: "Test Item",
        edition: "Test",
        size: "Medium",
        flavor: "Longan",
        price: 25,
        quantity: 1,
        image: "/test.jpg",
      }],
      subtotal: 25,
      deliveryFee: 0,
      total: 25,
      status: "pending_confirmation"
    };

    const testOrder2: InsertOrder = {
      ...testOrder1,
      customerName: "Customer 2",
    };

    const order1 = await createOrder(testOrder1);
    const order2 = await createOrder(testOrder2);

    expect(order1.orderNumber).not.toBe(order2.orderNumber);
  });
});
