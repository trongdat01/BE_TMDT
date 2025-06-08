import express from 'express';
import * as authController from '../controllers/authController.js';
import {
    verifyToken,
    verifyAdmin,
    verifyAdminToken,
    verifyAdminWithToken,
    verifyStaffWithToken
} from '../middlewares/jwt.middleware.js';
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

// Lấy thông tin admin hiện tại (chỉ dành cho admin routes)
router.get('/me/admin', verifyAdminToken, authController.adminGetMe);

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

// Admin Routes - Sử dụng middleware verifyAdminWithToken để đảm bảo token có type=admin
router.get('/admin', verifyAdminWithToken, authController.getAdminUsers);
router.post('/admin', verifyAdminWithToken, validateSchema(createAdminUserSchema), authController.createAdminUser);
router.delete('/admin/:id', verifyAdminWithToken, authController.deleteAdminUser);

// Quản lý tài khoản Admin
router.get('/admin/:id', verifyAdminWithToken, authController.getAdminUserById); // Lấy thông tin admin theo ID
router.put('/admin/:id', verifyAdminWithToken, validateSchema(updateAdminUserSchema), authController.updateAdminUser); // Cập nhật thông tin admin
router.patch('/admin/:id/status', verifyAdminWithToken, validateSchema(updateActiveStatusSchema), authController.updateAdminActiveStatus); // Cập nhật trạng thái hoạt động
router.patch('/admin/:id/role', verifyAdminWithToken, validateSchema(updateRoleSchema), authController.updateAdminRole); // Cập nhật vai trò
router.post('/admin/:id/reset-password', verifyAdminWithToken, validateSchema(adminResetPasswordSchema), authController.adminResetPassword); // Đặt lại mật khẩu admin

// Các route cho Super Admin - chỉ admin đầu tiên trong hệ thống có quyền truy cập
router.get('/superadmin/check', verifyAdminWithToken, authController.checkIsSuperAdmin);

export default router;
