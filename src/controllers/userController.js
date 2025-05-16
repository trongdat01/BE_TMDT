import User from '../models/User.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import bcrypt from 'bcrypt';

// GET /users/me
export const getCurrentUser = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return next(createError(404, 'User not found'));
  res.json(user);
});

// GET /users (admin)
export const getUsers = handleAsync(async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// GET /users/:id (admin)
export const getUserById = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) return next(createError(404, 'User not found'));
  res.json(user);
});

// PUT /users/:id
export const updateUser = handleAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) return next(createError(404, 'User not found'));
  res.json(user);
});

// PATCH /users/:id/status (admin)
export const updateUserStatus = handleAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!user) return next(createError(404, 'User not found'));
  res.json({ message: 'Status updated', user });
});

// GET /users/me/addresses
export const getMyAddresses = handleAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.addresses);
});

// POST /users/me/addresses
export const addAddress = handleAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json(user.addresses);
});

// PUT /users/me/addresses/:addressId
export const updateAddress = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(createError(404, 'Address not found'));
  Object.assign(address, req.body);
  await user.save();
  res.json(user.addresses);
});

// DELETE /users/me/addresses/:addressId
export const deleteAddress = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const addressIdToDelete = req.params.addressId;

  // Kiểm tra xem địa chỉ tồn tại không
  const addressIndex = user.addresses.findIndex(addr => addr.id === addressIdToDelete);
  if (addressIndex === -1) return next(createError(404, 'Địa chỉ không tìm thấy'));

  // Xóa địa chỉ khỏi mảng bằng phương thức pull (cách mới của Mongoose)
  user.addresses.pull({ id: addressIdToDelete });

  // Lưu thay đổi vào database
  await user.save();

  // Trả về kết quả thành công
  res.json({ success: true, message: 'Đã xóa địa chỉ thành công' });
});

// PATCH /users/me/addresses/:addressId/default
export const setDefaultAddress = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  user.addresses.forEach(addr => addr.isDefault = false);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(createError(404, 'Address not found'));
  address.isDefault = true;
  await user.save();
  res.json({ message: 'Default address set' });
});

// POST /users/admin (admin only)
export const createAdminUser = handleAsync(async (req, res, next) => {
  const { username, email, password, fullName, phoneNumber, role } = req.body;

  // Chỉ cho phép tạo tài khoản admin hoặc staff
  if (role !== 'admin' && role !== 'staff') {
    return next(createError(400, 'Vai trò không hợp lệ, chỉ được phép tạo tài khoản Admin hoặc Staff'));
  }

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

  // Tạo tài khoản admin/staff mới
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
});

// DELETE /users/admin/:id (chỉ admin mới có quyền xóa)
export const deleteAdminUser = handleAsync(async (req, res, next) => {
  const userId = req.params.id;
  const adminId = req.user.id;

  // Không cho phép tự xóa tài khoản của mình
  if (userId === adminId) {
    return next(createError(400, 'Bạn không thể xóa tài khoản của chính mình'));
  }

  // Tìm người dùng cần xóa
  const userToDelete = await User.findById(userId);

  if (!userToDelete) {
    return next(createError(404, 'Không tìm thấy người dùng'));
  }

  // Kiểm tra xem người dùng cần xóa có phải admin hoặc staff không
  if (userToDelete.role !== 'admin' && userToDelete.role !== 'staff') {
    return next(createError(400, 'API này chỉ dùng để xóa tài khoản Admin hoặc Staff'));
  }

  // Kiểm tra nếu người dùng cần xóa là admin
  if (userToDelete.role === 'admin') {
    // Tìm xem có bao nhiêu admin trong hệ thống
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Nếu chỉ còn 1 admin, không cho phép xóa
    if (adminCount <= 1) {
      return next(createError(400, 'Không thể xóa Admin duy nhất trong hệ thống'));
    }

    // Tìm admin đầu tiên (Super Admin)
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

    // Nếu người dùng hiện tại không phải Super Admin, không cho xóa admin khác
    if (firstAdmin && firstAdmin._id.toString() !== adminId) {
      return next(createError(403, 'Chỉ Super Admin mới có quyền xóa tài khoản Admin khác'));
    }
  }

  // Xóa tài khoản
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: `Đã xóa tài khoản ${userToDelete.role === 'admin' ? 'Admin' : 'Staff'} thành công`
  });
});

// GET /users/admin (chỉ admin mới có quyền xem)
export const getAdminUsers = handleAsync(async (req, res) => {
  // Lấy tham số query để lọc
  const { role } = req.query;

  // Tạo điều kiện tìm kiếm
  const filter = {};

  // Nếu có yêu cầu lọc theo vai trò
  if (role === 'admin' || role === 'staff') {
    filter.role = role;
  } else {
    // Mặc định lấy cả admin và staff
    filter.role = { $in: ['admin', 'staff'] };
  }

  // Tìm tất cả admin và staff, loại bỏ mật khẩu trong kết quả
  const adminUsers = await User.find(filter)
    .select('-passwordHash');

  // Đánh dấu Super Admin (admin đầu tiên - không phụ thuộc vào trường createdAt)
  const firstAdmin = await User.findOne({ role: 'admin' })
    .sort({ _id: 1 }) // Sắp xếp theo ID
    .select('_id');

  // Chuyển đổi sang đối tượng JSON và đánh dấu Super Admin
  const response = adminUsers.map(user => {
    const userObj = user.toObject();
    // Nếu là admin đầu tiên, đánh dấu là Super Admin
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
});

// DELETE /users/:id
export const deleteUser = handleAsync(async (req, res, next) => {
  // Lấy id từ params
  const userId = req.params.id;

  // Tìm người dùng cần xóa
  const userToDelete = await User.findById(userId);

  if (!userToDelete) {
    return next(createError(404, 'Không tìm thấy người dùng'));
  }

  // Kiểm tra nếu người dùng là admin hoặc staff, không cho phép xóa bằng API này
  if (userToDelete.role === 'admin' || userToDelete.role === 'staff') {
    return next(createError(403, 'Không thể xóa tài khoản Admin hoặc Staff bằng API này. Vui lòng sử dụng API xóa Admin chuyên dụng'));
  }

  // Xóa người dùng
  await User.findByIdAndDelete(userId);

  // Trả về kết quả
  res.status(200).json({
    success: true,
    message: 'Xóa tài khoản thành công'
  });
});