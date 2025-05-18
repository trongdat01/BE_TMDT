import { Router } from "express";
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import brandRoutes from './brandRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import productVariantRoutes from './productVariantRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';

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

// Route quản lý biến thể sản phẩm
routes.use('/', productVariantRoutes);

// Route quản lý đánh giá
routes.use('/reviews', reviewRoutes);

// Route quản lý danh sách yêu thích
routes.use('/wishlists', wishlistRoutes);

export default routes;
