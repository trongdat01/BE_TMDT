import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
import { JWT_SECRET } from "../configs/enviroments.js";

// Middleware xác thực token
export const verifyToken = (req, res, next) => {
	// Token có thể được gửi qua cookie hoặc header
	const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

	if (!token) {
		return next(createError(401, "Bạn cần phải đăng nhập"));
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return next(createError(403, "Forbidden - Token không hợp lệ"));
	}
};

// Middleware kiểm tra token admin
export const verifyAdminToken = (req, res, next) => {
	// Token có thể được gửi qua cookie hoặc header
	const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

	if (!token) {
		return next(createError(401, "Bạn cần phải đăng nhập"));
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);

		// Kiểm tra token có type=admin không
		if (!decoded.type || decoded.type !== 'admin') {
			return next(createError(403, "Không có quyền truy cập - Token không phải loại Admin"));
		}

		req.user = decoded;
		next();
	} catch (error) {
		return next(createError(403, "Forbidden - Token không hợp lệ"));
	}
};

// Middleware kiểm tra quyền admin
export const verifyAdmin = (req, res, next) => {
	verifyToken(req, res, () => {
		if (req.user.role === "admin") {
			next();
		} else {
			return next(createError(403, "Bạn không có quyền thực hiện hành động này"));
		}
	});
};

// Middleware kiểm tra quyền admin với token admin
export const verifyAdminWithToken = (req, res, next) => {
	verifyAdminToken(req, res, () => {
		if (req.user.role === "admin") {
			next();
		} else {
			return next(createError(403, "Bạn không có quyền thực hiện hành động này"));
		}
	});
};

// Middleware kiểm tra quyền staff hoặc admin
export const verifyStaff = (req, res, next) => {
	verifyToken(req, res, () => {
		if (req.user.role === "admin" || req.user.role === "staff") {
			next();
		} else {
			return next(createError(403, "Bạn không có quyền thực hiện hành động này"));
		}
	});
};

// Middleware kiểm tra quyền staff hoặc admin với token admin
export const verifyStaffWithToken = (req, res, next) => {
	verifyAdminToken(req, res, () => {
		if (req.user.role === "admin" || req.user.role === "staff") {
			next();
		} else {
			return next(createError(403, "Bạn không có quyền thực hiện hành động này"));
		}
	});
};

export default { verifyToken, verifyAdminToken, verifyAdmin, verifyAdminWithToken, verifyStaff, verifyStaffWithToken };
