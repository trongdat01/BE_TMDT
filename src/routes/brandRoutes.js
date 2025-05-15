import express from 'express';
import brandController from '../controllers/brandController.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwt.middleware.js';
import validBodyRequest from '../middlewares/validBodyRequest.js';
import { createBrandSchema, updateBrandSchema } from '../schemas/brandSchema.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: API quản lý thương hiệu sản phẩm
 */

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Lấy danh sách tất cả thương hiệu
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: withProductCount
 *         schema:
 *           type: boolean
 *         description: Thêm số lượng sản phẩm cho mỗi thương hiệu
 *       - in: query
 *         name: isDomestic
 *         schema:
 *           type: boolean
 *         description: Lọc theo thương hiệu nội địa hoặc quốc tế
 *       - in: query
 *         name: groupByOrigin
 *         schema:
 *           type: boolean
 *         description: Nhóm thương hiệu theo nguồn gốc
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Lấy các thương hiệu phổ biến nhất
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Giới hạn số lượng thương hiệu phổ biến trả về
 *     responses:
 *       200:
 *         description: Danh sách thương hiệu
 */
router.get('/', brandController.getAllBrands);

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Lấy thông tin một thương hiệu theo ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thương hiệu
 *     responses:
 *       200:
 *         description: Thông tin thương hiệu
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.get('/:id', brandController.getBrandById);

/**
 * @swagger
 * /api/brands/slug/{slug}:
 *   get:
 *     summary: Lấy thông tin một thương hiệu theo slug
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của thương hiệu
 *     responses:
 *       200:
 *         description: Thông tin thương hiệu
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.get('/slug/:slug', brandController.getBrandBySlug);

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Tạo thương hiệu mới
 *     tags: [Brands]
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
 *                 description: Tên thương hiệu
 *               logoUrl:
 *                 type: string
 *                 description: URL logo của thương hiệu
 *               description:
 *                 type: string
 *                 description: Mô tả về thương hiệu
 *               isDomestic:
 *                 type: boolean
 *                 description: Đánh dấu thương hiệu trong nước hay quốc tế
 *     responses:
 *       201:
 *         description: Tạo thương hiệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post(
    '/',
    verifyToken,
    verifyAdmin,
    validBodyRequest(createBrandSchema),
    brandController.createBrand
);

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: Cập nhật thương hiệu
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thương hiệu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               isDomestic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thương hiệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.put(
    '/:id',
    verifyToken,
    verifyAdmin,
    validBodyRequest(updateBrandSchema),
    brandController.updateBrand
);

/**
 * @swagger
 * /api/brands/soft-delete/{id}:
 *   delete:
 *     summary: Vô hiệu hóa thương hiệu (soft delete)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thương hiệu
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thương hiệu thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.delete(
    '/soft-delete/:id',
    verifyToken,
    verifyAdmin,
    brandController.softDeleteBrand
);

/**
 * @swagger
 * /api/brands/restore/{id}:
 *   patch:
 *     summary: Khôi phục thương hiệu đã vô hiệu hóa
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thương hiệu
 *     responses:
 *       200:
 *         description: Khôi phục thương hiệu thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.patch(
    '/restore/:id',
    verifyToken,
    verifyAdmin,
    brandController.restoreBrand
);

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Xóa thương hiệu
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thương hiệu
 *     responses:
 *       200:
 *         description: Xóa thương hiệu thành công
 *       400:
 *         description: Không thể xóa thương hiệu có chứa sản phẩm
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.delete(
    '/:id',
    verifyToken,
    verifyAdmin,
    brandController.deleteBrand
);

export default router;
