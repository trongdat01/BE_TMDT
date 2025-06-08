// Validation schema cho Brand API
import Joi from 'joi';

// Schema validation cho việc tạo Brand mới
export const createBrandSchema = Joi.object({
    name: Joi.string().required().trim().min(2).max(100)
        .messages({
            'string.base': 'Tên thương hiệu phải là chuỗi',
            'string.empty': 'Tên thương hiệu không được để trống',
            'string.min': 'Tên thương hiệu phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên thương hiệu không được vượt quá {#limit} ký tự',
            'any.required': 'Tên thương hiệu là trường bắt buộc'
        }),
    logoUrl: Joi.string().trim().allow('', null)
        .messages({
            'string.base': 'URL logo phải là chuỗi'
        }),
    description: Joi.string().trim().allow('', null)
        .messages({
            'string.base': 'Mô tả phải là chuỗi'
        }),
    isDomestic: Joi.boolean().default(true)
        .messages({
            'boolean.base': 'Trường isDomestic phải là boolean'
        })
});

// Schema validation cho việc cập nhật Brand
export const updateBrandSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100)
        .messages({
            'string.base': 'Tên thương hiệu phải là chuỗi',
            'string.empty': 'Tên thương hiệu không được để trống',
            'string.min': 'Tên thương hiệu phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên thương hiệu không được vượt quá {#limit} ký tự'
        }),
    logoUrl: Joi.string().trim().allow('', null)
        .messages({
            'string.base': 'URL logo phải là chuỗi'
        }),
    description: Joi.string().trim().allow('', null)
        .messages({
            'string.base': 'Mô tả phải là chuỗi'
        }),
    isDomestic: Joi.boolean()
        .messages({
            'boolean.base': 'Trường isDomestic phải là boolean'
        })
});

export default {
    createBrandSchema,
    updateBrandSchema
};
