import createError from '../utils/createError.js';

/**
 * Middleware to check if user has required permission/role
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const checkPermission = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // req.user should be set by the verifyToken middleware
            const { role } = req.user;

            if (!role || !allowedRoles.includes(role)) {
                return next(
                    createError(403, 'Bạn không có quyền thực hiện hành động này')
                );
            }

            next();
        } catch (error) {
            next(createError(500, error.message || 'Lỗi khi kiểm tra quyền truy cập'));
        }
    };
};
