import Joi from 'joi';

// Schema validate cho thêm sản phẩm vào wishlist
export const addToWishlistSchema = Joi.object({
    productId: Joi.string().required().messages({
        'string.base': 'ID sản phẩm phải là chuỗi',
        'string.empty': 'ID sản phẩm không được để trống',
        'any.required': 'ID sản phẩm là bắt buộc'
    }),
    variantId: Joi.string().optional().allow(null, '').messages({
        'string.base': 'ID biến thể phải là chuỗi'
    })
});