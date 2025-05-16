import { Router } from "express";
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import brandRoutes from './brandRoutes.js';
import userRoutes from './userRoutes.js';

const routes = Router();

// Route xác thực
routes.use("/auth", authRoutes);

// Route quản lý danh mục
routes.use("/categories", categoryRoutes);

// Route quản lý thương hiệu
routes.use("/brands", brandRoutes);

// Route người dùng
routes.use("/users", userRoutes);

// Các routes khác sẽ được thêm sau
// routes.use("/products", productRoutes);
// routes.use("/orders", orderRoutes);

export default routes;
