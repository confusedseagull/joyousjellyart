import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'admin-user',
    email: 'admin@joyousjelly.com',
    name: 'Admin User',
    loginMethod: 'manus',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('CNY Orders', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller(createAdminContext());
  });

  it('should create a CNY order', async () => {
    const orderData = {
      customerName: 'Test Customer',
      customerPhone: '+1234567890',
      customerEmail: 'test@example.com',
      deliveryMethod: 'pickup' as const,
      fulfillmentDate: new Date('2026-02-01'),
      items: [
        {
          id: 'golden-gallop-8-longan',
          name: 'Golden Gallop',
          edition: '2026 CNY Collection',
          size: '8 inch',
          flavor: 'Longan',
          price: 128,
          quantity: 1,
          image: '/images/golden-gallop.jpg',
        },
      ],
      subtotal: 128,
      deliveryFee: 0,
      total: 128,
      notes: 'Test order',
    };

    const result = await caller.cnyOrders.create(orderData);

    expect(result).toBeDefined();
    expect(result.customerName).toBe('Test Customer');
    expect(result.status).toBe('pending_confirmation');
    expect(result.items).toHaveLength(1);
  });

  it('should list all CNY orders', async () => {
    const orders = await caller.cnyOrders.list();

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
  });

  it('should get a CNY order by ID', async () => {
    // First create an order
    const orderData = {
      customerName: 'Test Customer 2',
      customerPhone: '+1234567891',
      deliveryMethod: 'delivery' as const,
      deliveryAddress: '123 Test St',
      fulfillmentDate: new Date('2026-02-15'),
      items: [
        {
          id: 'prosperity-bloom-6-osmanthus',
          name: 'Prosperity Bloom',
          edition: '2026 CNY Collection',
          size: '6 inch',
          flavor: 'Osmanthus',
          price: 98,
          quantity: 2,
          image: '/images/prosperity-bloom.jpg',
        },
      ],
      subtotal: 196,
      deliveryFee: 15,
      total: 211,
    };

    const created = await caller.cnyOrders.create(orderData);
    const fetched = await caller.cnyOrders.getById({ id: created.id });

    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(created.id);
    expect(fetched.customerName).toBe('Test Customer 2');
  });

  it('should update CNY order status', async () => {
    // Create an order first
    const orderData = {
      customerName: 'Test Customer 3',
      customerPhone: '+1234567892',
      deliveryMethod: 'pickup' as const,
      fulfillmentDate: new Date('2026-03-01'),
      items: [
        {
          id: 'test-item',
          name: 'Test Item',
          edition: '2026 CNY Collection',
          size: '8 inch',
          flavor: 'Longan',
          price: 128,
          quantity: 1,
          image: '/test.jpg',
        },
      ],
      subtotal: 128,
      deliveryFee: 0,
      total: 128,
    };

    const created = await caller.cnyOrders.create(orderData);
    
    // Update status
    const updated = await caller.cnyOrders.updateStatus({
      id: created.id,
      status: 'in_progress',
    });

    expect(updated).toBeDefined();
    expect(updated.status).toBe('in_progress');
  });

  it('should update CNY order customer details', async () => {
    // Create an order first
    const orderData = {
      customerName: 'Original Name',
      customerPhone: '+1234567893',
      customerEmail: 'original@example.com',
      deliveryMethod: 'delivery' as const,
      deliveryAddress: 'Original Address',
      fulfillmentDate: new Date('2026-03-15'),
      items: [
        {
          id: 'test-item-2',
          name: 'Test Item 2',
          edition: '2026 CNY Collection',
          size: '6 inch',
          flavor: 'Osmanthus',
          price: 98,
          quantity: 1,
          image: '/test2.jpg',
        },
      ],
      subtotal: 98,
      deliveryFee: 15,
      total: 113,
      notes: 'Original notes',
    };

    const created = await caller.cnyOrders.create(orderData);
    
    // Update customer details
    const updated = await caller.cnyOrders.update({
      id: created.id,
      customerName: 'Updated Name',
      customerPhone: '+9876543210',
      deliveryAddress: 'Updated Address',
      notes: 'Updated notes',
    });

    expect(updated).toBeDefined();
    expect(updated.customerName).toBe('Updated Name');
    expect(updated.customerPhone).toBe('+9876543210');
    expect(updated.deliveryAddress).toBe('Updated Address');
    expect(updated.notes).toBe('Updated notes');
    // Original fields should remain unchanged
    expect(updated.items).toHaveLength(1);
    expect(updated.total).toBe(113);
  });
});
