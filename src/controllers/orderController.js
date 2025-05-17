import mongoose from 'mongoose';
import Order from '../models/Order.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js'; 

// Lấy danh sách đơn hàng của người dùng đăng nhập
export const getMyOrders = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const orders = await Order.getOrdersByUser(userId);
    res.json({ success: true, data: orders });
});

// Lấy thông tin chi tiết của một đơn hàng
export const getOrderById = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createError(400, 'ID đơn hàng không hợp lệ'));
    const order = await Order.findById(id).populate('items');
    if (!order) return next(createError(404, 'Không tìm thấy đơn hàng'));
    // Chỉ chủ đơn hàng hoặc admin/staff mới xem được
    if (order.userId.toString() !== req.user.id && req.user.role === 'customer')
        return next(createError(403, 'Bạn không có quyền xem đơn hàng này'));
    res.json({ success: true, data: order });
});

// Tạo đơn hàng mới (chuyển từ giỏ hàng sang)
export const createOrder = handleAsync(async (req, res, next) => {
    const userId = req.user.id;
    const data = { ...req.body, userId };
    const order = await Order.createFromCart(data);
    res.status(201).json({ success: true, data: order });
});

// Cập nhật trạng thái đơn hàng (admin/staff)
export const updateOrderStatus = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createError(400, 'ID đơn hàng không hợp lệ'));
    const order = await Order.findById(id);
    if (!order) return next(createError(404, 'Không tìm thấy đơn hàng'));
    await order.updateStatus(status, paymentStatus);
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
});

// Hủy đơn hàng (khách hàng/admin/staff)
export const cancelOrder = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createError(400, 'ID đơn hàng không hợp lệ'));
    const order = await Order.findById(id);
    if (!order) return next(createError(404, 'Không tìm thấy đơn hàng'));
    // Chỉ chủ đơn hàng hoặc admin/staff mới được hủy
    if (order.userId.toString() !== req.user.id && req.user.role === 'customer')
        return next(createError(403, 'Bạn không có quyền hủy đơn hàng này'));
    await order.updateStatus('cancelled');
    res.json({ success: true, message: 'Đơn hàng đã được hủy', data: order });
});

// Lấy thông tin theo dõi đơn hàng
export const getOrderTracking = handleAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createError(400, 'ID đơn hàng không hợp lệ'));
    const order = await Order.findById(id);
    if (!order) return next(createError(404, 'Không tìm thấy đơn hàng'));
    // Trả về trackingNumber, status, shippingMethod, v.v.
    res.json({
        success: true,
        data: {
            trackingNumber: order.trackingNumber,
            status: order.status,
            shippingMethod: order.shippingMethod,
            updatedAt: order.updatedAt
        }
    });
});