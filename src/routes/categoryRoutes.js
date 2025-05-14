import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import validBodyRequest from '../middlewares/validBodyRequest.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API quản lý danh mục sản phẩm
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách tất cả danh mục
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái kích hoạt
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục cha
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Lấy thông tin một danh mục theo ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *     responses:
 *       200:
 *         description: Thông tin danh mục
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả về danh mục
 *               parentId:
 *                 type: string
 *                 description: ID của danh mục cha (nếu có)
 *               imageUrl:
 *                 type: string
 *                 description: URL hình ảnh của danh mục
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái danh mục
 *               displayOrder:
 *                 type: integer
 *                 description: Thứ tự hiển thị
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post(
    '/',
    verifyToken,
    verifyAdmin,
    validBodyRequest(createCategorySchema),
    categoryController.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.put(
    '/:id',
    verifyToken,
    verifyAdmin,
    validBodyRequest(updateCategorySchema),
    categoryController.updateCategory
);

/**
 * @swagger
 * /api/categories/soft-delete/{id}:
 *   delete:
 *     summary: Vô hiệu hóa danh mục (soft delete)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *       - in: query
 *         name: cascade
 *         schema:
 *           type: boolean
 *         description: Xác định có vô hiệu hóa tất cả danh mục con không (mặc định là true)
 *     responses:
 *       200:
 *         description: Vô hiệu hóa danh mục thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.delete(
    '/soft-delete/:id',
    verifyToken,
    verifyAdmin,
    categoryController.softDeleteCategory
);

/**
 * @swagger
 * /api/categories/restore/{id}:
 *   patch:
 *     summary: Khôi phục danh mục đã vô hiệu hóa
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *       - in: query
 *         name: cascade
 *         schema:
 *           type: boolean
 *         description: Xác định có khôi phục tất cả danh mục con không (mặc định là true)
 *     responses:
 *       200:
 *         description: Khôi phục danh mục thành công
 *       400:
 *         description: Không thể khôi phục khi danh mục cha đang bị vô hiệu hóa
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.patch(
    '/restore/:id',
    verifyToken,
    verifyAdmin,
    categoryController.restoreCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *       400:
 *         description: Không thể xóa danh mục có chứa danh mục con
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.delete(
    '/:id',
    verifyToken,
    verifyAdmin,
    categoryController.deleteCategory
);

export default router;
