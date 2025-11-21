import { Router } from "express";
import { listProducts, createProduct, updateProduct, deleteProduct, getProductById } from "../lib/products.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ products: listProducts() });
});

router.get("/:id", (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

router.post("/", (req, res) => {
  const { name, category, price, imageUrl, active } = req.body || {};
  if (!name || !category || typeof price !== "number") {
    return res.status(400).json({ message: "Name, category, and price are required." });
  }
  const product = createProduct({ name, category, price, imageUrl, active });
  res.status(201).json(product);
});

router.put("/:id", (req, res) => {
  const product = updateProduct(req.params.id, req.body || {});
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

router.patch("/:id", (req, res) => {
  const product = updateProduct(req.params.id, req.body || {});
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

router.delete("/:id", (req, res) => {
  const removed = deleteProduct(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.status(204).send();
});

export default router;

