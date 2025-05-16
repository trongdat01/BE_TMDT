import jwt from 'jsonwebtoken';
import createError from '../utils/createError.js';
import { JWT_SECRET } from '../configs/enviroments.js';

// Middleware để xác thực token JWT
export const verifyToken = (req, res, next) => {
    // Lấy token từ header Authorization (định dạng: Bearer <token>)
    const token = req.headers['authorization']?.split(' ')[1];

    // Nếu không có token thì trả lỗi 401 - Chưa đăng nhập
    if (!token) {
        return next(createError(401, 'Cần có access token'));
    }

    // Xác thực token với secret key
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token không hợp lệ
            return next(createError(403, 'Token không hợp lệ'));
        }

        // Gán thông tin người dùng vào req để dùng ở các middleware sau
        req.user = user;
        next();
    });
};

// Middleware để kiểm tra quyền truy cập dựa vào vai trò (role)
export const checkRole = (...roles) => {
    return (req, res, next) => {
        // Nếu chưa đăng nhập hoặc role không thuộc danh sách cho phép
        if (!req.user || !roles.includes(req.user.role)) {
            return next(createError(403, 'Bạn không có quyền thực hiện hành động này'));
        }
        next();
    };
};
