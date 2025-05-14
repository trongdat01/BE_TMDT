import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../configs/enviroments.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import { sendEmail } from '../utils/sendMail.js';

// Đăng ký người dùng mới
export const register = handleAsync(async (req, res, next) => {
    const { username, email, password, fullName, phoneNumber } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return next(createError(400, 'Email đã được sử dụng'));
    }

    // Kiểm tra xem username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return next(createError(400, 'Tên đăng nhập đã được sử dụng'));
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = new User({
        username,
        email,
        passwordHash: hashedPassword,
        fullName,
        phoneNumber,
        role: 'customer',
        isActive: true,
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await newUser.save();

    // Tạo JWT token
    const accessToken = jwt.sign(
        { id: newUser._id, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '1d' } // access token hết hạn sau 1 ngày
    );

    const refreshToken = jwt.sign(
        { id: newUser._id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // refresh token hết hạn sau 7 ngày
    );    // Gửi email xác thực (nếu cần)
    // Tạo nội dung email
    const emailSubject = 'Xác nhận đăng ký tài khoản';
    const emailText = `
    Xin chào ${newUser.fullName},

    Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.
    Tài khoản của bạn đã được tạo thành công!

    Thông tin tài khoản:
    - Tên đăng nhập: ${newUser.username}
    - Email: ${newUser.email}

    Trân trọng,
    Đội ngũ hỗ trợ
    `;

    // Bỏ comment dòng dưới đây khi bạn muốn kích hoạt tính năng gửi email
    // await sendEmail(newUser.email, emailSubject, emailText);

    // Trả về thông tin người dùng và token
    res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role
        },
        accessToken,
        refreshToken
    });
});

// Đăng nhập
export const login = handleAsync(async (req, res, next) => {
    const { identifier, password } = req.body;

    // Tìm kiếm user theo email hoặc username
    const user = await User.findByCredentials(identifier);

    // Nếu không tìm thấy user
    if (!user) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Kiểm tra xem tài khoản có bị vô hiệu hóa không
    if (!user.isActive) {
        return next(createError(401, 'Tài khoản đã bị vô hiệu hóa'));
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Tạo access token và refresh token
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    // Trả về thông tin người dùng và token
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

// Làm mới access token bằng refresh token
export const refreshToken = handleAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(createError(400, 'Refresh token không được cung cấp'));
    }

    try {
        // Xác thực refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Tìm kiếm user theo ID trong token
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(createError(401, 'Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu hóa'));
        }

        // Tạo access token mới
        const newAccessToken = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Trả về access token mới
        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        return next(createError(401, 'Refresh token không hợp lệ hoặc đã hết hạn'));
    }
});

// Lấy thông tin người dùng hiện tại
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

// Đổi mật khẩu
export const changePassword = handleAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Tìm kiếm user theo ID
    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Mật khẩu hiện tại không đúng'));
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.passwordHash = hashedPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
    });
});

// Quên mật khẩu
export const forgotPassword = handleAsync(async (req, res, next) => {
    const { email } = req.body;

    // Tìm kiếm user theo email
    const user = await User.findOne({ email });
    if (!user) {
        // Vì lý do bảo mật, vẫn trả về success ngay cả khi không tìm thấy email
        return res.status(200).json({
            success: true,
            message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu'
        });
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: '15m' } // Token hết hạn sau 15 phút
    );

    // URL đặt lại mật khẩu (frontend)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;    // Gửi email đặt lại mật khẩu
    try {
        // Tạo nội dung email đặt lại mật khẩu
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

        // Uncomment dòng dưới đây khi bạn muốn kích hoạt tính năng gửi email
        // await sendEmail(user.email, emailSubject, emailText);

        console.log('Reset password URL:', resetUrl);

        res.status(200).json({
            success: true,
            message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn',
            // Chỉ trả về token trong môi trường dev
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
    } catch (error) {
        console.error('Error sending reset password email:', error);

        return next(createError(500, 'Không thể gửi email đặt lại mật khẩu'));
    }
});

// Đặt lại mật khẩu
export const resetPassword = handleAsync(async (req, res, next) => {
    const { token, newPassword } = req.body;

    try {
        // Xác thực token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Tìm kiếm user theo ID trong token
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(createError(404, 'Token không hợp lệ hoặc đã hết hạn'));
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu
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
