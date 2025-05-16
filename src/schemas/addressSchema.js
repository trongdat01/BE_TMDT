import Joi from 'joi';

// Schema cho địa chỉ mới
export const createAddressSchema = Joi.object({
    name: Joi.string()
        .required()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Tên địa chỉ không được để trống',
            'string.min': 'Tên địa chỉ phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên địa chỉ không được quá {#limit} ký tự',
            'any.required': 'Tên địa chỉ là bắt buộc'
        }),

    receiverName: Joi.string()
        .required()
        .min(3)
        .max(100)
        .messages({
            'string.empty': 'Tên người nhận không được để trống',
            'string.min': 'Tên người nhận phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên người nhận không được quá {#limit} ký tự',
            'any.required': 'Tên người nhận là bắt buộc'
        }),

    phone: Joi.string()
        .required()
        .pattern(/^[0-9]{10,11}$/)
        .messages({
            'string.empty': 'Số điện thoại không được để trống',
            'string.pattern.base': 'Số điện thoại không hợp lệ (chỉ bao gồm 10-11 chữ số)',
            'any.required': 'Số điện thoại là bắt buộc'
        }),

    addressLine: Joi.string()
        .required()
        .min(5)
        .max(255)
        .messages({
            'string.empty': 'Địa chỉ đường không được để trống',
            'string.min': 'Địa chỉ đường phải có ít nhất {#limit} ký tự',
            'string.max': 'Địa chỉ đường không được quá {#limit} ký tự',
            'any.required': 'Địa chỉ đường là bắt buộc'
        }),

    ward: Joi.string()
        .required()
        .messages({
            'string.empty': 'Phường/xã không được để trống',
            'any.required': 'Phường/xã là bắt buộc'
        }),

    district: Joi.string()
        .required()
        .messages({
            'string.empty': 'Quận/huyện không được để trống',
            'any.required': 'Quận/huyện là bắt buộc'
        }),

    city: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tỉnh/thành phố không được để trống',
            'any.required': 'Tỉnh/thành phố là bắt buộc'
        }),

    isDefault: Joi.boolean().default(false)
});

// Schema để cập nhật địa chỉ
export const updateAddressSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Tên địa chỉ phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên địa chỉ không được quá {#limit} ký tự'
        }),

    receiverName: Joi.string()
        .min(3)
        .max(100)
        .messages({
            'string.min': 'Tên người nhận phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên người nhận không được quá {#limit} ký tự'
        }),

    phone: Joi.string()
        .pattern(/^[0-9]{10,11}$/)
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (chỉ bao gồm 10-11 chữ số)'
        }),

    addressLine: Joi.string()
        .min(5)
        .max(255)
        .messages({
            'string.min': 'Địa chỉ đường phải có ít nhất {#limit} ký tự',
            'string.max': 'Địa chỉ đường không được quá {#limit} ký tự'
        }),

    ward: Joi.string(),
    district: Joi.string(),
    city: Joi.string(),
    isDefault: Joi.boolean()
});

export default {
    createAddressSchema,
    updateAddressSchema
};
