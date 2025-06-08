import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../configs/enviroments.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import { sendEmail } from '../utils/sendMail.js';
import { isSuperAdmin } from '../utils/checkSuperAdmin.js';

// ===== ADMIN AUTHENTICATION FUNCTIONS =====

// Admin login - Chỉ dành cho admin và staff
export const adminLogin = handleAsync(async (req, res, next) => {
    const { identifier, password } = req.body;

    // Tìm user theo email hoặc username
    const user = await User.findByCredentials(identifier);

    if (!user) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Kiểm tra role - chỉ admin và staff được phép
    if (user.role !== 'admin' && user.role !== 'staff') {
        return next(createError(403, 'Bạn không có quyền truy cập vào trang quản trị'));
    }

    // Kiểm tra tài khoản có bị vô hiệu hóa không
    if (!user.isActive) {
        return next(createError(401, 'Tài khoản đã bị vô hiệu hóa'));
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Tạo token với type: 'admin'
    const accessToken = generateToken({
        payload: {
            id: user._id,
            role: user.role,
            type: 'admin'  // Đánh dấu đây là token admin
        },
        secret: JWT_SECRET,
        options: { expiresIn: '8h' }  // Admin token có thời gian ngắn hơn
    });

    const refreshToken = generateToken({
        payload: {
            id: user._id,
            type: 'admin'
        },
        secret: JWT_REFRESH_SECRET,
        options: { expiresIn: '3d' }  // Admin refresh token ngắn hơn
    });

    // Kiểm tra Super Admin
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && user._id.toString() === firstAdmin._id.toString();

    return res.success({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isSuperAdmin
        },
        accessToken,
        refreshToken
    }, `Đăng nhập ${user.role === 'admin' ? 'Admin' : 'Staff'} thành công`);
});

// Admin refresh token
export const adminRefreshToken = handleAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(createError(400, 'Refresh token không được cung cấp'));
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Kiểm tra type trong token
        if (!decoded.type || decoded.type !== 'admin') {
            return next(createError(401, 'Token không hợp lệ cho trang quản trị'));
        }

        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(createError(401, 'Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu hóa'));
        }

        // Kiểm tra role
        if (user.role !== 'admin' && user.role !== 'staff') {
            return next(createError(403, 'Bạn không có quyền truy cập vào trang quản trị'));
        }

        // Tạo token mới
        const accessToken = generateToken({
            payload: {
                id: user._id,
                role: user.role,
                type: 'admin'
            },
            secret: JWT_SECRET,
            options: { expiresIn: '8h' }
        });

        return res.success({
            accessToken
        });
    } catch (error) {
        return next(createError(401, 'Refresh token không hợp lệ hoặc đã hết hạn'));
    }
});

// Lấy thông tin admin hiện tại
export const adminGetMe = handleAsync(async (req, res, next) => {
    const userId = req.user.id;

    // Kiểm tra token đã được xác nhận bởi verifyAdminToken middleware
    // Không cần kiểm tra type ở đây nữa

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    // Kiểm tra role
    if (user.role !== 'admin' && user.role !== 'staff') {
        return next(createError(403, 'Bạn không có quyền truy cập thông tin này'));
    }

    // Kiểm tra Super Admin
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && user._id.toString() === firstAdmin._id.toString();

    return res.success({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isSuperAdmin
        }
    });
});

// Function kiểm tra người dùng hiện tại có phải Super Admin không
export const checkIsSuperAdmin = handleAsync(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    // Kiểm tra role
    if (user.role !== 'admin') {
        return next(createError(403, 'Chỉ Admin mới có quyền truy cập'));
    }

    // Sử dụng hàm tiện ích để kiểm tra Super Admin
    const superAdminCheck = await isSuperAdmin(userId);
    if (!superAdminCheck) {
        return next(createError(403, 'Chỉ Super Admin mới có quyền truy cập'));
    }

    return res.success({
        isSuperAdmin: true
    }, 'Xác thực Super Admin thành công');
});

// ===== USER AUTHENTICATION FUNCTIONS =====

function generateToken({ payload, secret, options }) {
    return jwt.sign(payload, secret, options);
}

const checkExistingUser = async (email, username) => {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return { error: createError(400, 'Email đã được sử dụng') };
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return { error: createError(400, 'Tên đăng nhập đã được sử dụng') };
    }

    return { success: true };
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const getAdminUsers = handleAsync(async (req, res, next) => {
    const { role } = req.query;
    const filter = {};
    if (role === 'admin' || role === 'staff') {
        filter.role = role;
    } else {
        filter.role = { $in: ['admin', 'staff'] };
    }
    const adminUsers = await User.find(filter).select('-passwordHash');
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const response = adminUsers.map(user => {
        const userObj = user.toObject();
        if (firstAdmin && user._id.toString() === firstAdmin._id.toString()) {
            userObj.isSuperAdmin = true;
        }
        return userObj;
    });

    return res.success({
        count: response.length,
        data: response
    });
});

