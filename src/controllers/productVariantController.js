import ProductVariant from '../models/ProductVariant.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';

// Lấy danh sách biến thể của một sản phẩm
export const getVariantsByProduct = handleAsync(async (req, res, next) => {
    const { productId } = req.params;
    const variants = await ProductVariant.find({ productId });
    res.json(variants);
});

// Lấy thông tin chi tiết của một biến thể
export const getVariantById = handleAsync(async (req, res, next) => {
    const { variantId } = req.params;
    const variant = await ProductVariant.findById(variantId);
    if (!variant) return next(createError(404, 'Không tìm thấy biến thể sản phẩm'));
    res.json(variant);
});

// Tạo biến thể mới cho sản phẩm
export const createVariant = handleAsync(async (req, res, next) => {
    const { productId } = req.params;
    const data = { ...req.body, productId };
    const variant = await ProductVariant.create(data);
    res.status(201).json(variant);
});

// Cập nhật biến thể
export const updateVariant = handleAsync(async (req, res, next) => {
    const { variantId } = req.params;
    const variant = await ProductVariant.findByIdAndUpdate(variantId, req.body, { new: true });
    if (!variant) return next(createError(404, 'Không tìm thấy biến thể sản phẩm'));
    res.json(variant);
});

// Xóa biến thể
export const deleteVariant = handleAsync(async (req, res, next) => {
    const { variantId } = req.params;
    const variant = await ProductVariant.findByIdAndDelete(variantId);
    if (!variant) return next(createError(404, 'Không tìm thấy biến thể sản phẩm'));
    res.json({ success: true });
});
