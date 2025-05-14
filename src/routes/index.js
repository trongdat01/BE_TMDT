import { Router } from "express";
import authRoutes from './authRoutes.js';

const routes = Router();

// Route xác thực
routes.use("/auth", authRoutes);

// Các routes khác sẽ được thêm sau
// routes.use("/products", productRoutes);
// routes.use("/categories", categoryRoutes);
// routes.use("/orders", orderRoutes);

export default routes;
