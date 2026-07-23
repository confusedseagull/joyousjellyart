import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../hitpay';
import { getDb } from '../db';
import { cnyOrders, orders } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handle HitPay webhook for payment confirmation
 */
export async function handleHitPayWebhook(req: Request, res: Response) {
  try {
    const webhookData = req.body;
    const receivedSignature = webhookData.hmac;

    // Verify webhook signature
    if (!verifyWebhookSignature(webhookData, receivedSignature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Extract payment information
    const { payment_id, reference_number, status, amount, currency } = webhookData;

    console.log('HitPay webhook received:', {
      payment_id,
      reference_number,
      status,
      amount,
      currency,
    });

    // Only process completed payments
    if (status !== 'completed') {
      return res.status(200).json({ message: 'Payment not completed yet' });
    }

    // Parse reference number to get order type and ID
    // Format: CNY-123 or CUSTOM-456
    const [orderType, orderIdStr] = reference_number.split('-');
    const orderId = parseInt(orderIdStr, 10);

    if (!orderId) {
      console.error('Invalid reference number:', reference_number);
      return res.status(400).json({ error: 'Invalid reference number' });
    }

    // Update order payment status based on type
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    
    if (orderType === 'CNY') {
      await db
        .update(cnyOrders)
        .set({
          paymentStatus: 'paid',
          paymentId: payment_id,
        })
        .where(eq(cnyOrders.id, orderId));
      
      console.log(`CNY Order ${orderId} marked as paid`);
    } else if (orderType === 'CUSTOM') {
      await db
        .update(orders)
        .set({
          paymentStatus: 'paid',
          paymentId: payment_id,
        })
        .where(eq(orders.id, orderId));
      
      console.log(`Custom Order ${orderId} marked as paid`);
    }

    // Respond to HitPay that webhook was received successfully
    return res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing HitPay webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
