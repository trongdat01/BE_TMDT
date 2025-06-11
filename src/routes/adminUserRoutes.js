import express from 'express';
import * as adminUserController from '../controllers/adminUserController.js';
import { validateSchema } from '../middlewares/validBodyRequest.js';
import {
    verifyAdminWithToken,
    verifyStaffWithToken,
    verifyStrictAdminWithToken
} from '../middlewares/jwt.middleware.js';
import {
    createUserSchema,
    updateUserSchema,
    bulkDeleteUsersSchema
} from '../schemas/userSchema.js';
import {
    updateActiveStatusSchema,
    adminResetPasswordSchema
} from '../schemas/adminUserSchema.js';

const router = express.Router();

// ===== Danh sách và tìm kiếm người dùng =====
// Cả admin và staff đều có thể xem danh sách/tìm kiếm người dùng
router.get('/', verifyStaffWithToken, adminUserController.getUsers);
router.get('/search', verifyStaffWithToken, adminUserController.searchUsers);

// ===== Xem chi tiết người dùng =====
router.get('/:id', verifyStaffWithToken, adminUserController.getUserById);
router.get('/:id/addresses', verifyStaffWithToken, adminUserController.getUserAddresses);
router.get('/:id/activities', verifyStaffWithToken, adminUserController.getUserActivities);

// ===== Tạo và cập nhật người dùng =====
// Cả admin và staff đều có thể tạo/cập nhật người dùng
router.post('/', verifyStaffWithToken, validateSchema(createUserSchema), adminUserController.createUser);
router.put('/:id', verifyStaffWithToken, validateSchema(updateUserSchema), adminUserController.updateUser);

// ===== Quản lý trạng thái và mật khẩu =====
// Cập nhật trạng thái (có kiểm tra quyền theo role bên trong controller)
router.patch('/:id/status', verifyStaffWithToken, validateSchema(updateActiveStatusSchema), adminUserController.updateUserStatus);

// Reset mật khẩu (cả admin và staff)
router.post('/:id/reset-password', verifyStaffWithToken, validateSchema(adminResetPasswordSchema), adminUserController.resetUserPassword);

// ===== Các chức năng chỉ dành cho Admin =====
// Xóa người dùng (chỉ admin)
router.delete('/:id', verifyStrictAdminWithToken, adminUserController.deleteUser);

// Xóa hàng loạt (chỉ admin)
router.post('/bulk-delete', verifyStrictAdminWithToken, validateSchema(bulkDeleteUsersSchema), adminUserController.bulkDeleteUsers);

// Thống kê người dùng (admin và staff đều xem được)
router.get('/statistics/overview', verifyStaffWithToken, adminUserController.getUserStatistics);

// Xuất dữ liệu người dùng (chỉ admin)
router.get('/export/data', verifyStrictAdminWithToken, adminUserController.exportUsers);

export default router;
