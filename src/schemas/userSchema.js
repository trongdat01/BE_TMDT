import Joi from 'joi';

// Schema để tạo người dùng mới (do admin hoặc nhân viên tạo)
export const createUserSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .trim()
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
            'string.empty': 'Tên đăng nhập không được để trống',
            'string.min': 'Tên đăng nhập phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên đăng nhập không được quá {#limit} ký tự',
            'string.pattern.base': 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
            'any.required': 'Tên đăng nhập là bắt buộc'
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } }) // không bắt buộc phải có đuôi .com, .vn,...
        .required()
        .trim()
        .messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .min(6)
        .max(30)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/)
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
            'string.max': 'Mật khẩu không được quá {#limit} ký tự',
            'string.pattern.base': 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
            'any.required': 'Mật khẩu là bắt buộc'
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
        .pattern(/^(0|\+84)[0-9]{9,10}$/) // Hỗ trợ định dạng Việt Nam
        .allow('') // cho phép không có số điện thoại
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-10 số)'
        }),

    role: Joi.string()
        .valid('customer', 'admin', 'staff') // chỉ cho phép một trong các giá trị này
        .default('customer'),

    isActive: Joi.boolean().default(true) // người dùng mặc định là đang hoạt động
});

// Schema cập nhật thông tin người dùng
export const updateUserSchema = Joi.object({
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
    phone: Joi.string()
        .pattern(/^(0|\+84)[0-9]{9,10}$/)
        .required()
        .messages({
            'string.empty': 'Số điện thoại không được để trống',
            'string.pattern.base': 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-10 số)',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
    province: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tỉnh/Thành phố không được để trống',
            'any.required': 'Tỉnh/Thành phố là bắt buộc'
        }),
    district: Joi.string()
        .required()
        .messages({
            'string.empty': 'Quận/Huyện không được để trống',
            'any.required': 'Quận/Huyện là bắt buộc'
        }),
    ward: Joi.string()
        .required()
        .messages({
            'string.empty': 'Phường/Xã không được để trống',
            'any.required': 'Phường/Xã là bắt buộc'
        }),
    street: Joi.string()
        .required()
        .messages({
            'string.empty': 'Địa chỉ chi tiết không được để trống',
            'any.required': 'Địa chỉ chi tiết là bắt buộc'
        }),
    isDefault: Joi.boolean().optional()
});

// Schema địa chỉ người dùng
export const addressSchema = Joi.object({
    receiverName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim()
        .messages({
            'string.empty': 'Tên người nhận không được để trống',
            'string.min': 'Tên người nhận phải có ít nhất {#limit} ký tự',
            'string.max': 'Tên người nhận không được quá {#limit} ký tự',
            'any.required': 'Tên người nhận là bắt buộc'
        }),
    phone: Joi.string()
        .pattern(/^(0|\+84)[0-9]{9,10}$/)
        .required()
        .messages({
            'string.empty': 'Số điện thoại không được để trống',
            'string.pattern.base': 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-10 số)',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
    province: Joi.string()
        .required()
        .messages({
            'string.empty': 'Tỉnh/Thành phố không được để trống',
            'any.required': 'Tỉnh/Thành phố là bắt buộc'
        }),
    district: Joi.string()
        .required()
        .messages({
            'string.empty': 'Quận/Huyện không được để trống',
            'any.required': 'Quận/Huyện là bắt buộc'
        }),
    ward: Joi.string()
        .required()
        .messages({
            'string.empty': 'Phường/Xã không được để trống',
            'any.required': 'Phường/Xã là bắt buộc'
        }),
    street: Joi.string()
        .required()
        .messages({
            'string.empty': 'Địa chỉ chi tiết không được để trống',
            'any.required': 'Địa chỉ chi tiết là bắt buộc'
        }),
    isDefault: Joi.boolean().optional()
});

// Schema cho thao tác xóa nhiều người dùng
export const bulkDeleteUsersSchema = Joi.object({
    userIds: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
        .messages({
            'array.base': 'Danh sách người dùng phải là một mảng',
            'array.min': 'Phải chọn ít nhất một người dùng để xóa',
            'any.required': 'Danh sách người dùng là bắt buộc',
            'string.pattern.base': 'ID người dùng không hợp lệ'
        })
});
