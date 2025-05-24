import express from 'express';
import authController from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import validBodyRequest, { validateSchema } from '../middlewares/validBodyRequest.js';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../schemas/authSchema.js';
import {
    createAdminUserSchema,
    updateAdminUserSchema,
    updateActiveStatusSchema,
    updateRoleSchema,
    adminResetPasswordSchema
} from '../schemas/adminUserSchema.js';

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

// Admin Routes
router.get('/admin', verifyToken, verifyAdmin, authController.getAdminUsers);
router.post('/admin', verifyToken, verifyAdmin, validateSchema(createAdminUserSchema), authController.createAdminUser);
router.delete('/admin/:id', verifyToken, verifyAdmin, authController.deleteAdminUser);

// Quản lý tài khoản Admin
router.get('/admin/:id', verifyToken, verifyAdmin, authController.getAdminUserById); // Lấy thông tin admin theo ID
router.put('/admin/:id', verifyToken, verifyAdmin, validateSchema(updateAdminUserSchema), authController.updateAdminUser); // Cập nhật thông tin admin
router.patch('/admin/:id/status', verifyToken, verifyAdmin, validateSchema(updateActiveStatusSchema), authController.updateAdminActiveStatus); // Cập nhật trạng thái hoạt động
router.patch('/admin/:id/role', verifyToken, verifyAdmin, validateSchema(updateRoleSchema), authController.updateAdminRole); // Cập nhật vai trò
router.post('/admin/:id/reset-password', verifyToken, verifyAdmin, validateSchema(adminResetPasswordSchema), authController.adminResetPassword); // Đặt lại mật khẩu admin

export default router;
