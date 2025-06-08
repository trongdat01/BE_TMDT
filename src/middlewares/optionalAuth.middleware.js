import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/enviroments.js';

// Middleware cho phép truy cập cả khi chưa đăng nhập (nếu có token thì gán req.user, không có thì bỏ qua)
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err && user) {
                req.user = user;
            }
            // Dù có lỗi vẫn next, chỉ không gán req.user
            next();
        });
    } else {
        next();
    }
};
