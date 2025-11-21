import { Router } from "express";
import { recordSale, getSaleItems } from "../lib/sales.js";

const router = Router();

router.post("/checkout", (req, res) => {
  try {
    const { items, paymentMethod } = req.body || {};
    const sale = recordSale({ items, paymentMethod: paymentMethod || "cash" });
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:saleId", (req, res) => {
  const saleId = req.params.saleId;
  const items = getSaleItems(saleId);
  if (!items.length) {
    return res.status(404).json({ message: "Sale not found" });
  }
  res.json({ items });
});

export default router;

