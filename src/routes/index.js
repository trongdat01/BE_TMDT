import { Router } from "express";
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';

const routes = Router();

// Route xác thực
routes.use("/auth", authRoutes);

// Route quản lý danh mục
routes.use("/categories", categoryRoutes);

// Các routes khác sẽ được thêm sau
// routes.use("/products", productRoutes);
// routes.use("/orders", orderRoutes);

export default routes;
