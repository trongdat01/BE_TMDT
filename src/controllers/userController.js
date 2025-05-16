import User from '../models/User.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';

// Lấy danh sách tất cả người dùng
export const getUsers = handleAsync(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Lấy thông tin người dùng theo ID
export const getUserById = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(createError(404, 'Không tìm thấy người dùng'));
  res.json(user);
});

// Tạo mới một người dùng
export const createUser = handleAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(createError(400, 'Email đã tồn tại'));

  const user = new User({ name, email, password, role });
  await user.save();

  res.status(201).json({ message: 'Tạo người dùng thành công', user: { ...user._doc, password: undefined } });
});

// Cập nhật thông tin người dùng
export const updateUser = handleAsync(async (req, res, next) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');

  if (!user) return next(createError(404, 'Không tìm thấy người dùng'));

  res.json({ message: 'Cập nhật người dùng thành công', user });
});

// Xóa người dùng
export const deleteUser = handleAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(createError(404, 'Không tìm thấy người dùng'));

  res.json({ message: 'Xóa người dùng thành công' });
  
});
