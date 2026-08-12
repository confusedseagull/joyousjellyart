import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { sendEmail, buildOrderConfirmationEmailHtml, sendOrderConfirmationEmail } from "./email";
import type { Order } from "../drizzle/schema";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    orderNumber: "JJA0001",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "+65 8123 4567",
    deliveryMethod: "pickup",
    deliveryAddress: null,
    fulfillmentDate: new Date("2026-08-20T10:00:00"),
    timeRange: "11:00 AM - 1:00 PM",
    items: [
      {
        collection: "custom",
        id: "item-1",
        format: "cake",
        theme: "chess",
        shape: "round",
        size: "6inch",
        flavours: ["Longan"],
        price: 99,
        quantity: 1,
      },
    ],
    subtotal: 99,
    deliveryFee: 0,
    total: 99,
    notes: null,
    paymentStatus: "paid",
    paymentId: "payment_123",
    status: "pending_confirmation",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Order;
}

describe("sendEmail", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("posts to Resend with the correct auth header and body", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await sendEmail({ to: "customer@example.com", subject: "Test subject", html: "<p>hi</p>" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );

    const call = vi.mocked(global.fetch).mock.calls[0];
    const options = call[1] as RequestInit;
    expect((options.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
    const body = JSON.parse(options.body as string);
    expect(body.to).toBe("customer@example.com");
    expect(body.subject).toBe("Test subject");
    expect(body.html).toBe("<p>hi</p>");
  });

  it("throws when Resend returns a non-OK response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("Invalid API key", { status: 401 }));

    await expect(
      sendEmail({ to: "customer@example.com", subject: "Test", html: "<p>hi</p>" })
    ).rejects.toThrow(/Resend API error: 401/);
  });
});

describe("buildOrderConfirmationEmailHtml", () => {
  it("renders customer name, order number, and custom-item details", () => {
    const html = buildOrderConfirmationEmailHtml(makeOrder());

    expect(html).toContain("Jane Doe");
    expect(html).toContain("JJA0001");
    expect(html).toContain("Custom Cake");
    expect(html).toContain("chess");
    expect(html).toContain("Longan");
    expect(html).toContain("$99.00");
  });

  it("renders cny-item details", () => {
    const order = makeOrder({
      subtotal: 128,
      total: 128,
      items: [
        {
          collection: "cny",
          id: "item-1",
          name: "Golden Gallop",
          edition: "Prosperity Edition",
          size: "8\"",
          flavor: "Longan",
          price: 128,
          quantity: 1,
          image: "/golden-gallop.jpg",
        },
      ],
    });

    const html = buildOrderConfirmationEmailHtml(order);

    expect(html).toContain("Golden Gallop");
    expect(html).toContain("Prosperity Edition");
    expect(html).toContain("Longan");
    expect(html).toContain("$128.00");
  });

  it("renders a delivery address when the order is a delivery order", () => {
    const order = makeOrder({ deliveryMethod: "delivery", deliveryAddress: "123 Main St, Singapore 123456" });
    const html = buildOrderConfirmationEmailHtml(order);

    expect(html).toContain("123 Main St, Singapore 123456");
  });

  it("renders the pickup address when the order is a pickup order", () => {
    const html = buildOrderConfirmationEmailHtml(makeOrder({ deliveryMethod: "pickup" }));

    expect(html).toContain("2 Jalan Lokam");
  });
});

describe("sendOrderConfirmationEmail", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("sends to the order's customer email with a subject containing the order number", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await sendOrderConfirmationEmail(makeOrder());

    const call = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.to).toBe("jane@example.com");
    expect(body.subject).toContain("JJA0001");
  });

  it("does nothing when the order has no customer email", async () => {
    await sendOrderConfirmationEmail(makeOrder({ customerEmail: null }));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
