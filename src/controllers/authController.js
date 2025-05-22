import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../configs/enviroments.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import { sendEmail } from '../utils/sendMail.js';

function generateToken({ payload, secret, options }) {
    return jwt.sign(payload, secret, options);
}

export const register = handleAsync(async (req, res, next) => {
    const { username, email, password, fullName, phoneNumber } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return next(createError(400, 'Email đã được sử dụng'));
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return next(createError(400, 'Tên đăng nhập đã được sử dụng'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        username,
        email,
        passwordHash: hashedPassword,
        fullName,
        phoneNumber,
        role: 'customer',
        isActive: true,
    });

    await newUser.save();

    req.data = {
        message: 'Đăng ký thành công',
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            phoneNumber: newUser.phoneNumber,
            role: newUser.role
        }
    };
    res.status(201);
    return next();
});

export const login = handleAsync(async (req, res, next) => {
    const { identifier, password } = req.body;

    const user = await User.findByCredentials(identifier);

    if (!user) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    if (!user.isActive) {
        return next(createError(401, 'Tài khoản đã bị vô hiệu hóa'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    const accessToken = generateToken({
        payload: { id: user._id, role: user.role },
        secret: JWT_SECRET,
        options: { expiresIn: '1d' }
    });

    const refreshToken = generateToken({
        payload: { id: user._id },
        secret: JWT_REFRESH_SECRET,
        options: { expiresIn: '7d' }
    });

    res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        },
        accessToken,
        refreshToken
    });
});

export const refreshToken = handleAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(createError(400, 'Refresh token không được cung cấp'));
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(createError(401, 'Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu hóa'));
        }

        const newAccessToken = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        return next(createError(401, 'Refresh token không hợp lệ hoặc đã hết hạn'));
    }
});

export const getCurrentUser = handleAsync(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    res.status(200).json({
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            addresses: user.addresses
        }
    });
});

export const changePassword = handleAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Mật khẩu hiện tại không đúng'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.passwordHash = hashedPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
    });
});

export const forgotPassword = handleAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu'
        });
    }

    const resetToken = jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: '15m' }
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
        const emailSubject = 'Đặt lại mật khẩu';
        const emailText = `
        Xin chào ${user.fullName},

        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        Vui lòng truy cập vào đường dẫn sau để đặt lại mật khẩu:
        ${resetUrl}

        Lưu ý: Đường dẫn này sẽ hết hạn sau 15 phút.
        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

        Trân trọng,
        Đội ngũ hỗ trợ
        `;

        console.log('Reset password URL:', resetUrl);

        res.status(200).json({
            success: true,
            message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn',
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
    } catch (error) {
        console.error('Error sending reset password email:', error);

        return next(createError(500, 'Không thể gửi email đặt lại mật khẩu'));
    }
});

export const resetPassword = handleAsync(async (req, res, next) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(createError(404, 'Token không hợp lệ hoặc đã hết hạn'));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.passwordHash = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công'
        });
    } catch (error) {
        return next(createError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
});

export default {
    register,
    login,
    refreshToken,
    getCurrentUser,
    changePassword,
    forgotPassword,
    resetPassword
};
