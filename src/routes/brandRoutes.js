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
 * /brands:
 *   get:
 *     summary: Lấy danh sách tất cả thương hiệu
 *     description: Lấy danh sách tất cả thương hiệu với các tùy chọn lọc
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
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', brandController.getAllBrands);

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Lấy thông tin một thương hiệu theo ID
 *     description: Lấy thông tin chi tiết của một thương hiệu dựa trên ID
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
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', brandController.getBrandById);

/**
 * @swagger
 * /brands/slug/{slug}:
 *   get:
 *     summary: Lấy thông tin một thương hiệu theo slug
 *     description: Lấy thông tin chi tiết của một thương hiệu dựa trên slug
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
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/slug/:slug', brandController.getBrandBySlug);

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Tạo thương hiệu mới
 *     description: Tạo một thương hiệu sản phẩm mới
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
 *         description: Không được phép - Yêu cầu xác thực
 *       403:
 *         description: Không có quyền - Yêu cầu quyền Admin
 *       500:
 *         description: Lỗi máy chủ
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
 * /brands/{id}:
 *   put:
 *     summary: Cập nhật thương hiệu
 *     description: Cập nhật thông tin một thương hiệu theo ID
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
 *       200:
 *         description: Cập nhật thương hiệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép - Yêu cầu xác thực
 *       403:
 *         description: Không có quyền - Yêu cầu quyền Admin
 *       404:
 *         description: Không tìm thấy thương hiệu
 *       500:
 *         description: Lỗi máy chủ
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
 * /brands/soft-delete/{id}:
 *   delete:
 *     summary: Vô hiệu hóa thương hiệu (soft delete)
 *     description: Vô hiệu hóa thương hiệu bằng cách đặt isActive thành false
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
 *         description: Không được phép - Yêu cầu xác thực
 *       403:
 *         description: Không có quyền - Yêu cầu quyền Admin
 *       404:
 *         description: Không tìm thấy thương hiệu
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete(
    '/soft-delete/:id',
    verifyToken,
    verifyAdmin,
    brandController.softDeleteBrand
);

/**
 * @swagger
 * /brands/restore/{id}:
 *   patch:
 *     summary: Khôi phục thương hiệu đã vô hiệu hóa
 *     description: Khôi phục thương hiệu đã bị xóa mềm bằng cách đặt isActive thành true
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
 *         description: Không được phép - Yêu cầu xác thực
 *       403:
 *         description: Không có quyền - Yêu cầu quyền Admin
 *       404:
 *         description: Không tìm thấy thương hiệu
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch(
    '/restore/:id',
    verifyToken,
    verifyAdmin,
    brandController.restoreBrand
);

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Xóa thương hiệu vĩnh viễn
 *     description: Xóa vĩnh viễn thương hiệu theo ID (chỉ khả thi nếu không có sản phẩm nào sử dụng thương hiệu này)
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
 *         description: Không được phép - Yêu cầu xác thực
 *       403:
 *         description: Không có quyền - Yêu cầu quyền Admin
 *       404:
 *         description: Không tìm thấy thương hiệu
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete(
    '/:id',
    verifyToken,
    verifyAdmin,
    brandController.deleteBrand
);

export default router;
