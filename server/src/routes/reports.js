import { Router } from "express";
import { getMonthlySales } from "../lib/sales.js";

const router = Router();

function normalizeMonth(value) {
  if (!value) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return value;
}

function toCsv(records) {
  const header = "Sale ID,Total,Payment Method,Created At,Items";
  const rows = records.map((row) =>
    [row.id, row.total.toFixed(2), row.paymentMethod, row.createdAt, row.itemCount].join(",")
  );
  return [header, ...rows].join("\n");
}

router.get("/monthly", (req, res) => {
  const month = normalizeMonth(req.query.month);
  const records = getMonthlySales(month);
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=\"sales-${month}.csv\"`);
    return res.send(toCsv(records));
  }
  res.json({ month, records });
});

export default router;

