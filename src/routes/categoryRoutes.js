import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import validBodyRequest from '../middlewares/validBodyRequest.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', verifyToken, verifyAdmin, validBodyRequest(createCategorySchema), categoryController.createCategory);
router.put('/:id', verifyToken, verifyAdmin, validBodyRequest(updateCategorySchema), categoryController.updateCategory);
router.delete('/soft-delete/:id', verifyToken, verifyAdmin, categoryController.softDeleteCategory);
router.patch('/restore/:id', verifyToken, verifyAdmin, categoryController.restoreCategory);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.deleteCategory);

export default router;
