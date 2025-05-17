import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    softDeleteProduct,
    restoreProduct,
    getFeaturedProducts,
    searchProducts
} from '../controllers/productController.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../schemas/productSchema.js';

const router = express.Router();

// Định nghĩa các tuyến đường cho sản phẩm

// GET /products - Lấy danh sách sản phẩm (có phân trang, lọc theo danh mục, thương hiệu, giá...)
router.get('/', validateRequest(productQuerySchema, 'query'), getAllProducts);

// GET /products/featured - Lấy danh sách sản phẩm nổi bật
router.get('/featured', getFeaturedProducts);

// GET /products/search - Tìm kiếm sản phẩm
router.get('/search', validateRequest(productQuerySchema, 'query'), searchProducts);

// GET /products/slug/{slug} - Lấy thông tin sản phẩm theo slug
router.get('/slug/:slug', getProductBySlug);

// DELETE /products/soft-delete/{id} - Xóa mềm sản phẩm (admin/staff)
router.delete(
    '/soft-delete/:id',
    verifyToken,
    checkRole('admin', 'staff'),
    softDeleteProduct
);

// PATCH /products/restore/{id} - Khôi phục sản phẩm đã xóa mềm (admin)
router.patch(
    '/restore/:id',
    verifyToken,
    checkRole('admin'),
    restoreProduct
);

// GET /products/{id} - Lấy thông tin chi tiết của một sản phẩm
router.get('/:id', getProductById);

// POST /products - Tạo sản phẩm mới (admin/staff)
router.post(
    '/',
    verifyToken,
    checkRole('admin', 'staff'),
    validateRequest(createProductSchema),
    createProduct
);

// PUT /products/{id} - Cập nhật thông tin sản phẩm (admin/staff)
router.put(
    '/:id',
    verifyToken,
    checkRole('admin', 'staff'),
    validateRequest(updateProductSchema),
    updateProduct
);

// DELETE /products/{id} - Xóa vĩnh viễn sản phẩm (admin)
router.delete(
    '/:id',
    verifyToken,
    checkRole('admin'),
    deleteProduct
);

export default router;
