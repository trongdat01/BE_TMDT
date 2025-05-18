import express from 'express';
import {
    getVariantsByProduct,
    getVariantById,
    createVariant,
    updateVariant,
    deleteVariant
} from '../controllers/productVariantController.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
    createProductVariantSchema,
    updateProductVariantSchema
} from '../schemas/productVariantSchema.js';

const router = express.Router();

// Lấy danh sách biến thể của một sản phẩm
router.get('/products/:productId/variants', getVariantsByProduct);

// Lấy thông tin chi tiết của một biến thể
router.get('/products/variants/:variantId', getVariantById);

// Tạo biến thể mới cho sản phẩm (admin/staff)
router.post(
    '/products/:productId/variants',
    verifyToken,
    checkRole('admin', 'staff'),
    validateRequest(createProductVariantSchema),
    createVariant
);

// Cập nhật biến thể (admin/staff)
router.put(
    '/products/variants/:variantId',
    verifyToken,
    checkRole('admin', 'staff'),
    validateRequest(updateProductVariantSchema),
    updateVariant
);

// Xóa biến thể (admin/staff)
router.delete(
    '/products/variants/:variantId',
    verifyToken,
    checkRole('admin', 'staff'),
    deleteVariant
);

export default router;
