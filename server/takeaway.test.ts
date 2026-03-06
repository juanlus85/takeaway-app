import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock bcrypt ──────────────────────────────────────────────────────────────
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
  },
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
}));

// ─── Mock db ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByUsername: vi.fn().mockResolvedValue({
    id: 1,
    username: "vendedor1",
    passwordHash: "$2b$10$hashedpassword",
    displayName: "Vendedor 1",
    role: "seller",
    active: true,
  }),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Bocadillos", color: "#f59e0b", icon: "sandwich", sortOrder: 1, active: true },
  ]),
  getAllCategoriesAdmin: vi.fn().mockResolvedValue([]),
  getAllProducts: vi.fn().mockResolvedValue([
    { id: 1, categoryId: 1, name: "Serranito", price: "5.00", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, active: true, sortOrder: 1 },
  ]),
  getAllProductsAdmin: vi.fn().mockResolvedValue([]),
  getProductsByCategory: vi.fn().mockResolvedValue([]),
  getAvailableCallers: vi.fn().mockResolvedValue([
    { id: 1, number: 1, inUse: false, orderId: null },
    { id: 2, number: 2, inUse: false, orderId: null },
  ]),
  getAllCallers: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue(42),
  setCallerInUse: vi.fn().mockResolvedValue(undefined),
  getPendingOrders: vi.fn().mockResolvedValue([]),
  getKitchenOrders: vi.fn().mockResolvedValue([]),
  getOrdersWithItems: vi.fn().mockResolvedValue([]),
  markOrderDelivered: vi.fn().mockResolvedValue(undefined),
  markItemCompleted: vi.fn().mockResolvedValue(undefined),
  getDeliveredOrders: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue({ id: 42, callerNumber: 3, status: "pending" }),
  releaseCallers: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  createUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  createProduct: vi.fn().mockResolvedValue(undefined),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock sdk ────────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    signSession: vi.fn().mockResolvedValue("mock-jwt-token"),
    verifySession: vi.fn().mockResolvedValue(null),
    authenticateRequest: vi.fn().mockResolvedValue(null),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createPublicCtx(): TrpcContext {
  const cookies: any[] = [];
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: {
      cookie: (_name: string, _value: string, _opts: any) => cookies.push({ _name, _value }),
      clearCookie: (_name: string, _opts: any) => {},
    } as any,
  };
}

function createSellerCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "1",
      username: "vendedor1",
      displayName: "Vendedor 1",
      role: "seller",
      active: true,
      email: null,
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "99",
      username: "admin",
      displayName: "Administrador",
      role: "admin",
      active: true,
      email: null,
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.login", () => {
  it("returns success and user info with valid credentials", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.login({ username: "vendedor1", password: "vendedor1" });
    expect(result.success).toBe(true);
    expect(result.user.username).toBe("vendedor1");
    expect(result.user.role).toBe("seller");
  });
});

describe("auth.logout", () => {
  it("clears session cookie", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
      } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("categories.list", () => {
  it("returns active categories", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Bocadillos");
  });
});

describe("products.listAll", () => {
  it("returns all active products", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.products.listAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe("Serranito");
  });
});

describe("callers.available", () => {
  it("returns available callers for authenticated user", async () => {
    const caller = appRouter.createCaller(createSellerCtx());
    const result = await caller.callers.available();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].number).toBe(1);
  });
});

describe("orders.create", () => {
  it("creates an order and returns orderId", async () => {
    const caller = appRouter.createCaller(createSellerCtx());
    const result = await caller.orders.create({
      callerNumber: 3,
      total: "5.00",
      requiresKitchen: true,
      items: [
        {
          productId: 1,
          productName: "Serranito",
          categoryName: "Bocadillos",
          price: "5.00",
          quantity: 1,
          requiresKitchen: true,
        },
      ],
    });
    expect(result.orderId).toBe(42);
  });
});

describe("orders.pending", () => {
  it("returns empty array when no pending orders", async () => {
    const caller = appRouter.createCaller(createSellerCtx());
    const result = await caller.orders.pending();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("orders.deliver", () => {
  it("marks order as delivered", async () => {
    const caller = appRouter.createCaller(createSellerCtx());
    const result = await caller.orders.deliver({ orderId: 42 });
    expect(result.success).toBe(true);
  });
});

describe("admin: categories.listAdmin", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(createSellerCtx());
    await expect(caller.categories.listAdmin()).rejects.toThrow();
  });

  it("works for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.categories.listAdmin();
    expect(Array.isArray(result)).toBe(true);
  });
});