export const createAdminUser = handleAsync(async (req, res, next) => {
    const { username, email, password, fullName, phoneNumber, role } = req.body;
    const currentUserId = req.user.id;

    // Kiểm tra role hợp lệ
    if (role !== 'admin' && role !== 'staff') {
        return next(createError(400, 'Vai trò không hợp lệ, chỉ được phép tạo tài khoản Admin hoặc Staff'));
    }

    // Kiểm tra xem người dùng hiện tại có phải là Super Admin không
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && firstAdmin._id.toString() === currentUserId;

    // Kiểm tra quyền hạn dựa trên role của người dùng mới
    if (role === 'admin') {
        // Chỉ SuperAdmin mới được tạo tài khoản Admin
        if (!isSuperAdmin) {
            return next(createError(403, 'Chỉ Super Admin mới có quyền tạo tài khoản Admin mới'));
        }
    } else if (role === 'staff') {
        // Cả Admin thường và Super Admin đều có thể tạo Staff
        // Không cần kiểm tra thêm, vì đã xác thực quyền admin qua middleware verifyAdminWithToken
    }

    // Kiểm tra trùng email hoặc username
    const checkResult = await checkExistingUser(email, username);
    if (checkResult.error) {
        return next(checkResult.error);
    }

    // Hash mật khẩu và tạo người dùng mới
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
        username,
        email,
        passwordHash: hashedPassword,
        fullName,
        phoneNumber,
        role,
        isActive: true
    });

    await newUser.save();

    // Trả về thông tin người dùng vừa tạo (không bao gồm mật khẩu)
    return res.success({
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role
        }
    }, `Tạo tài khoản ${role === 'admin' ? 'Admin' : 'Staff'} thành công`, 201);
});

export const deleteAdminUser = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const adminId = req.user.id;

    if (userId === adminId) {
        return next(createError(400, 'Bạn không thể xóa tài khoản của chính mình'));
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (userToDelete.role !== 'admin' && userToDelete.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để xóa tài khoản Admin hoặc Staff'));
    }

    // Kiểm tra user hiện tại có phải là Super Admin không
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && firstAdmin._id.toString() === adminId;

    // Kiểm tra quyền hạn theo role
    if (userToDelete.role === 'admin') {
        // Kiểm tra số lượng admin (không thể xóa admin duy nhất)
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return next(createError(400, 'Không thể xóa Admin duy nhất trong hệ thống'));
        }

        // Chỉ Super Admin mới có quyền xóa tài khoản Admin khác
        if (!isSuperAdmin) {
            return next(createError(403, 'Chỉ Super Admin mới có quyền xóa tài khoản Admin'));
        }
    } else if (userToDelete.role === 'staff') {
        // Admin thường và Super Admin đều có quyền xóa Staff
        // Không cần kiểm tra thêm, vì đã xác thực quyền admin qua middleware verifyAdminWithToken
    }

    await User.findByIdAndDelete(userId);

    return res.success({}, `Đã xóa tài khoản ${userToDelete.role === 'admin' ? 'Admin' : 'Staff'} thành công`);
});

