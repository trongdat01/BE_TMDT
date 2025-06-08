import Review from '../models/Review.js';
import Product from '../models/Product.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';
import mongoose from 'mongoose';

// GET /products/:productId/reviews - Lấy tất cả đánh giá của một sản phẩm
export const getProductReviews = handleAsync(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(createError(400, 'ID sản phẩm không hợp lệ'));
  }
  const reviews = await Review.getProductReviews(productId, true);
  res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

// POST /products/:productId/reviews - Thêm đánh giá mới cho sản phẩm
export const createReview = handleAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const { rating, title, comment, images } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(createError(400, 'ID sản phẩm không hợp lệ'));
  }

  // Kiểm tra sản phẩm tồn tại
  const product = await Product.findById(productId);
  if (!product) return next(createError(404, 'Không tìm thấy sản phẩm'));

  // Kiểm tra quyền đánh giá
  const canReview = await Review.canUserReviewProduct(userId, productId);
  if (!canReview) return next(createError(400, 'Bạn không thể đánh giá sản phẩm này'));

  // Tạo đánh giá mới
  const review = new Review({
    productId,
    userId,
    rating,
    title,
    comment,
    images
  });

  await review.save();
  res.status(201).json({ success: true, message: 'Đánh giá đã được gửi', data: review });
});

// PUT /reviews/:reviewId - Cập nhật đánh giá (chỉ người tạo)
export const updateReview = handleAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const { rating, title, comment, images } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(createError(400, 'ID đánh giá không hợp lệ'));
  }

  const review = await Review.findById(reviewId);
  if (!review) return next(createError(404, 'Không tìm thấy đánh giá'));

  if (review.userId.toString() !== userId) {
    return next(createError(403, 'Bạn chỉ có thể sửa đánh giá của mình'));
  }

  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  res.status(200).json({ success: true, message: 'Cập nhật đánh giá thành công', data: review });
});

// DELETE /reviews/:reviewId - Xóa đánh giá (người dùng hoặc admin)
export const deleteReview = handleAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(createError(400, 'ID đánh giá không hợp lệ'));
  }

  const review = await Review.findById(reviewId);
  if (!review) return next(createError(404, 'Không tìm thấy đánh giá'));

  if (review.userId.toString() !== userId && userRole !== 'admin') {
    return next(createError(403, 'Bạn không có quyền xóa đánh giá này'));
  }

  await review.remove();
  res.status(200).json({ success: true, message: 'Đã xóa đánh giá' });
});

// PATCH /reviews/:reviewId/approve - Phê duyệt đánh giá (admin/staff)
export const approveReview = handleAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userRole = req.user.role;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(createError(400, 'ID đánh giá không hợp lệ'));
  }

  if (!['admin', 'staff'].includes(userRole)) {
    return next(createError(403, 'Chỉ admin hoặc staff mới được phê duyệt đánh giá'));
  }

  const review = await Review.findById(reviewId);
  if (!review) return next(createError(404, 'Không tìm thấy đánh giá'));

  await review.approve();
  res.status(200).json({ success: true, message: 'Đánh giá đã được phê duyệt', data: review });
});

export default {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview
};