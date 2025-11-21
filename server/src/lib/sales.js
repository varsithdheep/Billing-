import { v4 as uuid } from "uuid";
import db from "../db.js";

const productStmt = db.prepare("SELECT id, name, price FROM products WHERE id = ? AND active = 1");
const insertSale = db.prepare("INSERT INTO sales (id, total, payment_method) VALUES (?, ?, ?)");
const insertItem = db.prepare(
  "INSERT INTO sale_items (id, sale_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)"
);

export function recordSale({ items, paymentMethod }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty.");
  }
  const saleId = uuid();
  const cartLines = items.map((line) => {
    const product = productStmt.get(line.productId);
    if (!product) {
      throw new Error("Selected product is unavailable.");
    }
    const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
    const lineTotal = product.price * quantity;
    return { ...product, quantity, lineTotal };
  });
  const total = cartLines.reduce((acc, item) => acc + item.lineTotal, 0);

  const trx = db.transaction(() => {
    insertSale.run(saleId, total, paymentMethod || "cash");
    for (const line of cartLines) {
      insertItem.run(uuid(), saleId, line.id, line.name, line.price, line.quantity);
    }
  });
  trx();

  return {
    id: saleId,
    total,
    paymentMethod,
    createdAt: new Date().toISOString(),
    items: cartLines.map((line) => ({
      productId: line.id,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      lineTotal: line.lineTotal
    }))
  };
}

export function getMonthlySales(month) {
  const [year, monthPart] = month.split("-");
  const start = `${year}-${monthPart}-01`;
  const end = `${year}-${monthPart}-31`;
  return db
    .prepare(
      `SELECT s.id,
              s.total,
              s.payment_method as paymentMethod,
              s.created_at as createdAt,
              COALESCE(SUM(si.quantity), 0) as itemCount
         FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
        WHERE date(s.created_at) BETWEEN date(?) AND date(?)
     GROUP BY s.id
     ORDER BY s.created_at DESC`
    )
    .all(start, end);
}

export function getSaleItems(saleId) {
  return db
    .prepare(
      `SELECT product_name as name, quantity, price, quantity * price as lineTotal
         FROM sale_items
        WHERE sale_id = ?
        ORDER BY product_name`
    )
    .all(saleId);
}

