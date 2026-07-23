import crypto from 'crypto';

const HITPAY_API_KEY = process.env.HITPAY_API_KEY!;
const HITPAY_API_URL = process.env.HITPAY_API_URL!;
const HITPAY_SALT = process.env.HITPAY_SALT!;

export interface CreatePaymentRequestParams {
  amount: string;
  currency: string;
  purpose: string;
  reference_number: string;
  webhook: string;
  redirect_url: string;
  name?: string;
  email?: string;
  phone?: string;
  payment_methods?: string[];
}

export interface PaymentRequest {
  id: string;
  url: string;
  status: string;
  amount: string;
  currency: string;
  reference_number: string;
  created_at: string;
}

/**
 * Create a payment request with HitPay
 */
export async function createPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<PaymentRequest> {
  const response = await fetch(`${HITPAY_API_URL}/v1/payment-requests`, {
    method: 'POST',
    headers: {
      'X-BUSINESS-API-KEY': HITPAY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HitPay API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Verify webhook signature from HitPay
 */
export function verifyWebhookSignature(
  data: Record<string, any>,
  receivedSignature: string
): boolean {
  // Remove the signature from the data
  const { hmac, ...dataWithoutSignature } = data;

  // Sort keys alphabetically
  const sortedKeys = Object.keys(dataWithoutSignature).sort();

  // Build the string to sign
  const stringToSign = sortedKeys
    .map((key) => `${key}${dataWithoutSignature[key]}`)
    .join('');

  // Generate HMAC SHA256 signature
  const calculatedSignature = crypto
    .createHmac('sha256', HITPAY_SALT)
    .update(stringToSign)
    .digest('hex');

  return calculatedSignature === receivedSignature;
}

/**
 * Get payment status from HitPay
 */
export async function getPaymentStatus(
  paymentRequestId: string
): Promise<PaymentRequest> {
  const response = await fetch(
    `${HITPAY_API_URL}/v1/payment-requests/${paymentRequestId}`,
    {
      headers: {
        'X-BUSINESS-API-KEY': HITPAY_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HitPay API error: ${response.status} - ${error}`);
  }

  return response.json();
}
