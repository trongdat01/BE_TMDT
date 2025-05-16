import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import handleAsync from '../utils/handleAsync.js';
import { validateSchema } from '../middlewares/validBodyRequest.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/addressSchema.js';

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