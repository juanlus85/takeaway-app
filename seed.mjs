import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Callers 1-16 ─────────────────────────────────────────────────────────
  console.log("Creating callers 1-16...");
  for (let i = 1; i <= 16; i++) {
    await db.execute(
      `INSERT IGNORE INTO callers (\`number\`, inUse) VALUES (${i}, false)`
    );
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log("Creating default users...");
  const adminHash = await bcrypt.hash("admin123", 10);
  const seller1Hash = await bcrypt.hash("vendedor1", 10);
  const seller2Hash = await bcrypt.hash("vendedor2", 10);
  const kitchenHash = await bcrypt.hash("cocina123", 10);

  const usersToInsert = [
    { username: "admin", passwordHash: adminHash, displayName: "Administrador", role: "admin" },
    { username: "vendedor1", passwordHash: seller1Hash, displayName: "Vendedor 1", role: "seller" },
    { username: "vendedor2", passwordHash: seller2Hash, displayName: "Vendedor 2", role: "seller" },
    { username: "cocina", passwordHash: kitchenHash, displayName: "Cocina", role: "kitchen" },
  ];

  for (const u of usersToInsert) {
    await db.execute(
      `INSERT IGNORE INTO users (openId, username, passwordHash, displayName, role, active) VALUES ('', '${u.username}', '${u.passwordHash}', '${u.displayName}', '${u.role}', true)`
    );
  }

  // ─── Categories ───────────────────────────────────────────────────────────
  console.log("Creating categories...");
  const categories = [
    { name: "Bocadillos", color: "#f59e0b", icon: "sandwich", sortOrder: 1 },
    { name: "Bebidas", color: "#3b82f6", icon: "cup-soda", sortOrder: 2 },
    { name: "Pizzas", color: "#ef4444", icon: "pizza", sortOrder: 3 },
    { name: "Patatas", color: "#f97316", icon: "flame", sortOrder: 4 },
    { name: "Helados", color: "#a78bfa", icon: "ice-cream-cone", sortOrder: 5 },
    { name: "Chocolates", color: "#92400e", icon: "candy", sortOrder: 6 },
    { name: "Otros", color: "#6b7280", icon: "package", sortOrder: 7 },
  ];

  const catIds = {};
  for (const cat of categories) {
    const [result] = await db.execute(
      `INSERT IGNORE INTO categories (name, color, icon, sortOrder, active) VALUES ('${cat.name}', '${cat.color}', '${cat.icon}', ${cat.sortOrder}, true)`
    );
    const [row] = await db.execute(`SELECT id FROM categories WHERE name='${cat.name}' LIMIT 1`);
    catIds[cat.name] = row[0].id;
  }

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log("Creating products...");
  const products = [
    // Bocadillos
    { categoryName: "Bocadillos", name: "Serranito", price: "5.00", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 1 },
    { categoryName: "Bocadillos", name: "Pollo Empanado", price: "4.50", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 2 },
    { categoryName: "Bocadillos", name: "Piripi", price: "5.00", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 3 },
    { categoryName: "Bocadillos", name: "Jamón Serrano", price: "4.00", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 4 },
    { categoryName: "Bocadillos", name: "Lomo con Queso", price: "4.50", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 5 },
    { categoryName: "Bocadillos", name: "Vegetal", price: "4.00", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 6 },
    { categoryName: "Bocadillos", name: "Especial de la Casa", price: "5.50", fixedPrice: true, requiresKitchen: true, requiresTypeInput: false, sortOrder: 7 },
    // Bebidas
    { categoryName: "Bebidas", name: "Agua Pequeña", price: "1.00", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 1 },
    { categoryName: "Bebidas", name: "Agua Grande", price: "1.50", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 2 },
    { categoryName: "Bebidas", name: "Lata Normal", price: "1.50", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 3 },
    { categoryName: "Bebidas", name: "Refresco Grande", price: "2.00", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 4 },
    { categoryName: "Bebidas", name: "Cerveza", price: "2.00", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 5 },
    { categoryName: "Bebidas", name: "Zumo", price: "1.50", fixedPrice: true, requiresKitchen: false, requiresTypeInput: false, sortOrder: 6 },
    // Pizzas
    { categoryName: "Pizzas", name: "Porción de Pizza", price: "3.50", fixedPrice: true, requiresKitchen: true, requiresTypeInput: true, sortOrder: 1 },
    // Patatas (precio variable)
    { categoryName: "Patatas", name: "Patatas", price: "0.00", fixedPrice: false, requiresKitchen: false, requiresTypeInput: false, sortOrder: 1 },
    // Helados (precio variable)
    { categoryName: "Helados", name: "Helado", price: "0.00", fixedPrice: false, requiresKitchen: false, requiresTypeInput: false, sortOrder: 1 },
    // Chocolates (precio variable)
    { categoryName: "Chocolates", name: "Chocolate / Chuche", price: "0.00", fixedPrice: false, requiresKitchen: false, requiresTypeInput: false, sortOrder: 1 },
    // Otros (precio variable)
    { categoryName: "Otros", name: "Otros", price: "0.00", fixedPrice: false, requiresKitchen: false, requiresTypeInput: false, sortOrder: 1 },
  ];

  for (const p of products) {
    const catId = catIds[p.categoryName];
    if (!catId) continue;
    await db.execute(
      `INSERT IGNORE INTO products (categoryId, name, price, fixedPrice, requiresKitchen, requiresTypeInput, active, sortOrder) VALUES (${catId}, '${p.name}', '${p.price}', ${p.fixedPrice ? 1 : 0}, ${p.requiresKitchen ? 1 : 0}, ${p.requiresTypeInput ? 1 : 0}, true, ${p.sortOrder})`
    );
  }

  console.log("✅ Seed complete!");
  console.log("\nDefault credentials:");
  console.log("  admin / admin123");
  console.log("  vendedor1 / vendedor1");
  console.log("  vendedor2 / vendedor2");
  console.log("  cocina / cocina123");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
