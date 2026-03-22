import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// ─── Seller procedure (seller or admin) ──────────────────────────────────────
const sellerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "seller" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo vendedores o administradores" });
  }
  return next({ ctx });
});

// ─── Kitchen procedure (kitchen or admin) ────────────────────────────────────
const kitchenProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "kitchen" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo cocina o administradores" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    login: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.active) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
        }
        // Create session using the framework's JWT signing
        const token = await sdk.signSession(
          { openId: String(user.id), appId: "takeaway", name: user.displayName },
          { expiresInMs: 1000 * 60 * 60 * 24 * 30 } // 30 days
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return { success: true, user: { id: user.id, displayName: user.displayName, role: user.role, username: user.username } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ──────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => db.getAllCategories()),
    listAdmin: adminProcedure.query(() => db.getAllCategoriesAdmin()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        color: z.string().default("#6366f1"),
        icon: z.string().default("utensils"),
        sortOrder: z.number().default(0),
      }))
      .mutation(({ input }) => db.createCategory(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteCategory(input.id)),
  }),

  // ─── Products ─────────────────────────────────────────────────────────────
  products: router({
    listByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(({ input }) => db.getProductsByCategory(input.categoryId)),
    listAll: publicProcedure.query(() => db.getAllProducts()),
    listAdmin: adminProcedure.query(() => db.getAllProductsAdmin()),
    create: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        price: z.string().default("0.00"),
        fixedPrice: z.boolean().default(true),
        requiresKitchen: z.boolean().default(false),
        requiresTypeInput: z.boolean().default(false),
        sortOrder: z.number().default(0),
      }))
      .mutation(({ input }) => db.createProduct(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().min(1).optional(),
        price: z.string().optional(),
        fixedPrice: z.boolean().optional(),
        requiresKitchen: z.boolean().optional(),
        requiresTypeInput: z.boolean().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteProduct(input.id)),
  }),

  // ─── Callers ──────────────────────────────────────────────────────────────
  callers: router({
    available: protectedProcedure.query(() => db.getAvailableCallers()),
    all: protectedProcedure.query(() => db.getAllCallers()),
  }),

  // ─── Orders ───────────────────────────────────────────────────────────────
  orders: router({
    // Create a new paid order
    create: sellerProcedure
      .input(z.object({
        callerNumber: z.number().nullable(),
        total: z.string(),
        requiresKitchen: z.boolean(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number().nullable(),
          productName: z.string(),
          categoryName: z.string(),
          price: z.string(),
          quantity: z.number().default(1),
          requiresKitchen: z.boolean(),
          typeNote: z.string().optional(),
          customNote: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderId = await db.createOrder(
          {
            callerNumber: input.callerNumber,
            sellerId: ctx.user.id,
            sellerName: (ctx.user as any).displayName || (ctx.user as any).username || "Vendedor",
            total: input.total,
            requiresKitchen: input.requiresKitchen,
            notes: input.notes,
            paidAt: new Date(),
          },
          input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            categoryName: item.categoryName,
            price: item.price,
            quantity: item.quantity,
            requiresKitchen: item.requiresKitchen,
            typeNote: item.typeNote,
            customNote: item.customNote,
          }))
        );
        // Mark caller as in use
        if (input.callerNumber) {
          await db.setCallerInUse(input.callerNumber, orderId);
        }
        return { orderId };
      }),

    // Pending orders (for seller delivery screen)
    pending: protectedProcedure.query(async () => {
      const orderList = await db.getPendingOrders();
      if (orderList.length === 0) return [];
      const ids = orderList.map((o) => o.id);
      const items = await db.getOrdersWithItems(ids);
      return orderList.map((order) => ({
        ...order,
        items: items.filter((i) => i.orderId === order.id),
      }));
    }),

    // Kitchen orders (only those requiring kitchen)
    kitchen: protectedProcedure.query(async () => {
      const orderList = await db.getKitchenOrders();
      if (orderList.length === 0) return [];
      const ids = orderList.map((o) => o.id);
      const items = await db.getOrdersWithItems(ids);
      return orderList.map((order) => ({
        ...order,
        items: items
          .filter((i) => i.orderId === order.id && i.requiresKitchen),
      }));
    }),

    // Mark order as delivered
    deliver: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
        await db.markOrderDelivered(input.orderId);
        // Release caller
        if (order.callerNumber) {
          await db.releaseCallers([order.callerNumber]);
        }
        return { success: true };
      }),

    // Mark order as ready (kitchen done — seller delivers to customer)
    markReady: kitchenProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
        await db.markOrderReady(input.orderId);
        return { success: true };
      }),
    // Mark kitchen item as completed
    completeItem: protectedProcedure
      .input(z.object({ itemId: z.number(), completed: z.boolean() }))
      .mutation(({ input }) => db.markItemCompleted(input.itemId, input.completed)),

    // History of delivered orders
    history: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        const orderList = await db.getDeliveredOrders(input.limit);
        if (orderList.length === 0) return [];
        const ids = orderList.map((o) => o.id);
        const items = await db.getOrdersWithItems(ids);
        return orderList.map((order) => ({
          ...order,
          items: items.filter((i) => i.orderId === order.id),
        }));
      }),
  }),

  // ─── Modifiers ──────────────────────────────────────────────────────
  modifiers: router({
    // Get modifiers for a specific product (used in vendor screen)
    byProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => db.getModifiersByProduct(input.productId)),

    // Get modifiers for multiple products at once (batch load)
    forProducts: publicProcedure
      .input(z.object({ productIds: z.array(z.number()) }))
      .query(({ input }) => db.getModifiersForProducts(input.productIds)),

    // Admin CRUD
    listAdmin: adminProcedure.query(() => db.getAllModifiersAdmin()),
    create: adminProcedure
      .input(z.object({
        productId: z.number(),
        label: z.string().min(1),
        sortOrder: z.number().default(0),
      }))
      .mutation(({ input }) => db.createModifier(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().min(1).optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateModifier(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteModifier(input.id)),
  }),

  // ─── Admin: Users ─────────────────────────────────────────────────────────
  adminUsers: router({
    list: adminProcedure.query(() => db.getAllUsers()),
    create: adminProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(4),
        displayName: z.string().min(1),
        role: z.enum(["admin", "seller", "kitchen"]),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "El usuario ya existe" });
        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.createUser({
          username: input.username,
          passwordHash,
          displayName: input.displayName,
          role: input.role,
        });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        displayName: z.string().min(1).optional(),
        role: z.enum(["admin", "seller", "kitchen"]).optional(),
        active: z.boolean().optional(),
        password: z.string().min(4).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, password, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (password) {
          data.passwordHash = await bcrypt.hash(password, 10);
        }
        await db.updateUser(id, data as any);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
