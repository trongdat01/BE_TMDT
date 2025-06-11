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
import cartRoutes from './cartRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';

const routes = Router();

// 🏥 Health Check Endpoint - Kiểm tra CORS và kết nối
routes.get("/health", (req, res) => {
    const origin = req.get('Origin');
    const userAgent = req.get('User-Agent');
    const timestamp = new Date().toISOString();

    // 🎉 Hiển thị thông báo đầy đủ trên terminal
    console.log('=====================================');
    console.log('🎉 FRONTEND ĐÃ KẾT NỐI BACKEND THÀNH CÔNG!');
    console.log('=====================================');
    console.log(`🌐 Origin: ${origin || 'No origin (Postman/Direct)'}`);
    console.log(`🕐 Time: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`🔗 URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`📱 User Agent: ${userAgent || 'Unknown'}`);
    console.log(`✅ CORS Status: Working perfectly!`);
    console.log('=====================================');

    res.status(200).json({
        success: true,
        message: "🎉 Backend API hoạt động bình thường!",
        timestamp: timestamp,
        origin: origin || 'No origin',
        cors: "✅ Working",
        connection: {
            status: "connected",
            protocol: req.protocol,
            host: req.get('host'),
            path: req.originalUrl,
            method: req.method
        }, endpoints: {
            auth: "/api/auth",
            admin: "/api/admin",
            products: "/api/products",
            categories: "/api/categories",
            cart: "/api/cart",
            orders: "/api/orders",
            brands: "/api/brands",
            users: "/api/users",
            reviews: "/api/reviews",
            wishlists: "/api/wishlists"
        }, documentation: {
            swagger: `${req.protocol}://${req.get('host')}/api-docs`,
            api_guide: "Check FRONTEND_CONNECTION_GUIDE.md",
            health_check: `${req.protocol}://${req.get('host')}/api/health`
        }
    });
});

// Routes xác thực người dùng (khách hàng)
routes.use("/auth", authRoutes);

// Route xác thực riêng cho quản trị viên (admin, staff)
routes.use("/admin/auth", (req, res, next) => {
    // Route admin sẽ được xử lý trong middleware này
    // Đảm bảo không dùng chung với routes user
    req.isAdminRoute = true; // Thay thế header bằng thuộc tính trên request
    next();
}, authRoutes);

// Route riêng cho các API admin đã xác thực
import { verifyAdminToken, verifyStaffWithToken } from '../middlewares/jwt.middleware.js';

// Middleware kiểm tra token admin cho tất cả các route /admin
routes.use("/admin", (req, res, next) => {
    // Bỏ qua middleware cho route /admin/auth
    if (req.originalUrl.startsWith('/api/admin/auth')) {
        return next();
    }
    // Áp dụng verifyAdminToken cho mọi route /admin khác
    verifyAdminToken(req, res, next);
});

// Route quản lý người dùng dành cho admin/staff
routes.use("/admin/users", adminUserRoutes);

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

// Route quản lý giỏ hàng
routes.use('/cart', cartRoutes);

export default routes;
