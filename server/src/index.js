import express from "express";
import cors from "cors";
import morgan from "morgan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import "./db.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import reportRoutes from "./routes/reports.js";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../../public");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Supermarket billing server running on http://localhost:${PORT}`);
});

