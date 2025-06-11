import User from '../models/User.js';
import Order from '../models/Order.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import bcrypt from 'bcrypt';
import { isSuperAdmin } from '../utils/checkSuperAdmin.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/enviroments.js';

// Lấy danh sách người dùng (có phân trang, lọc và sắp xếp)
export const getUsers = handleAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        role = '',
        isActive,
        sort = 'createdAt',
        order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Xây dựng bộ lọc
    const filter = { role: 'customer' }; // Chỉ lấy người dùng thường

    // Tìm kiếm
    if (search) {
        filter.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
        ];
    }

    // Lọc theo trạng thái
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    // Thực thi truy vấn
    const sortQuery = {};
    sortQuery[sort] = order === 'asc' ? 1 : -1;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .select('-passwordHash')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortQuery);

    return res.success({
        totalCount: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        users: users
    });
});

// Tìm kiếm người dùng
export const searchUsers = handleAsync(async (req, res, next) => {
    const { query } = req.query;

    if (!query) {
        return next(createError(400, 'Vui lòng cung cấp từ khóa tìm kiếm'));
    }

    const filter = {
        role: 'customer',
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } },
            { phoneNumber: { $regex: query, $options: 'i' } }
        ]
    };

    const users = await User.find(filter)
        .select('-passwordHash')
        .limit(20)
        .sort({ createdAt: -1 });

    return res.success({
        users
    });
});

// Xem chi tiết người dùng
export const getUserById = handleAsync(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'customer') {
        return next(createError(403, 'API này chỉ dùng để xem thông tin người dùng thường'));
    }

    // Có thể thêm thông tin bổ sung như tổng đơn hàng, tổng chi tiêu...
    const orderCount = await Order.countDocuments({ user: userId });
    const totalSpending = await Order.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const userInfo = {
        ...user.toObject(),
        statistics: {
            orderCount,
            totalSpending: totalSpending.length > 0 ? totalSpending[0].total : 0
        }
    };

    return res.success({
        user: userInfo
    });
});

// Tạo tài khoản người dùng mới
export const createUser = handleAsync(async (req, res, next) => {
    const { username, email, password, fullName, phoneNumber } = req.body;

    // Kiểm tra xem email hoặc username đã tồn tại chưa
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return next(createError(400, 'Email đã được sử dụng'));
    }

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
        isActive: true
    });

    await newUser.save();

    return res.success({
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            phoneNumber: newUser.phoneNumber,
            role: newUser.role
        }
    }, 'Tạo tài khoản người dùng mới thành công', 201);
});

// Cập nhật thông tin người dùng
export const updateUser = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { username, email, fullName, phoneNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'customer') {
        return next(createError(403, 'API này chỉ dùng để cập nhật thông tin người dùng thường'));
    }

    // Kiểm tra email và username nếu có thay đổi
    if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
            return next(createError(400, 'Email đã được sử dụng'));
        }
    }

    if (username && username !== user.username) {
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
        { new: true }
    ).select('-passwordHash');

    return res.success({
        user: updatedUser
    }, 'Cập nhật thông tin người dùng thành công');
});

// Vô hiệu hóa / Kích hoạt tài khoản người dùng
export const updateUserStatus = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'customer') {
        return next(createError(403, 'API này chỉ dùng để cập nhật trạng thái người dùng thường'));
    }

    // Quyền hạn: Staff không thể vô hiệu hóa tài khoản người dùng có doanh số cao
    if (req.user.role === 'staff' && isActive === false) {
        // Kiểm tra doanh số của user
        const totalSpending = await Order.aggregate([
            { $match: { user: userId, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const highValueThreshold = 10000000; // 10 triệu VND (có thể điều chỉnh)

        if (totalSpending.length > 0 && totalSpending[0].total > highValueThreshold) {
            return next(createError(403, 'Bạn không có quyền vô hiệu hóa tài khoản người dùng có doanh số cao'));
        }
    }

    user.isActive = isActive;
    await user.save();

    return res.success({
        user: {
            id: user._id,
            username: user.username,
            isActive: user.isActive
        }
    }, isActive ? 'Kích hoạt tài khoản thành công' : 'Vô hiệu hóa tài khoản thành công');
});

// Đặt lại mật khẩu người dùng
export const resetUserPassword = handleAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'customer') {
        return next(createError(403, 'API này chỉ dùng để đặt lại mật khẩu người dùng thường'));
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.passwordHash = hashedPassword;
    await user.save();

    return res.success({}, 'Đặt lại mật khẩu thành công');
});

