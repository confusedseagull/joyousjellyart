import { describe, it, expect, beforeAll } from "vitest";
import { createCnyOrder, createOrder, getCnyOrderById, getOrderById } from "./db";
import type { InsertCnyOrder, InsertOrder } from "../drizzle/schema";

describe("Order Number Generation", () => {
  describe("CNY Orders", () => {
    it("should generate order number with CNY prefix and 4-digit padded ID", async () => {
      const testOrder: InsertCnyOrder = {
        customerName: "Test Customer",
        customerPhone: "+65 9123 4567",
        customerEmail: "test@example.com",
        deliveryMethod: "pickup",
        fulfillmentDate: new Date("2026-01-25"),
        items: [{
          id: "test-item",
          name: "Huat Huat Box",
          edition: "Fortune Edition",
          size: "Medium",
          flavor: "Longan",
          price: 25,
          quantity: 1,
          image: "/test.jpg"
        }],
        subtotal: 25,
        deliveryFee: 0,
        total: 25,
        status: "pending_confirmation"
      };

      const createdOrder = await createCnyOrder(testOrder);
      
      expect(createdOrder.orderNumber).toBeDefined();
      expect(createdOrder.orderNumber).toMatch(/^CNY\d+$/);
      // Order number should have at least 4 digits, padded with zeros if needed
      const expectedNumber = String(createdOrder.id).padStart(4, '0');
      expect(createdOrder.orderNumber).toBe(`CNY${expectedNumber}`);
    });

    it("should have unique order numbers", async () => {
      const testOrder1: InsertCnyOrder = {
        customerName: "Customer 1",
        customerPhone: "+65 9123 4567",
        deliveryMethod: "pickup",
        fulfillmentDate: new Date("2026-01-25"),
        items: [{
          id: "test-item",
          name: "Test Item",
          edition: "Test",
          size: "Medium",
          flavor: "Longan",
          price: 25,
          quantity: 1,
          image: "/test.jpg"
        }],
        subtotal: 25,
        deliveryFee: 0,
        total: 25,
        status: "pending_confirmation"
      };

      const testOrder2: InsertCnyOrder = {
        ...testOrder1,
        customerName: "Customer 2"
      };

      const order1 = await createCnyOrder(testOrder1);
      const order2 = await createCnyOrder(testOrder2);

      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });
  });

  describe("Custom Orders", () => {
    it("should generate order number with CST prefix and 4-digit padded ID", async () => {
      const testOrder: InsertOrder = {
        customerName: "Test Customer",
        customerPhone: "+65 9123 4567",
        deliveryMethod: "pickup",
        fulfillmentDate: new Date("2026-01-25"),
        shape: "round_large",
        size: "8 inch",
        theme: "floral_roses",
        selectedColors: ["pink", "white", "gold"],
        flavours: ["longan", "lychee"],
        status: "pending_confirmation"
      };

      const createdOrder = await createOrder(testOrder);
      
      expect(createdOrder.orderNumber).toBeDefined();
      expect(createdOrder.orderNumber).toMatch(/^CST\d+$/);
      // Order number should have at least 4 digits, padded with zeros if needed
      const expectedNumber = String(createdOrder.id).padStart(4, '0');
      expect(createdOrder.orderNumber).toBe(`CST${expectedNumber}`);
    });
  });
});
