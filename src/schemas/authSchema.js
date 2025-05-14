import Joi from 'joi';

// Schema cho đăng ký người dùng
export const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .trim()
        .lowercase()
        .pattern(new RegExp('^[a-zA-Z0-9_]+$'))
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống',
            'string.min': 'Tên đăng nhập phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên đăng nhập không được quá {#limit} ký tự',
            'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
            'any.required': 'Tên đăng nhập là bắt buộc'
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$'))
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
            'string.max': 'Mật khẩu không được quá {#limit} ký tự',
            'string.pattern.base': 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'string.empty': 'Xác nhận mật khẩu không được để trống',
            'any.only': 'Xác nhận mật khẩu không khớp',
            'any.required': 'Xác nhận mật khẩu là bắt buộc'
        }),

    fullName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim()
        .messages({
            'string.empty': 'Họ tên không được để trống',
            'string.min': 'Họ tên phải có ít nhất {#limit} ký tự',
            'string.max': 'Họ tên không được quá {#limit} ký tự',
            'any.required': 'Họ tên là bắt buộc'
        }),

    phoneNumber: Joi.string()
        .pattern(new RegExp('^(0|\\+84)[0-9]{9,10}$'))
        .allow('')
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-10 số)'
        })
});

// Schema cho đăng nhập
export const loginSchema = Joi.object({
    identifier: Joi.string()
        .required()
        .trim()
        .messages({
            'string.empty': 'Email hoặc tên đăng nhập không được để trống',
            'any.required': 'Email hoặc tên đăng nhập là bắt buộc'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

// Schema cho đổi mật khẩu
export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu hiện tại không được để trống',
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),

    newPassword: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$'))
        .messages({
            'string.empty': 'Mật khẩu mới không được để trống',
            'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
            'string.max': 'Mật khẩu mới không được quá {#limit} ký tự',
            'string.pattern.base': 'Mật khẩu mới phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
            'any.required': 'Mật khẩu mới là bắt buộc'
        }),

    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'string.empty': 'Xác nhận mật khẩu mới không được để trống',
            'any.only': 'Xác nhận mật khẩu mới không khớp',
            'any.required': 'Xác nhận mật khẩu mới là bắt buộc'
        })
});

// Schema cho quên mật khẩu
export const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        })
});

// Schema cho đặt lại mật khẩu
export const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'string.empty': 'Token không được để trống',
            'any.required': 'Token là bắt buộc'
        }),

    newPassword: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$'))
        .messages({
            'string.empty': 'Mật khẩu mới không được để trống',
            'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
            'string.max': 'Mật khẩu mới không được quá {#limit} ký tự',
            'string.pattern.base': 'Mật khẩu mới phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
            'any.required': 'Mật khẩu mới là bắt buộc'
        }),

    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'string.empty': 'Xác nhận mật khẩu mới không được để trống',
            'any.only': 'Xác nhận mật khẩu mới không khớp',
            'any.required': 'Xác nhận mật khẩu mới là bắt buộc'
        })
});
