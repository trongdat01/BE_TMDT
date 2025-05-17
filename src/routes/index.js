import { Router } from "express";
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import brandRoutes from './brandRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';

const routes = Router();

// Route xác thực
routes.use("/auth", authRoutes);

// Route quản lý danh mục
routes.use("/categories", categoryRoutes);

// Route quản lý thương hiệu
routes.use("/brands", brandRoutes);

// Route người dùng
routes.use("/users", userRoutes);

// Route quản lý sản phẩm
routes.use("/products", productRoutes);

// Route quản lý đơn hàng
routes.use("/orders", orderRoutes);

export default routes;
