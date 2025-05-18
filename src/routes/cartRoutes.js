import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    mergeCart
} from '../controllers/cartController.js';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
    addToCartSchema,
    updateCartItemSchema,
    mergeCartSchema
} from '../schemas/cartSchema.js';

const router = express.Router();

// Lấy giỏ hàng (user hoặc guest)
router.get('/', optionalAuth, getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/', optionalAuth, validateRequest(addToCartSchema), addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/items/:itemId', optionalAuth, validateRequest(updateCartItemSchema), updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/items/:itemId', optionalAuth, removeCartItem);

// Xóa toàn bộ giỏ hàng
router.delete('/', optionalAuth, clearCart);

// Gộp giỏ hàng guest vào user khi đăng nhập
router.post('/merge', verifyToken, validateRequest(mergeCartSchema), mergeCart);

export default router;
