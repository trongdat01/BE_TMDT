import Wishlist from '../models/Wishlist.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import mongoose from 'mongoose';

// GET /wishlists - Lấy danh sách yêu thích của người dùng
export const getWishlists = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const wishlists = await Wishlist.getWishlistByUser(userId);
    res.json({ success: true, count: wishlists.length, data: wishlists });
});

// POST /wishlists - Thêm sản phẩm vào danh sách yêu thích
export const addToWishlist = handleAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(createError(400, 'ID sản phẩm không hợp lệ'));
    }

    const wishlistItem = await Wishlist.addToWishlist(userId, productId, variantId);
    res.status(201).json({ success: true, data: wishlistItem });
});

// DELETE /wishlists/:id - Xóa sản phẩm khỏi danh sách yêu thích
export const removeFromWishlist = handleAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(createError(400, 'ID wishlist không hợp lệ'));
    }

    const wishlistItem = await Wishlist.findOneAndDelete({ _id: id, userId });
    if (!wishlistItem) {
        return next(createError(404, 'Không tìm thấy mục yêu thích'));
    }

    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
});

// GET /wishlists/check/:productId - Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkWishlist = handleAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(createError(400, 'ID sản phẩm không hợp lệ'));
    }

    const exists = await Wishlist.isProductInWishlist(userId, productId);
    res.json({ success: true, exists });
});