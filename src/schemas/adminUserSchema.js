import Joi from 'joi';

// Schema cho việc tạo tài khoản Admin/Staff mới
export const createAdminUserSchema = Joi.object({
    username: Joi.string()
        .required()
        .min(3)
        .max(50)
        .trim()
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
            'string.base': 'Username phải là chuỗi',
            'string.empty': 'Username không được để trống',
            'string.min': 'Username phải có ít nhất {#limit} ký tự',
            'string.max': 'Username không được vượt quá {#limit} ký tự',
            'string.pattern.base': 'Username chỉ được chứa chữ cái, số và dấu gạch dưới',
            'any.required': 'Username là bắt buộc'
        }),

    email: Joi.string()
        .required()
        .email()
        .trim()
        .lowercase()
        .messages({
            'string.base': 'Email phải là chuỗi',
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .required()
        .min(6)
        .max(100)
        .messages({
            'string.base': 'Mật khẩu phải là chuỗi',
            'string.empty': 'Mật khẩu không được để trống',
            'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
            'string.max': 'Mật khẩu không được vượt quá {#limit} ký tự',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    fullName: Joi.string()
        .required()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.base': 'Họ tên phải là chuỗi',
            'string.empty': 'Họ tên không được để trống',
            'string.min': 'Họ tên phải có ít nhất {#limit} ký tự',
            'string.max': 'Họ tên không được vượt quá {#limit} ký tự',
            'any.required': 'Họ tên là bắt buộc'
        }),

    phoneNumber: Joi.string()
        .min(10)
        .max(15)
        .trim()
        .pattern(/^[0-9+]+$/)
        .messages({
            'string.base': 'Số điện thoại phải là chuỗi',
            'string.min': 'Số điện thoại phải có ít nhất {#limit} ký tự',
            'string.max': 'Số điện thoại không được vượt quá {#limit} ký tự',
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        }),

    role: Joi.string()
        .required()
        .valid('admin', 'staff')
        .messages({
            'string.base': 'Vai trò phải là chuỗi',
            'string.empty': 'Vai trò không được để trống',
            'any.only': 'Vai trò phải là "admin" hoặc "staff"',
            'any.required': 'Vai trò là bắt buộc'
        })
});
