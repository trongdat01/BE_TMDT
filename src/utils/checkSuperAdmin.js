import User from '../models/User.js';

/**
 * Kiểm tra xem một user có phải là Super Admin không
 * (Super Admin được định nghĩa là admin đầu tiên trong hệ thống)
 * 
 * @param {string} userId - ID của user cần kiểm tra
 * @returns {Promise<boolean>} true nếu user là Super Admin, false nếu không phải
 */
export const isSuperAdmin = async (userId) => {
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('_id');
    return firstAdmin && firstAdmin._id.toString() === userId;
};

/**
 * Lấy thông tin Super Admin
 * 
 * @returns {Promise<Object|null>} Thông tin của Super Admin hoặc null nếu không tìm thấy
 */
export const getSuperAdmin = async () => {
    return await User.findOne({ role: 'admin' }).sort({ _id: 1 }).select('-passwordHash');
};

export default {
    isSuperAdmin,
    getSuperAdmin
};