export const register = handleAsync(async (req, res, next) => {
    const { username, email, password, fullName, phoneNumber } = req.body;

    const checkResult = await checkExistingUser(email, username);
    if (checkResult.error) {
        return next(checkResult.error);
    }

    const hashedPassword = await hashPassword(password);

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

    // Kiểm tra xem yêu cầu có đến từ route admin không
    const isAdminRoute = req.isAdminRoute === true;

    const user = await User.findByCredentials(identifier);

    if (!user) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    if (!user.isActive) {
        return next(createError(401, 'Tài khoản đã bị vô hiệu hóa'));
    }

    // Phân biệt đăng nhập admin và user
    if (isAdminRoute) {
        // Chỉ cho phép admin và staff đăng nhập qua route admin
        if (user.role !== 'admin' && user.role !== 'staff') {
            return next(createError(403, 'Bạn không có quyền truy cập vào trang quản trị'));
        }
    } else {
        // Chỉ cho phép customer đăng nhập qua route user
        if (user.role !== 'customer') {
            return next(createError(403, 'Vui lòng sử dụng trang đăng nhập dành cho quản trị viên'));
        }
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return next(createError(401, 'Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Tạo token khác nhau cho admin và user
    const accessToken = generateToken({
        payload: {
            id: user._id,
            role: user.role,
            ...(isAdminRoute ? { type: 'admin' } : {})  // Thêm type='admin' cho admin routes
        },
        secret: JWT_SECRET,
        options: { expiresIn: isAdminRoute ? '8h' : '1d' }  // Token ngắn hơn cho admin
    });

    const refreshToken = generateToken({
        payload: {
            id: user._id,
            ...(isAdminRoute ? { type: 'admin' } : {})
        },
        secret: JWT_REFRESH_SECRET,
        options: { expiresIn: isAdminRoute ? '3d' : '7d' }  // Refresh token ngắn hơn cho admin
    });

    // Tạo response tùy theo loại người dùng
    const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
    };

    // Nếu là admin route, kiểm tra có phải Super Admin không
    if (isAdminRoute && user.role === 'admin') {
        const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
        if (firstAdmin && user._id.toString() === firstAdmin._id.toString()) {
            userResponse.isSuperAdmin = true;
        }
    }

    return res.success({
        user: userResponse,
        accessToken,
        refreshToken
    }, `Đăng nhập ${isAdminRoute ? (user.role === 'admin' ? 'Admin' : 'Staff') : 'Khách hàng'} thành công`);
});

export const refreshToken = handleAsync(async (req, res, next) => {
    const { refreshToken } = req.body;
    const isAdminRoute = req.isAdminRoute === true;

    if (!refreshToken) {
        return next(createError(400, 'Refresh token không được cung cấp'));
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Kiểm tra phù hợp giữa loại token và route
        if (isAdminRoute && !decoded.type) {
            return next(createError(403, 'Token không hợp lệ cho trang quản trị'));
        }

        if (!isAdminRoute && decoded.type === 'admin') {
            return next(createError(403, 'Token không hợp lệ cho trang người dùng'));
        }

        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return next(createError(401, 'Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu hóa'));
        }

        // Phân biệt đăng nhập admin và user
        if (isAdminRoute) {
            // Chỉ cho phép admin và staff truy cập route admin
            if (user.role !== 'admin' && user.role !== 'staff') {
                return next(createError(403, 'Bạn không có quyền truy cập vào trang quản trị'));
            }
        }

        const newAccessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                ...(isAdminRoute ? { type: 'admin' } : {})
            },
            JWT_SECRET,
            { expiresIn: isAdminRoute ? '8h' : '1d' }
        );

        return res.success({
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

    return res.success({
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

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return res.success({}, 'Đổi mật khẩu thành công');
});

export const forgotPassword = handleAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.success({}, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu');
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
        `; console.log('Reset password URL:', resetUrl);

        return res.success(
            process.env.NODE_ENV === 'development' ? { resetToken } : {},
            'Link đặt lại mật khẩu đã được gửi đến email của bạn'
        );
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

        user.passwordHash = await hashPassword(newPassword);
        await user.save();

        return res.success({}, 'Đặt lại mật khẩu thành công');
    } catch (error) {
        return next(createError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
});

export const getAdminUserById = handleAsync(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'admin' && user.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để lấy thông tin Admin hoặc Staff'));
    }

    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const userObj = user.toObject();

    if (firstAdmin && user._id.toString() === firstAdmin._id.toString()) {
        userObj.isSuperAdmin = true;
    }

    return res.success({
        data: userObj
    });
});

export const updateAdminUser = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { username, email, fullName, phoneNumber } = req.body;
    const currentUserId = req.user.id;

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (userToUpdate.role !== 'admin' && userToUpdate.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để cập nhật thông tin Admin hoặc Staff'));
    }

    // Kiểm tra xem người dùng hiện tại có phải là Super Admin không
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && firstAdmin._id.toString() === currentUserId;

    // Kiểm tra quyền sửa đổi dựa trên role của user cần cập nhật
    if (userToUpdate.role === 'admin' && currentUserId !== userId) {
        // Chỉ Super Admin mới có quyền cập nhật thông tin Admin khác
        if (!isSuperAdmin) {
            return next(createError(403, 'Chỉ Super Admin mới có quyền cập nhật thông tin Admin khác'));
        }
    } else if (userToUpdate.role === 'staff') {
        // Cả Admin thường và Super Admin đều có thể cập nhật Staff
        // Không cần kiểm tra thêm, vì đã xác thực quyền admin qua middleware verifyAdminWithToken
    }

    // Kiểm tra email và username đã tồn tại (nếu có thay đổi)
    if (email && email !== userToUpdate.email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
            return next(createError(400, 'Email đã được sử dụng'));
        }
    }

    if (username && username !== userToUpdate.username) {
        const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUsername) {
            return next(createError(400, 'Tên đăng nhập đã được sử dụng'));
        }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('-passwordHash');

    return res.success({
        data: updatedUser
    }, 'Cập nhật thông tin thành công');
});

export const updateAdminActiveStatus = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { isActive } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
        return next(createError(400, 'Bạn không thể thay đổi trạng thái của chính mình'));
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (userToUpdate.role !== 'admin' && userToUpdate.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để cập nhật trạng thái Admin hoặc Staff'));
    }

    // Kiểm tra xem người dùng hiện tại có phải là Super Admin không
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && firstAdmin._id.toString() === currentUserId;

    // Kiểm tra quyền dựa trên role của user cần cập nhật
    if (userToUpdate.role === 'admin') {
        // Chỉ Super Admin mới có quyền thay đổi trạng thái của Admin khác
        if (!isSuperAdmin) {
            return next(createError(403, 'Chỉ Super Admin mới có quyền thay đổi trạng thái Admin khác'));
        }

        // Không cho phép vô hiệu hóa Super Admin
        if (firstAdmin._id.toString() === userId && !isActive) {
            return next(createError(400, 'Không thể vô hiệu hóa Super Admin'));
        }
    } else if (userToUpdate.role === 'staff') {
        // Cả Admin thường và Super Admin đều có thể cập nhật trạng thái Staff
        // Không cần kiểm tra thêm, vì đã xác thực quyền admin qua middleware verifyAdminWithToken
    }

    userToUpdate.isActive = isActive;
    await userToUpdate.save();

    return res.success(
        {},
        `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản ${userToUpdate.role === 'admin' ? 'Admin' : 'Staff'} thành công`
    );
});

export const updateAdminRole = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { role } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
        return next(createError(400, 'Bạn không thể thay đổi vai trò của chính mình'));
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (userToUpdate.role !== 'admin' && userToUpdate.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để thay đổi vai trò Admin hoặc Staff'));
    }

    // Chỉ Super Admin mới có quyền thay đổi vai trò
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!firstAdmin || firstAdmin._id.toString() !== currentUserId) {
        return next(createError(403, 'Chỉ Super Admin mới có quyền thay đổi vai trò'));
    }

    // Không cho phép thay đổi vai trò của Super Admin
    if (firstAdmin._id.toString() === userId) {
        return next(createError(400, 'Không thể thay đổi vai trò của Super Admin'));
    }

    // Kiểm tra nếu hạ cấp admin xuống staff mà chỉ còn 1 admin
    if (userToUpdate.role === 'admin' && role === 'staff') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 2) { // 1 Super Admin + 1 Admin hiện tại
            return next(createError(400, 'Không thể hạ cấp Admin này vì phải có ít nhất 1 Admin trong hệ thống'));
        }
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    return res.success(
        {},
        `Thay đổi vai trò thành ${role === 'admin' ? 'Admin' : 'Staff'} thành công`
    );
});

export const adminResetPassword = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { newPassword } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
        return next(createError(400, 'Sử dụng API đổi mật khẩu thông thường để thay đổi mật khẩu của chính bạn'));
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (userToUpdate.role !== 'admin' && userToUpdate.role !== 'staff') {
        return next(createError(400, 'API này chỉ dùng để reset mật khẩu Admin hoặc Staff'));
    }

    // Kiểm tra xem người dùng hiện tại có phải là Super Admin không
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    const isSuperAdmin = firstAdmin && firstAdmin._id.toString() === currentUserId;

    // Kiểm tra quyền dựa trên role của user cần cập nhật mật khẩu
    if (userToUpdate.role === 'admin') {
        // Chỉ Super Admin mới có quyền reset mật khẩu Admin khác
        if (!isSuperAdmin) {
            return next(createError(403, 'Chỉ Super Admin mới có quyền reset mật khẩu Admin khác'));
        }
    } else if (userToUpdate.role === 'staff') {
        // Cả Admin thường và Super Admin đều có thể reset mật khẩu Staff
        // Không cần kiểm tra thêm, vì đã xác thực quyền admin qua middleware verifyAdminWithToken
    }

    const hashedPassword = await hashPassword(newPassword);
    userToUpdate.passwordHash = hashedPassword;
    await userToUpdate.save();

    return res.success(
        {},
        `Reset mật khẩu cho ${userToUpdate.role === 'admin' ? 'Admin' : 'Staff'} thành công`
    );
});

export default {
    register,
    login,
    refreshToken,
    getCurrentUser,
    changePassword,
    forgotPassword,
    resetPassword,
    getAdminUsers,
    createAdminUser,
    deleteAdminUser,
    getAdminUserById,
    updateAdminUser,
    updateAdminActiveStatus,
    updateAdminRole,
    adminResetPassword,
    adminLogin,
    adminRefreshToken,
    adminGetMe
};
