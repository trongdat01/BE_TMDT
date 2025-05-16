import User from '../models/User.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';

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