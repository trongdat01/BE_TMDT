import Joi from 'joi';

// Schema cho việc tạo danh mục
export const createCategorySchema = Joi.object({
    name: Joi.string()
        .required()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Tên danh mục không được để trống',
            'string.min': 'Tên danh mục phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên danh mục không được quá {#limit} ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),

    description: Joi.string()
        .allow('')
        .max(500)
        .trim()
        .messages({
            'string.max': 'Mô tả không được quá {#limit} ký tự'
        }),

    parentId: Joi.string()
        .allow(null, '')
        .messages({
            'string.base': 'ID danh mục cha không hợp lệ'
        }),

    imageUrl: Joi.string()
        .allow('')
        .uri()
        .trim()
        .messages({
            'string.uri': 'URL hình ảnh không hợp lệ'
        }),

    isActive: Joi.boolean()
        .default(true),

    displayOrder: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'Thứ tự hiển thị phải là số',
            'number.integer': 'Thứ tự hiển thị phải là số nguyên',
            'number.min': 'Thứ tự hiển thị không được nhỏ hơn {#limit}'
        })
});

// Schema cho việc cập nhật danh mục
export const updateCategorySchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Tên danh mục không được để trống',
            'string.min': 'Tên danh mục phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên danh mục không được quá {#limit} ký tự'
        }),

    description: Joi.string()
        .allow('')
        .max(500)
        .trim()
        .messages({
            'string.max': 'Mô tả không được quá {#limit} ký tự'
        }),

    parentId: Joi.string()
        .allow(null, '')
        .messages({
            'string.base': 'ID danh mục cha không hợp lệ'
        }),

    imageUrl: Joi.string()
        .allow('')
        .uri()
        .trim()
        .messages({
            'string.uri': 'URL hình ảnh không hợp lệ'
        }),

    isActive: Joi.boolean(),

    displayOrder: Joi.number()
        .integer()
        .min(0)
        .messages({
            'number.base': 'Thứ tự hiển thị phải là số',
            'number.integer': 'Thứ tự hiển thị phải là số nguyên',
            'number.min': 'Thứ tự hiển thị không được nhỏ hơn {#limit}'
        })
});