// Xóa tài khoản người dùng
export const deleteUser = handleAsync(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    if (user.role !== 'customer') {
        return next(createError(403, 'API này chỉ dùng để xóa tài khoản người dùng thường'));
    }

    // Chỉ Admin mới có quyền xóa người dùng
    if (req.user.role !== 'admin') {
        return next(createError(403, 'Chỉ Admin mới có quyền xóa tài khoản người dùng'));
    }

    await User.findByIdAndDelete(userId);

    return res.success({}, 'Xóa tài khoản người dùng thành công');
});

// Xóa nhiều người dùng cùng lúc (chỉ dành cho Admin)
export const bulkDeleteUsers = handleAsync(async (req, res, next) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return next(createError(400, 'Danh sách ID người dùng không hợp lệ'));
    }

    // Kiểm tra xem tất cả có phải là người dùng thường không
    const users = await User.find({ _id: { $in: userIds } });

    for (const user of users) {
        if (user.role !== 'customer') {
            return next(createError(403, 'Chỉ có thể xóa tài khoản người dùng thường'));
        }
    }

    // Xóa người dùng
    const result = await User.deleteMany({ _id: { $in: userIds }, role: 'customer' });

    return res.success({
        deletedCount: result.deletedCount
    }, `Đã xóa ${result.deletedCount} tài khoản người dùng`);
});

// Thống kê người dùng
export const getUserStatistics = handleAsync(async (req, res, next) => {
    // Tổng số người dùng
    const totalUsers = await User.countDocuments({ role: 'customer' });

    // Số lượng người dùng đang hoạt động
    const activeUsers = await User.countDocuments({ role: 'customer', isActive: true });

    // Số lượng người dùng bị vô hiệu hóa
    const inactiveUsers = await User.countDocuments({ role: 'customer', isActive: false });

    // Số người dùng mới trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: sevenDaysAgo }
    });

    // Số người dùng có đơn hàng
    const usersWithOrders = await Order.distinct('user').length;

    return res.success({
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers,
        usersWithOrders
    });
});

// Xuất danh sách người dùng (chỉ dành cho Admin)
export const exportUsers = handleAsync(async (req, res, next) => {
    const { format = 'json' } = req.query;

    // Chỉ Admin mới có quyền xuất dữ liệu
    if (req.user.role !== 'admin') {
        return next(createError(403, 'Chỉ Admin mới có quyền xuất danh sách người dùng'));
    }

    const users = await User.find({ role: 'customer' })
        .select('_id username email fullName phoneNumber isActive createdAt')
        .sort({ createdAt: -1 });

    if (format === 'csv') {
        // Định dạng CSV (đơn giản)
        let csv = 'ID,Username,Email,Full Name,Phone Number,Status,Created Date\n';

        users.forEach(user => {
            csv += `${user._id},${user.username},${user.email},"${user.fullName || ''}","${user.phoneNumber || ''}",${user.isActive ? 'Active' : 'Inactive'},${user.createdAt}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=users-export.csv');
        return res.send(csv);
    } else {
        // Mặc định trả về JSON
        return res.success({
            users,
            exportDate: new Date(),
            count: users.length
        });
    }
});

// Xem địa chỉ của người dùng
export const getUserAddresses = handleAsync(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId).select('addresses');

    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    return res.success({
        addresses: user.addresses || []
    });
});

// Xem lịch sử hoạt động của người dùng
export const getUserActivities = handleAsync(async (req, res, next) => {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
        return next(createError(404, 'Không tìm thấy người dùng'));
    }

    // Lấy lịch sử đơn hàng
    const orders = await Order.find({ user: userId })
        .select('orderNumber status totalAmount createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(10);

    // Ở đây có thể bổ sung các loại hoạt động khác như review, wishlist, v.v.

    return res.success({
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        },
        activities: {
            orders
        }
    });
});

export default {
    getUsers,
    searchUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    resetUserPassword,
    deleteUser,
    bulkDeleteUsers,
    getUserStatistics,
    exportUsers,
    getUserAddresses,
    getUserActivities
};
