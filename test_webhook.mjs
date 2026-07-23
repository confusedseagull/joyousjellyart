import crypto from 'crypto';

// The actual order ID from database
const orderId = 450004;
const referenceNumber = `CNY-${orderId}`;

// Webhook payload
const webhookData = {
  payment_id: 'test_payment_' + Date.now(),
  reference_number: referenceNumber,
  status: 'completed',
  amount: '136.00',
  currency: 'SGD',
};

// Generate HMAC signature
const sortedKeys = Object.keys(webhookData).sort();
const stringToSign = sortedKeys
  .map((key) => `${key}${webhookData[key]}`)
  .join('');

const hmac = crypto
  .createHmac('sha256', process.env.HITPAY_SALT)
  .update(stringToSign)
  .digest('hex');

// Add signature to payload
const payload = {
  ...webhookData,
  hmac: hmac,
};

console.log('Testing webhook with payload:');
console.log(JSON.stringify(payload, null, 2));

// Send webhook request
const response = await fetch('http://localhost:3000/api/webhooks/hitpay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('\nWebhook response:', response.status, result);
