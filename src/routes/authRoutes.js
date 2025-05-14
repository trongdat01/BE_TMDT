import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/jwt.middleware.js';
import validBodyRequest from '../middlewares/validBodyRequest.js';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../schemas/authSchema.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Xác nhận mật khẩu
 *               fullName:
 *                 type: string
 *                 description: Họ và tên
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (không bắt buộc)
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đã tồn tại
 */
router.post('/register', validBodyRequest(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email hoặc tên đăng nhập
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Thông tin đăng nhập không đúng
 */
router.post('/login', validBodyRequest(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Access token mới đã được tạo
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Không được xác thực
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu hiện tại
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 description: Xác nhận mật khẩu mới
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không đúng
 */
router.post(
    '/change-password',
    verifyToken,
    validBodyRequest(changePasswordSchema),
    authController.changePassword
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *     responses:
 *       200:
 *         description: Link đặt lại mật khẩu đã được gửi (nếu email tồn tại)
 */
router.post('/forgot-password', validBodyRequest(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token đặt lại mật khẩu
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 description: Xác nhận mật khẩu mới
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password', validBodyRequest(resetPasswordSchema), authController.resetPassword);

export default router;
