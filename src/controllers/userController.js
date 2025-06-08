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