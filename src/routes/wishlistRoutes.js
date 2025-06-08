import express from 'express';
import * as wishlistController from '../controllers/wishlistControllers.js';
import { verifyToken } from '../middlewares/jwt.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: API quản lý danh sách yêu thích của người dùng
 */

/**
 * @swagger
 * /api/wishlists:
 *   get:
 *     summary: Lấy danh sách yêu thích của người dùng
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 *       401:
 *         description: Chưa xác thực
 */
router.get('/', verifyToken, wishlistController.getWishlists);

/**
 * @swagger
 * /api/wishlists:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID sản phẩm
 *               variantId:
 *                 type: string
 *                 description: ID biến thể sản phẩm (nếu có)
 *     responses:
 *       201:
 *         description: Đã thêm vào danh sách yêu thích
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đã tồn tại
 *       401:
 *         description: Chưa xác thực
 */
router.post('/', verifyToken, wishlistController.addToWishlist);

/**
 * @swagger
 * /api/wishlists/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID mục wishlist
 *     responses:
 *       200:
 *         description: Đã xóa khỏi danh sách yêu thích
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy mục yêu thích
 */
router.delete('/:id', verifyToken, wishlistController.removeFromWishlist);

/**
 * @swagger
 * /api/wishlists/check/{productId}:
 *   get:
 *     summary: Kiểm tra sản phẩm có trong danh sách yêu thích không
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.get('/check/:productId', verifyToken, wishlistController.checkWishlist);

export default router;