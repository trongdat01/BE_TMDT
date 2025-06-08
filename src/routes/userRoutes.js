import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import handleAsync from '../utils/handleAsync.js';
import { validateSchema } from '../middlewares/validBodyRequest.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/addressSchema.js';

const router = express.Router();

router.post('/register', handleAsync(userController.register));
router.post('/login', handleAsync(userController.login));
router.get('/me', verifyToken, handleAsync(userController.getCurrentUser));

router.get('/:id', verifyToken, verifyAdmin, handleAsync(userController.getUserById));
router.put('/:id', verifyToken, handleAsync(userController.updateUser));
router.delete('/:id', verifyToken, handleAsync(userController.deleteUser));


// Lấy tất cả người dùng (chỉ admin)
router.get('/', verifyToken, verifyAdmin, handleAsync(userController.getUsers));
router.get('/me/addresses', verifyToken, handleAsync(userController.getMyAddresses));
router.post('/me/addresses', verifyToken, validateSchema(createAddressSchema), handleAsync(userController.addAddress));
router.put('/me/addresses/:addressId', verifyToken, validateSchema(updateAddressSchema), handleAsync(userController.updateAddress));
router.delete('/me/addresses/:addressId', verifyToken, handleAsync(userController.deleteAddress));
router.patch('/me/addresses/:addressId/default', verifyToken, handleAsync(userController.setDefaultAddress));

export default router;