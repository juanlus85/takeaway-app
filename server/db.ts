import { and, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertCategory,
  type InsertOrder,
  type InsertOrderItem,
  type InsertProduct,
  type InsertUser,
  callers,
  categories,
  orderItems,
  orders,
  products,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values(user);
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt);
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
}

export async function getAllCategoriesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set({ active: false }).where(eq(categories.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.active, true)))
    .orderBy(products.sortOrder);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.active, true)).orderBy(products.sortOrder);
}

export async function getAllProductsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.categoryId, products.sortOrder);
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set({ active: false }).where(eq(products.id, id));
}

// ─── Callers ──────────────────────────────────────────────────────────────────
export async function getAvailableCallers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callers).where(eq(callers.inUse, false)).orderBy(callers.number);
}

export async function getAllCallers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callers).orderBy(callers.number);
}

export async function setCallerInUse(number: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(callers).set({ inUse: true, orderId }).where(eq(callers.number, number));
}

export async function releaseCallers(numbers: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (numbers.length === 0) return;
  await db
    .update(callers)
    .set({ inUse: false, orderId: null })
    .where(inArray(callers.number, numbers));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(orders).values(order).$returningId();
  const orderId = result!.id;
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((i) => ({ ...i, orderId })));
  }
  return orderId;
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(inArray(orders.status, ["pending", "ready"]))
    .orderBy(orders.paidAt);
}

export async function getKitchenOrders() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.requiresKitchen, true), inArray(orders.status, ["pending", "ready"])))
    .orderBy(orders.paidAt);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrdersWithItems(orderIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (orderIds.length === 0) return [];
  return db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
}

export async function markOrderDelivered(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(orders)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function markOrderReady(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set({ status: "ready" }).where(eq(orders.id, orderId));
}

export async function markItemCompleted(itemId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(orderItems)
    .set({ completedInKitchen: completed })
    .where(eq(orderItems.id, itemId));
}

export async function getDeliveredOrders(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .orderBy(desc(orders.deliveredAt))
    .limit(limit);
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

// ─── SDK compatibility shims ──────────────────────────────────────────────────
// The SDK calls getUserByOpenId(openId) where openId = String(user.id) from our JWT.
// We resolve it back to a real user row so authenticateRequest works correctly.
export async function getUserByOpenId(openId: string): Promise<import('../drizzle/schema').User | undefined> {
  const numericId = parseInt(openId, 10);
  if (isNaN(numericId)) return undefined;
  return getUserById(numericId);
}

// upsertUser is called by the SDK to update lastSignedIn — we can safely ignore it
// since we don't have that column in our schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertUser(_user: any) {
  // no-op: our users are managed via createUser / updateUser
}
