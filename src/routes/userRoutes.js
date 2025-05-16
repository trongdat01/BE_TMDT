import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import handleAsync from '../utils/handleAsync.js';
import { validateSchema } from '../middlewares/validBodyRequest.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/addressSchema.js';
import { createAdminUserSchema } from '../schemas/adminUserSchema.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: API for user management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
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
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/register', handleAsync(userController.register));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', handleAsync(userController.login));

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', verifyToken, handleAsync(userController.getCurrentUser));

// Đặt các route có path cụ thể ('/admin') trước các route có params ('/:id')
router.get('/admin', verifyToken, verifyAdmin, handleAsync(userController.getAdminUsers));
router.post('/admin', verifyToken, verifyAdmin, validateSchema(createAdminUserSchema), handleAsync(userController.createAdminUser));
router.delete('/admin/:id', verifyToken, verifyAdmin, handleAsync(userController.deleteAdminUser));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, verifyAdmin, handleAsync(userController.getUserById));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, handleAsync(userController.updateUser));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, handleAsync(userController.deleteUser));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng lấy thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
// Lấy tất cả người dùng (chỉ admin)
router.get('/', verifyToken, verifyAdmin, handleAsync(userController.getUsers));

/**
 * @swagger
 * /api/users/admin:
 *   post:
 *     summary: Tạo tài khoản Admin hoặc Staff mới (chỉ Admin có quyền)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *               - fullName
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập của admin/staff
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của admin/staff
 *               password:
 *                 type: string
 *                 description: Mật khẩu (sẽ được mã hóa)
 *               fullName:
 *                 type: string
 *                 description: Họ tên đầy đủ của admin/staff
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại của admin/staff
 *               role:
 *                 type: string
 *                 enum: [admin, staff]
 *                 description: Vai trò của người dùng (admin hoặc staff)
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tài khoản đã tồn tại
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
// Route đã được di chuyển lên phía trên

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Lấy danh sách tài khoản Admin và Staff (chỉ Admin có quyền)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: role
 *         in: query
 *         required: false
 *         description: Lọc theo vai trò (admin hoặc staff)
 *         schema:
 *           type: string
 *           enum: [admin, staff]
 *     responses:
 *       200:
 *         description: Danh sách tài khoản Admin và Staff
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
// Route đã được di chuyển lên phía trên, trước route '/:id'

/**
 * @swagger
 * /api/users/admin/{id}:
 *   delete:
 *     summary: Xóa tài khoản Admin hoặc Staff (Admin có quyền xóa Staff, chỉ Super Admin có quyền xóa Admin khác)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của tài khoản Admin/Staff cần xóa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 *       400:
 *         description: Không thể xóa tài khoản (tài khoản của chính mình hoặc Admin duy nhất)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền thực hiện hành động này
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi server
 */
// Route đã được di chuyển lên phía trên

/**
 * @swagger
 * /api/users/me/addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user addresses
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me/addresses', verifyToken, handleAsync(userController.getMyAddresses));

/**
 * @swagger
 * /api/users/me/addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên của địa chỉ (vd. Nhà riêng, Công ty)
 *               receiverName:
 *                 type: string
 *                 description: Tên người nhận
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *               addressLine:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/me/addresses', verifyToken, validateSchema(createAddressSchema), handleAsync(userController.addAddress));

/**
 * @swagger
 * /api/users/me/addresses/{addressId}:
 *   put:
 *     summary: Update an address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: addressId
 *         in: path
 *         required: true
 *         description: Address ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên của địa chỉ (vd. Nhà riêng, Công ty)
 *               receiverName:
 *                 type: string
 *                 description: Tên người nhận
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *               addressLine:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.put('/me/addresses/:addressId', verifyToken, validateSchema(updateAddressSchema), handleAsync(userController.updateAddress));

/**
 * @swagger
 * /api/users/me/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: addressId
 *         in: path
 *         required: true
 *         description: Address ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete('/me/addresses/:addressId', verifyToken, handleAsync(userController.deleteAddress));

/**
 * @swagger
 * /api/users/me/addresses/{addressId}/default:
 *   patch:
 *     summary: Set an address as default
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: addressId
 *         in: path
 *         required: true
 *         description: Address ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default address set successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.patch('/me/addresses/:addressId/default', verifyToken, handleAsync(userController.setDefaultAddress));

export default router;