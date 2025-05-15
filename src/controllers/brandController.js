// Controller cho Brand API
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import mongoose from 'mongoose';

// Lấy danh sách tất cả thương hiệu
export const getAllBrands = handleAsync(async (req, res) => {
    const { withProductCount, isDomestic, isActive } = req.query;

    let brands;
    // Xây dựng filter
    const filter = {};

    // Lọc theo trạng thái active nếu có
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    // Nếu có tham số isDomestic, lọc theo nguồn gốc
    if (isDomestic !== undefined) {
        filter.isDomestic = isDomestic === 'true';
        brands = await Brand.find(filter).sort({ name: 1 });
    }    // Nếu yêu cầu đếm số lượng sản phẩm
    else if (withProductCount === 'true') {
        // Thêm filter vào truy vấn getWithProductCount
        brands = await Brand.find(filter);

        for (const brand of brands) {
            brand._productCount = await Product.countDocuments({
                brandId: brand._id,
                isActive: true
            });
        }
    }
    // Lấy tất cả thương hiệu phân loại theo nguồn gốc
    else if (req.query.groupByOrigin === 'true') {
        // Mặc định chỉ lấy các thương hiệu đang hoạt động
        if (isActive === undefined) {
            filter.isActive = true;
        }

        const domestic = await Brand.find({ ...filter, isDomestic: true }).sort({ name: 1 });
        const international = await Brand.find({ ...filter, isDomestic: false }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            data: { domestic, international }
        });
    }
    // Lấy các thương hiệu phổ biến nhất
    else if (req.query.popular === 'true') {
        const limit = parseInt(req.query.limit) || 10;        // Mặc định chỉ lấy các thương hiệu đang hoạt động
        if (isActive === undefined) {
            filter.isActive = true;
        }

        const productFilter = { isActive: true };

        // Aggregate để đếm số lượng sản phẩm cho mỗi thương hiệu
        const brandStats = await Product.aggregate([
            { $match: productFilter },
            { $group: { _id: '$brandId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        // Lấy thông tin chi tiết của các thương hiệu
        const brandIds = brandStats.map(item => item._id);
        const brands = await Brand.find({ _id: { $in: brandIds }, ...filter });

        // Sắp xếp kết quả theo thứ tự phổ biến
        const sortedBrands = [];
        for (const stats of brandStats) {
            const brand = brands.find(b => b._id.toString() === stats._id.toString());
            if (brand) {
                brand._productCount = stats.count;
                sortedBrands.push(brand);
            }
        }

        return res.status(200).json({
            success: true,
            count: sortedBrands.length,
            data: sortedBrands
        });
    }
    // Mặc định lấy tất cả
    else {
        brands = await Brand.find(filter).sort({ name: 1 });
    }

    res.status(200).json({
        success: true,
        count: brands.length,
        data: brands
    });
});

// Lấy thông tin một thương hiệu theo ID
export const getBrandById = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID thương hiệu không hợp lệ'));
    }

    const brand = await Brand.findById(id);

    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }

    res.status(200).json({
        success: true,
        data: brand
    });
});

// Lấy thông tin một thương hiệu theo slug
export const getBrandBySlug = handleAsync(async (req, res, next) => {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug });

    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }

    res.status(200).json({
        success: true,
        data: brand
    });
});

// Tạo thương hiệu mới
export const createBrand = handleAsync(async (req, res, next) => {
    const { name, logoUrl, description, isDomestic } = req.body;

    // Kiểm tra tên thương hiệu đã tồn tại chưa
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
        return next(createError(400, 'Tên thương hiệu đã tồn tại'));
    }

    // Tạo brand mới (slug sẽ được tạo tự động bằng middleware)
    const brand = new Brand({
        name,
        logoUrl,
        description,
        isDomestic: isDomestic !== undefined ? isDomestic : true
    });

    // Lưu vào database
    const savedBrand = await brand.save();

    res.status(201).json({
        success: true,
        message: 'Tạo thương hiệu thành công',
        data: savedBrand
    });
});

// Cập nhật thương hiệu
export const updateBrand = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, logoUrl, description, isDomestic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID thương hiệu không hợp lệ'));
    }

    // Kiểm tra thương hiệu có tồn tại không
    const brand = await Brand.findById(id);
    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }

    // Kiểm tra nếu đổi tên thì tên mới có trùng với thương hiệu khác không
    if (name && name !== brand.name) {
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return next(createError(400, 'Tên thương hiệu đã tồn tại'));
        }
        brand.name = name;
    }

    // Cập nhật thông tin thương hiệu
    if (logoUrl !== undefined) brand.logoUrl = logoUrl;
    if (description !== undefined) brand.description = description;
    if (isDomestic !== undefined) brand.isDomestic = isDomestic;

    // Lưu thay đổi
    const updatedBrand = await brand.save();

    res.status(200).json({
        success: true,
        message: 'Cập nhật thương hiệu thành công',
        data: updatedBrand
    });
});

// Xóa thương hiệu
export const deleteBrand = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID thương hiệu không hợp lệ'));
    }

    // Kiểm tra xem thương hiệu có tồn tại không
    const brand = await Brand.findById(id);
    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }    // Kiểm tra có sản phẩm nào thuộc thương hiệu này không
    const productsCount = await Product.countDocuments({ brandId: id });

    if (productsCount > 0) {
        return next(createError(400, `Không thể xóa thương hiệu đang có ${productsCount} sản phẩm`));
    }

    // Xóa thương hiệu
    await Brand.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Xóa thương hiệu thành công'
    });
});

// Vô hiệu hóa thương hiệu (soft delete)
export const softDeleteBrand = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID thương hiệu không hợp lệ'));
    }

    const brand = await Brand.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
    );

    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }

    res.status(200).json({
        success: true,
        message: 'Vô hiệu hóa thương hiệu thành công',
        data: brand
    });
});

// Khôi phục thương hiệu đã vô hiệu hóa
export const restoreBrand = handleAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID thương hiệu không hợp lệ'));
    }

    const brand = await Brand.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
    );

    if (!brand) {
        return next(createError(404, 'Không tìm thấy thương hiệu'));
    }

    res.status(200).json({
        success: true,
        message: 'Khôi phục thương hiệu thành công',
        data: brand
    });
});

export default {
    getAllBrands,
    getBrandById,
    getBrandBySlug,
    createBrand,
    updateBrand,
    deleteBrand,
    softDeleteBrand,
    restoreBrand
};
