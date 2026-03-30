import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).default("").notNull(), // SDK compat shim
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["admin", "seller", "kitchen"]).default("seller").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  color: varchar("color", { length: 32 }).default("#6366f1").notNull(),
  icon: varchar("icon", { length: 64 }).default("utensils").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull().default("0.00"),
  fixedPrice: boolean("fixedPrice").default(true).notNull(), // false = pide importe manual
  requiresKitchen: boolean("requiresKitchen").default(false).notNull(),
  requiresTypeInput: boolean("requiresTypeInput").default(false).notNull(), // para pizza
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Callers (Llamadores) ─────────────────────────────────────────────────────
export const callers = mysqlTable("callers", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull().unique(), // 1-16
  inUse: boolean("inUse").default(false).notNull(),
  orderId: int("orderId"), // referencia al pedido activo
});

export type Caller = typeof callers.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  callerNumber: int("callerNumber"), // null si no tiene bocadillos/pizzas
  sellerId: int("sellerId").notNull(),
  sellerName: varchar("sellerName", { length: 128 }).notNull(),
  total: decimal("total", { precision: 8, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "ready", "delivered"]).default("pending").notNull(),
  requiresKitchen: boolean("requiresKitchen").default(false).notNull(),
  notes: text("notes"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  readyAt: timestamp("readyAt"), // cuando cocina marca como preparado
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Product Modifiers ──────────────────────────────────────────────────────
// Opciones de personalización por producto (ej: "Sin queso", "Sin bacon")
export const productModifiers = mysqlTable("productModifiers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 128 }).notNull(), // ej: "Sin queso"
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductModifier = typeof productModifiers.$inferSelect;
export type InsertProductModifier = typeof productModifiers.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"), // null para items de precio libre
  productName: varchar("productName", { length: 128 }).notNull(),
  categoryName: varchar("categoryName", { length: 128 }).notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  requiresKitchen: boolean("requiresKitchen").default(false).notNull(),
  typeNote: varchar("typeNote", { length: 256 }), // ej: "4 quesos" para pizza
  completedInKitchen: boolean("completedInKitchen").default(false).notNull(),
  customNote: varchar("customNote", { length: 512 }), // nota de personalización del cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
