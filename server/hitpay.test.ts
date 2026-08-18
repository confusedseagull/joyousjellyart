import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";
import { createPaymentRequest, verifyWebhookSignature, getPaymentStatus } from "./hitpay";

// hitpay.ts reads HITPAY_API_KEY/HITPAY_API_URL/HITPAY_SALT into top-level
// consts at import time (see hitpay.ts), so these tests read the same env
// vars at run time to assert against — never a hardcoded key format — since
// hitpay.ts is already imported (and its consts already captured) by the
// time this file runs.
const API_KEY = process.env.HITPAY_API_KEY!;
const API_URL = process.env.HITPAY_API_URL!;
const SALT = process.env.HITPAY_SALT!;

describe("HitPay environment configuration", () => {
  it("has an API key, API URL, and webhook salt configured", () => {
    expect(API_KEY).toBeTruthy();
    expect(API_URL).toBeTruthy();
    expect(SALT).toBeTruthy();
  });
});

describe("createPaymentRequest", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const params = {
    amount: "10.00",
    currency: "SGD",
    purpose: "Order JJA0001 - Joyous Jelly Art",
    reference_number: "ORD-1",
    webhook: "https://example.com/api/webhooks/hitpay",
    redirect_url: "https://example.com/order-confirmation?order=JJA0001",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+65 8123 4567",
    payment_methods: ["paynow_online", "card"],
  };

  it("posts to the configured API URL with the business API key header", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "pr_123", url: "https://pay.hit-pay.com/pr_123", status: "pending", amount: "10.00", currency: "SGD", reference_number: "ORD-1", created_at: "2026-01-01T00:00:00Z" }), { status: 201 })
    );

    const result = await createPaymentRequest(params);

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/v1/payment-requests`,
      expect.objectContaining({ method: "POST" })
    );
    const call = vi.mocked(global.fetch).mock.calls[0];
    const options = call[1] as RequestInit;
    expect((options.headers as Record<string, string>)["X-BUSINESS-API-KEY"]).toBe(API_KEY);
    expect(JSON.parse(options.body as string)).toMatchObject({ reference_number: "ORD-1", amount: "10.00" });
    expect(result.id).toBe("pr_123");
    expect(result.url).toBe("https://pay.hit-pay.com/pr_123");
  });

  it("throws with the response body when HitPay returns a non-OK response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("Invalid amount", { status: 400 }));

    await expect(createPaymentRequest(params)).rejects.toThrow(/HitPay API error: 400/);
  });
});

describe("getPaymentStatus", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches the payment request by id with the business API key header", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "pr_123", url: "https://pay.hit-pay.com/pr_123", status: "completed", amount: "10.00", currency: "SGD", reference_number: "ORD-1", created_at: "2026-01-01T00:00:00Z" }), { status: 200 })
    );

    const result = await getPaymentStatus("pr_123");

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/v1/payment-requests/pr_123`,
      expect.objectContaining({ headers: expect.objectContaining({ "X-BUSINESS-API-KEY": API_KEY }) })
    );
    expect(result.status).toBe("completed");
  });

  it("throws when HitPay returns a non-OK response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("Not found", { status: 404 }));

    await expect(getPaymentStatus("nonexistent")).rejects.toThrow(/HitPay API error: 404/);
  });
});

describe("verifyWebhookSignature", () => {
  // Signs a payload exactly the way HitPay itself does (sorted keys,
  // concatenated as `${key}${value}`, HMAC-SHA256 with the webhook salt),
  // so these tests exercise the real algorithm rather than a fixture value
  // that could drift out of sync with it.
  function signPayload(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const stringToSign = sortedKeys.map((key) => `${key}${data[key]}`).join("");
    return crypto.createHmac("sha256", SALT).update(stringToSign).digest("hex");
  }

  it("accepts a correctly-signed payload", () => {
    const data = { payment_id: "pay_123", reference_number: "ORD-1", status: "completed", amount: "10.00", currency: "SGD" };
    const hmac = signPayload(data);

    expect(verifyWebhookSignature({ ...data, hmac }, hmac)).toBe(true);
  });

  it("rejects a payload with a tampered field", () => {
    const data = { payment_id: "pay_123", reference_number: "ORD-1", status: "completed", amount: "10.00", currency: "SGD" };
    const hmac = signPayload(data);

    // Amount was changed after signing — the recomputed HMAC must no longer match.
    expect(verifyWebhookSignature({ ...data, amount: "999.00", hmac }, hmac)).toBe(false);
  });

  it("rejects an unrelated signature", () => {
    const data = { payment_id: "pay_123", reference_number: "ORD-1", status: "completed", amount: "10.00", currency: "SGD" };

    expect(verifyWebhookSignature({ ...data, hmac: "not-a-real-signature" }, "not-a-real-signature")).toBe(false);
  });
});
