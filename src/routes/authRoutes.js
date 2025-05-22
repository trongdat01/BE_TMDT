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

// Đăng ký người dùng mới
router.post('/register', validBodyRequest(registerSchema), authController.register);

// Đăng nhập
router.post('/login', validBodyRequest(loginSchema), authController.login);

// Làm mới access token
router.post('/refresh-token', authController.refreshToken);

// Lấy thông tin người dùng hiện tại
router.get('/me', verifyToken, authController.getCurrentUser);

// Đổi mật khẩu
router.post(
    '/change-password',
    verifyToken,
    validBodyRequest(changePasswordSchema),
    authController.changePassword
);

// Quên mật khẩu
router.post('/forgot-password', validBodyRequest(forgotPasswordSchema), authController.forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', validBodyRequest(resetPasswordSchema), authController.resetPassword);

export default router;
