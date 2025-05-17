import Joi from 'joi';

/**
 * Validation schema for product image
 */
const imageSchema = Joi.object({
    id: Joi.string(),
    imageUrl: Joi.string().required().messages({
        'string.empty': 'URL hình ảnh không được để trống',
        'any.required': 'URL hình ảnh là bắt buộc'
    }),
    altText: Joi.string().allow('', null),
    displayOrder: Joi.number().integer().min(0).default(0),
    isPrimary: Joi.boolean().default(false)
});

/**
 * Validation schema for creating a new product
 */
export const createProductSchema = Joi.object({
    name: Joi.string().required().trim().messages({
        'string.empty': 'Tên sản phẩm không được để trống',
        'any.required': 'Tên sản phẩm là bắt buộc'
    }),
    slug: Joi.string().trim(), // Slug sẽ được tạo tự động nếu không được cung cấp
    description: Joi.string().allow('', null),
    price: Joi.number().required().min(0).messages({
        'number.base': 'Giá phải là một số',
        'number.min': 'Giá không thể âm',
        'any.required': 'Giá sản phẩm là bắt buộc'
    }),
    salePrice: Joi.number().min(0).allow(null).default(null).messages({
        'number.base': 'Giá khuyến mãi phải là một số',
        'number.min': 'Giá khuyến mãi không thể âm'
    }),
    sku: Joi.string().allow('', null).trim(),
    stockQuantity: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Số lượng tồn kho phải là một số',
        'number.integer': 'Số lượng tồn kho phải là số nguyên',
        'number.min': 'Số lượng tồn kho không thể âm'
    }),
    brandId: Joi.string().allow('', null), // Để trống nếu không có brandId
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    material: Joi.string().allow('', null).trim(),
    images: Joi.array().items(imageSchema).default([]),
    origin: Joi.string().allow('', null).trim(),
    warrantyInfo: Joi.string().allow('', null).trim(),
    categories: Joi.array().items(Joi.string()).default([])
});

/**
 * Validation schema for updating a product
 */
export const updateProductSchema = Joi.object({
    name: Joi.string().trim().messages({
        'string.empty': 'Tên sản phẩm không được để trống'
    }),
    slug: Joi.string().trim(),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).messages({
        'number.base': 'Giá phải là một số',
        'number.min': 'Giá không thể âm'
    }),
    salePrice: Joi.number().min(0).allow(null).default(null).messages({
        'number.base': 'Giá khuyến mãi phải là một số',
        'number.min': 'Giá khuyến mãi không thể âm'
    }),
    sku: Joi.string().allow('', null).trim(),
    stockQuantity: Joi.number().integer().min(0).messages({
        'number.base': 'Số lượng tồn kho phải là một số',
        'number.integer': 'Số lượng tồn kho phải là số nguyên',
        'number.min': 'Số lượng tồn kho không thể âm'
    }),
    brandId: Joi.string().allow('', null),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    material: Joi.string().allow('', null).trim(),
    images: Joi.array().items(imageSchema),
    origin: Joi.string().allow('', null).trim(),
    warrantyInfo: Joi.string().allow('', null).trim(),
    categories: Joi.array().items(Joi.string())
}).min(1); // Yêu cầu ít nhất 1 trường được cập nhật

/**
 * Validation schema for query parameters
 */
export const productQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Trang phải là một số',
        'number.integer': 'Trang phải là số nguyên',
        'number.min': 'Trang phải lớn hơn hoặc bằng 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Giới hạn phải là một số',
        'number.integer': 'Giới hạn phải là số nguyên',
        'number.min': 'Giới hạn phải lớn hơn hoặc bằng 1',
        'number.max': 'Giới hạn không được vượt quá 100'
    }),
    sortBy: Joi.string().valid('createdAt', 'price', 'name', 'stockQuantity').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0).greater(Joi.ref('minPrice')).messages({
        'number.greater': 'Giá tối đa phải lớn hơn giá tối thiểu'
    }),
    brandId: Joi.string(),
    categoryId: Joi.string(),
    isActive: Joi.boolean().default(true),
    q: Joi.string(),
    search: Joi.string()
});
