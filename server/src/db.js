import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from "better-sqlite3";
import { v4 as uuid } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../data");
const dbPath = join(dataDir, "supermarket.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const PRODUCT_SEED = [
  { name: "FreshGlow Shampoo", category: "Shampoo", price: 249, image_url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80" },
  { name: "PureCare Soap", category: "Soap", price: 55, image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80" },
  { name: "HydraWash Face Wash", category: "Face Wash", price: 199, image_url: "https://images.unsplash.com/photo-1585577529540-a8095ea25427?auto=format&fit=crop&w=400&q=80" },
  { name: "SilkSkin Face Cream", category: "Face Cream", price: 329, image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80" },
  { name: "Kinder Bites", category: "Kids Snacks", price: 149, image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80" },
  { name: "ChocoDelight", category: "Chocolate", price: 99, image_url: "https://images.unsplash.com/photo-1497051788611-2c64812349a7?auto=format&fit=crop&w=400&q=80" }
];

function init() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0),
      image_url TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )`
  ).run();

  const count = db.prepare("SELECT COUNT(*) as total FROM products").get().total;
  if (count === 0) {
    const insert = db.prepare(
      "INSERT INTO products (id, name, category, price, image_url) VALUES (@id, @name, @category, @price, @image_url)"
    );
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run({ ...item, id: uuid() });
      }
    });
    insertMany(PRODUCT_SEED);
  }
}

init();

export default db;

