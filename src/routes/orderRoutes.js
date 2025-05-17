import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { verifyToken, verifyStaff } from '../middlewares/jwt.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import handleAsync from '../utils/handleAsync.js';
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema } from '../schemas/orderSchemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng đăng nhập
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *       401:
 *         description: Không xác thực
 */
router.get('/', verifyToken, handleAsync(orderController.getMyOrders));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của một đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *       401:
 *         description: Không xác thực
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/:id', verifyToken, handleAsync(orderController.getOrderById));

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới (chuyển từ giỏ hàng sang)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không xác thực
 */
router.post('/', verifyToken, validateRequest(createOrderSchema), handleAsync(orderController.createOrder));

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (admin/staff)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.patch('/:id/status', verifyToken, verifyStaff, validateRequest(updateOrderStatusSchema), handleAsync(orderController.updateOrderStatus));

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng (khách hàng/admin/staff)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đơn hàng đã được hủy
 *       401:
 *         description: Không xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.patch('/:id/cancel', verifyToken, validateRequest(cancelOrderSchema), handleAsync(orderController.cancelOrder));

/**
 * @swagger
 * /api/orders/{id}/tracking:
 *   get:
 *     summary: Lấy thông tin theo dõi đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin tracking đơn hàng
 *       401:
 *         description: Không xác thực
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/:id/tracking', verifyToken, handleAsync(orderController.getOrderTracking));

export default router;