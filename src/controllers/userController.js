import User from '../models/User.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import bcrypt from 'bcrypt';

// GET /users/me
export const getCurrentUser = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    res.json(user);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// GET /users (admin) - có phân trang, tìm kiếm, check lỗi
export const getUsers = handleAsync(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: users
    });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// GET /users/:id (admin)
export const getUserById = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    res.json(user);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// PUT /users/:id
export const updateUser = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    res.json(user);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// PATCH /users/:id/status (admin)
export const updateUserStatus = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    res.json({ message: 'Trạng thái đã được cập nhật', user });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// GET /users/me/addresses
export const getMyAddresses = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    res.json(user.addresses);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// POST /users/me/addresses
export const addAddress = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// PUT /users/me/addresses/:addressId
export const updateAddress = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    const address = user.addresses.id(req.params.addressId);
    if (!address) return next(createError(404, 'Không tìm thấy địa chỉ'));
    Object.assign(address, req.body);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// DELETE /users/me/addresses/:addressId
export const deleteAddress = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    const addressIdToDelete = req.params.addressId;
    const addressIndex = user.addresses.findIndex(addr => addr.id === addressIdToDelete);
    if (addressIndex === -1) return next(createError(404, 'Địa chỉ không tìm thấy'));
    user.addresses.pull({ id: addressIdToDelete });
    await user.save();
    res.json({ success: true, message: 'Đã xóa địa chỉ thành công' });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// PATCH /users/me/addresses/:addressId/default
export const setDefaultAddress = handleAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
    user.addresses.forEach(addr => addr.isDefault = false);
    const address = user.addresses.id(req.params.addressId);
    if (!address) return next(createError(404, 'Không tìm thấy địa chỉ'));
    address.isDefault = true;
    await user.save();
    res.json({ message: 'Địa chỉ mặc định được thiết lập' });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// POST /users/admin (admin only)
export const createAdminUser = handleAsync(async (req, res, next) => {
  try {
    const { username, email, password, fullName, phoneNumber, role } = req.body;
    if (role !== 'admin' && role !== 'staff') {
      return next(createError(400, 'Vai trò không hợp lệ, chỉ được phép tạo tài khoản Admin hoặc Staff'));
    }
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
      role,
      isActive: true
    });
    await newUser.save();
    res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role === 'admin' ? 'Admin' : 'Staff'} thành công`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// DELETE /users/admin/:id (chỉ admin mới có quyền xóa)
export const deleteAdminUser = handleAsync(async (req, res, next) => {
  try {
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
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return next(createError(400, 'Không thể xóa Admin duy nhất trong hệ thống'));
      }
      const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (firstAdmin && firstAdmin._id.toString() !== adminId) {
        return next(createError(403, 'Chỉ Super Admin mới có quyền xóa tài khoản Admin khác'));
      }
    }
    await User.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: `Đã xóa tài khoản ${userToDelete.role === 'admin' ? 'Admin' : 'Staff'} thành công`
    });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// GET /users/admin (chỉ admin mới có quyền xem)
export const getAdminUsers = handleAsync(async (req, res, next) => {
  try {
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
    res.json({
      success: true,
      count: response.length,
      data: response
    });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});

// DELETE /users/:id
export const deleteUser = handleAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return next(createError(404, 'Không tìm thấy người dùng'));
    }
    if (userToDelete.role === 'admin' || userToDelete.role === 'staff') {
      return next(createError(403, 'Không thể xóa tài khoản Admin hoặc Staff bằng API này. Vui lòng sử dụng API xóa Admin chuyên dụng'));
    }
    await User.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (err) {
    next(createError(500, 'Lỗi server'));
  }
});