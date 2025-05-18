import express from 'express';
import reviewController from '../controllers/reviewController.js';
import { verifyToken } from '../middlewares/jwt.middleware.js';
import { checkRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API đánh giá sản phẩm
 */

/**
 * @swagger
 * /products/{productId}/reviews:
 *   get:
 *     summary: Lấy tất cả đánh giá của một sản phẩm
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 *       400:
 *         description: ID sản phẩm không hợp lệ
 */
router.get(
  '/products/:productId/reviews',
  reviewController.getProductReviews
);

/**
 * @swagger
 * /products/{productId}/reviews:
 *   post:
 *     summary: Thêm đánh giá mới cho sản phẩm
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                     caption:
 *                       type: string
 *     responses:
 *       201:
 *         description: Đánh giá đã được gửi
 *       400:
 *         description: Không thể đánh giá sản phẩm này
 *       401:
 *         description: Chưa đăng nhập
 */
router.post(
  '/products/:productId/reviews',
  verifyToken,
  reviewController.createReview
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Cập nhật đánh giá (chỉ người tạo)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                     caption:
 *                       type: string
 *     responses:
 *       200:
 *         description: Cập nhật đánh giá thành công
 *       403:
 *         description: Không có quyền sửa đánh giá này
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.put(
  '/reviews/:reviewId',
  verifyToken,
  reviewController.updateReview
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Xóa đánh giá (người dùng hoặc admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá
 *     responses:
 *       200:
 *         description: Đã xóa đánh giá
 *       403:
 *         description: Không có quyền xóa đánh giá này
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.delete(
  '/reviews/:reviewId',
  verifyToken,
  reviewController.deleteReview
);

/**
 * @swagger
 * /reviews/{reviewId}/approve:
 *   patch:
 *     summary: Phê duyệt đánh giá (admin/staff)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá
 *     responses:
 *       200:
 *         description: Đánh giá đã được phê duyệt
 *       403:
 *         description: Không có quyền phê duyệt
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.patch(
  '/reviews/:reviewId/approve',
  verifyToken,
  checkRole('admin', 'staff'),
  reviewController.approveReview
);

export default router;