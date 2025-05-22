import Category from '../models/Category.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import mongoose from 'mongoose';

// GET /categories - Lấy danh sách danh mục (có tìm kiếm, phân trang, lọc)
export const getCategories = handleAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        isActive,
        parentId
    } = req.query;

    const filter = {};

    // Lọc theo trạng thái
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    // Lọc theo danh mục cha
    if (parentId) {
        filter.parentId = parentId;
    }

    // Tìm kiếm theo tên
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    // Kiểm tra nếu filter không hợp lệ (ví dụ: parentId không phải ObjectId)
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(200).json({
            success: true,
            count: 0,
            totalCount: 0,
            currentPage: Number(page),
            totalPages: 0,
            data: []
        });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
        .skip(skip)
        .limit(Number(limit));
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
        success: true,
        count: categories.length,
        totalCount,
        currentPage: Number(page),
        totalPages,
        data: categories
    });
});

// Lấy thông tin một danh mục theo ID
export const getCategoryById = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID danh mục không hợp lệ'));
    }

    const category = await Category.findById(id)
        .populate('parentId', 'name slug');

    if (!category) {
        return next(createError(404, 'Không tìm thấy danh mục'));
    }

    res.status(200).json({
        success: true,
        data: category
    });
});

// Tạo danh mục mới
export const createCategory = handleAsync(async (req, res, next) => {
    const { name, description, parentId, imageUrl, isActive, displayOrder } = req.body;

    // Kiểm tra parentId có tồn tại không (nếu có)
    if (parentId) {
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return next(createError(400, 'ID danh mục cha không hợp lệ'));
        }

        const parentExists = await Category.findById(parentId);
        if (!parentExists) {
            return next(createError(404, 'Danh mục cha không tồn tại'));
        }
    }

    // Tạo danh mục mới (slug sẽ được tạo tự động bằng middleware)
    const category = new Category({
        name,
        description,
        parentId: parentId || null,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0
    });

    // Lưu vào database
    const savedCategory = await category.save();

    req.data = {
        message: 'Tạo danh mục thành công',
        data: savedCategory
    };
    res.status(201);
    return next();
});

// Cập nhật danh mục
export const updateCategory = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID danh mục không hợp lệ'));
    }

    // Kiểm tra danh mục có tồn tại không
    const category = await Category.findById(id);
    if (!category) {
        return next(createError(404, 'Không tìm thấy danh mục'));
    }

    // Kiểm tra parentId có hợp lệ không
    if (req.body.parentId) {
        // Ngăn chặn việc đặt chính nó làm danh mục cha
        if (req.body.parentId === id) {
            return next(createError(400, 'Không thể đặt danh mục làm danh mục cha của chính nó'));
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.parentId)) {
            return next(createError(400, 'ID danh mục cha không hợp lệ'));
        }

        const parentExists = await Category.findById(req.body.parentId);
        if (!parentExists) {
            return next(createError(404, 'Danh mục cha không tồn tại'));
        }
    }

    // Cập nhật thông tin danh mục
    Object.assign(category, req.body);

    // Lưu thay đổi
    const updatedCategory = await category.save();

    req.data = {
        message: 'Cập nhật danh mục thành công',
        data: updatedCategory
    };
    res.status(200);
    return next();
});

// Xóa danh mục
export const deleteCategory = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID danh mục không hợp lệ'));
    }

    // Kiểm tra có danh mục con không
    const childCategories = await Category.findOne({ parentId: id });
    if (childCategories) {
        return next(createError(400, 'Không thể xóa danh mục có chứa danh mục con'));
    }

    // Xóa danh mục
    const result = await Category.findByIdAndDelete(id);

    if (!result) {
        return next(createError(404, 'Không tìm thấy danh mục'));
    }

    req.data = {
        message: 'Xóa danh mục thành công'
    };
    res.status(200);
    return next();
});

// Vô hiệu hóa danh mục (soft delete) và tất cả danh mục con của nó
export const softDeleteCategory = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    const { cascade = true } = req.query; // Mặc định là xóa đệ quy

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID danh mục không hợp lệ'));
    }

    // Tìm danh mục cần xóa
    const category = await Category.findById(id);
    if (!category) {
        return next(createError(404, 'Không tìm thấy danh mục'));
    }

    // Cập nhật trạng thái danh mục hiện tại
    category.isActive = false;
    await category.save();

    let message = 'Vô hiệu hóa danh mục thành công';

    // Nếu cascade=true, xóa mềm tất cả danh mục con
    if (cascade === true || cascade === 'true') {
        // Hàm đệ quy xóa mềm tất cả danh mục con
        const softDeleteChildCategories = async (parentId) => {
            // Tìm tất cả danh mục con trực tiếp
            const childCategories = await Category.find({ parentId });

            if (childCategories.length > 0) {
                // Cập nhật trạng thái của tất cả các danh mục con
                await Category.updateMany(
                    { parentId },
                    { isActive: false }
                );

                // Đệ quy xử lý các danh mục con của các danh mục con
                for (const child of childCategories) {
                    await softDeleteChildCategories(child._id);
                }
            }
        };

        // Thực hiện xóa mềm tất cả danh mục con
        await softDeleteChildCategories(id);
        message = 'Vô hiệu hóa danh mục và tất cả danh mục con thành công';
    }

    // Lấy lại danh mục sau khi cập nhật để trả về
    const updatedCategory = await Category.findById(id);

    req.data = {
        message,
        data: updatedCategory
    };
    res.status(200);
    return next();
});

// Khôi phục danh mục đã vô hiệu hóa và tùy chọn khôi phục các danh mục con
export const restoreCategory = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    const { cascade = true } = req.query; // Mặc định là khôi phục đệ quy

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID danh mục không hợp lệ'));
    }

    // Tìm danh mục cần khôi phục
    const category = await Category.findById(id);
    if (!category) {
        return next(createError(404, 'Không tìm thấy danh mục'));
    }

    // Kiểm tra xem danh mục cha có bị vô hiệu hóa không
    if (category.parentId) {
        const parentCategory = await Category.findById(category.parentId);
        if (parentCategory && !parentCategory.isActive) {
            return next(createError(400, 'Không thể khôi phục danh mục con khi danh mục cha đang bị vô hiệu hóa. Hãy khôi phục danh mục cha trước.'));
        }
    }

    // Cập nhật trạng thái danh mục hiện tại
    category.isActive = true;
    await category.save();

    let message = 'Khôi phục danh mục thành công';

    // Nếu cascade=true, khôi phục tất cả danh mục con
    if (cascade === true || cascade === 'true') {
        // Hàm đệ quy khôi phục tất cả danh mục con
        const restoreChildCategories = async (parentId) => {
            // Tìm tất cả danh mục con trực tiếp
            const childCategories = await Category.find({ parentId });

            if (childCategories.length > 0) {
                // Cập nhật trạng thái của tất cả các danh mục con
                await Category.updateMany(
                    { parentId },
                    { isActive: true }
                );

                // Đệ quy xử lý các danh mục con của các danh mục con
                for (const child of childCategories) {
                    await restoreChildCategories(child._id);
                }
            }
        };

        // Thực hiện khôi phục tất cả danh mục con
        await restoreChildCategories(id);
        message = 'Khôi phục danh mục và tất cả danh mục con thành công';
    }

    // Lấy lại danh mục sau khi cập nhật để trả về
    const updatedCategory = await Category.findById(id);

    req.data = {
        message,
        data: updatedCategory
    };
    res.status(200);
    return next();
});

export default {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    softDeleteCategory,
    restoreCategory
};
