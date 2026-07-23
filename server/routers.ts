import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createOrder, getAllOrders, getOrderById, updateOrder, createCnyOrder, getAllCnyOrders, getCnyOrderById, updateCnyOrder } from "./db";
import { createPaymentRequest } from "./hitpay";
import { TRPCError } from "@trpc/server";
import { adminAuthRouter } from "./adminAuth";
import { calculateDeliveryFee } from "./deliveryCalculator";
import { systemRouter } from "./_core/systemRouter";

export const appRouter = router({
  system: systemRouter,
  adminAuth: adminAuthRouter,
  
  // Delivery fee calculation
  delivery: router({
    calculateFee: publicProcedure
      .input(z.object({
        address: z.string().min(1, 'Address is required'),
      }))
      .query(async ({ input }) => {
        return await calculateDeliveryFee(input.address);
      }),
  }),
  
  // Payment processing
  payment: router({
    createRequest: publicProcedure
      .input(z.object({
        orderId: z.number(),
        orderType: z.enum(["cny", "custom"]),
        amount: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerPhone: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use PUBLIC_URL if available, otherwise fall back to request host
        const baseUrl = process.env.PUBLIC_URL || (() => {
          const protocol = ctx.req.headers['x-forwarded-proto'] || (ctx.req.secure ? 'https' : 'http');
          const host = ctx.req.headers['x-forwarded-host'] || ctx.req.headers.host || 'localhost:3000';
          return `${protocol}://${host}`;
        })();
        
        const orderNumber = input.orderType === 'cny' 
          ? `CNY${String(input.orderId).padStart(4, '0')}`
          : `CST${String(input.orderId).padStart(4, '0')}`;
        
        const paymentRequest = await createPaymentRequest({
          amount: input.amount,
          currency: 'SGD',
          purpose: `Order ${orderNumber} - Joyous Jelly Art`,
          reference_number: `${input.orderType.toUpperCase()}-${input.orderId}`,
          webhook: `${baseUrl}/api/webhooks/hitpay`,
          redirect_url: `${baseUrl}/order-confirmation?order=${orderNumber}`,
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
          payment_methods: ['paynow_online', 'card'],
        });
        
        return paymentRequest;
      }),
  }),
  orders: router({
    // Public procedure for customers to create orders
    create: publicProcedure
      .input(z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(1),
        deliveryMethod: z.enum(["delivery", "pickup"]),
        deliveryAddress: z.string().optional(),
        fulfillmentDate: z.date(),
        theme: z.string(),
        selectedFlowers: z.array(z.string()).optional(),
        selectedColors: z.array(z.string()).optional(),
        cartoonCharacter: z.string().optional(),
        themeCustomText: z.string().optional(),
        fashionBrand: z.string().optional(),
        shape: z.string(),
        size: z.string(),
        numbers: z.string().optional(),
        platterShapes: z.array(z.string()).optional(),
        flavours: z.array(z.string()),
        cakeText: z.string().optional(),
        cakeTextLanguage: z.enum(["english", "chinese"]).optional(),
        dietaryRequirements: z.string().optional(),
        referenceLinks: z.string().optional(),
        specialInstructions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await createOrder(input);
        return order;
      }),

    // Public procedure for order confirmation (no auth required)
    getByIdForConfirmation: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          });
        }
        return order;
      }),

    list: adminProcedure
      .query(async () => {
        return await getAllOrders();
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          });
        }
        return order;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        customerName: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        deliveryMethod: z.enum(["delivery", "pickup"]).optional(),
        deliveryAddress: z.string().optional(),
        fulfillmentDate: z.date().optional(),
        theme: z.string().optional(),
        selectedFlowers: z.array(z.string()).optional(),
        selectedColors: z.array(z.string()).optional(),
        cartoonCharacter: z.string().optional(),
        themeCustomText: z.string().optional(),
        fashionBrand: z.string().optional(),
        shape: z.string().optional(),
        size: z.string().optional(),
        numbers: z.string().optional(),
        platterShapes: z.array(z.string()).optional(),
        flavours: z.array(z.string()).optional(),
        cakeText: z.string().optional(),
        cakeTextLanguage: z.enum(["english", "chinese"]).optional(),
        dietaryRequirements: z.string().optional(),
        referenceLinks: z.string().optional(),
        specialInstructions: z.string().optional(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const order = await updateOrder(id, updates);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          });
        }
        return order;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "pending_confirmation", "in_progress", "completed", "delivered"]),
      }))
      .mutation(async ({ input }) => {
        const order = await updateOrder(input.id, { status: input.status });
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          });
        }
        return order;
      }),

  }),

  cnyOrders: router({
    // Public procedure for customers to create CNY orders
    create: publicProcedure
      .input(z.object({
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        customerEmail: z.string().email().optional(),
        deliveryMethod: z.enum(["delivery", "pickup"]),
        deliveryAddress: z.string().optional(),
        fulfillmentDate: z.date(),
        items: z.array(z.object({
          id: z.string(),
          name: z.string(),
          edition: z.string(),
          size: z.string(),
          flavor: z.string(),
          price: z.number(),
          quantity: z.number(),
          image: z.string(),
        })),
        subtotal: z.number(),
        deliveryFee: z.number(),
        total: z.number(),
        timeRange: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await createCnyOrder({
          ...input,
        });
        return order;
      }),

    // Public procedure for order confirmation (no auth required)
    getByIdForConfirmation: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getCnyOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'CNY order not found'
          });
        }
        return order;
      }),

    list: adminProcedure
      .query(async () => {
        return await getAllCnyOrders();
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getCnyOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'CNY order not found'
          });
        }
        return order;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().email().optional(),
        deliveryMethod: z.enum(["delivery", "pickup"]).optional(),
        deliveryAddress: z.string().optional(),
        fulfillmentDate: z.date().optional(),
        timeRange: z.string().optional(),
        notes: z.string().optional(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const order = await updateCnyOrder(id, updates);
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'CNY order not found'
          });
        }
        return order;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "pending_confirmation", "in_progress", "completed", "delivered"]),
      }))
      .mutation(async ({ input }) => {
        const order = await updateCnyOrder(input.id, { status: input.status });
        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'CNY order not found'
          });
        }
        return order;
      }),

  }),
});

export type AppRouter = typeof appRouter;
