import { v4 as uuid } from "uuid";
import db from "../db.js";

const baseSelect = `SELECT id, name, category, price, image_url as imageUrl, active, created_at as createdAt FROM products`;

export function listProducts() {
  return db.prepare(`${baseSelect} ORDER BY category, name`).all();
}

export function getProductById(id) {
  return db.prepare(`${baseSelect} WHERE id = ?`).get(id);
}

export function createProduct(payload) {
  const id = uuid();
  db.prepare(
    `INSERT INTO products (id, name, category, price, image_url, active) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, payload.name, payload.category, payload.price, payload.imageUrl || "", payload.active ?? 1);
  return getProductById(id);
}

export function updateProduct(id, payload) {
  const existing = getProductById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE products SET name = ?, category = ?, price = ?, image_url = ?, active = ? WHERE id = ?`
  ).run(
    payload.name ?? existing.name,
    payload.category ?? existing.category,
    payload.price ?? existing.price,
    payload.imageUrl ?? existing.imageUrl,
    payload.active ?? existing.active,
    id
  );
  return getProductById(id);
}

export function deleteProduct(id) {
  return db.prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}

