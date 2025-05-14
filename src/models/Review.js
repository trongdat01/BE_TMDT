import mongoose from "mongoose";

/**
 * Review model - Đánh giá sản phẩm
 */
const reviewImageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      trim: true
    },
    images: [reviewImageSchema],
    isApproved: {
      type: Boolean,
      default: false
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    purchaseDate: {
      type: Date
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

// Đảm bảo virtual fields được trả về khi JSON
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

// Middleware pre-find để tự động populate thông tin người dùng
reviewSchema.pre('find', function () {
  this.populate('userId', 'username fullName');
});

reviewSchema.pre('findOne', function () {
  this.populate('userId', 'username fullName');
});

// Middleware pre-save để kiểm tra xem người dùng đã nhận được hàng chưa
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Kiểm tra xem người dùng đã nhận được hàng chưa
    const canReview = await Review.canUserReviewProduct(this.userId, this.productId);
    if (!canReview) {
      const error = new Error('Chỉ người dùng đã nhận hàng mới có thể đánh giá sản phẩm');
      return next(error);
    }

    // Tự động đánh dấu là verified purchase
    this.isVerifiedPurchase = true;

    // Lấy thông tin ngày mua hàng
    const purchaseInfo = await Review.getPurchaseInfo(this.userId, this.productId);
    if (purchaseInfo) {
      this.purchaseDate = purchaseInfo.purchaseDate;
    }
  }
  next();
});

// Middleware post-save để cập nhật thông tin đánh giá trong sản phẩm
reviewSchema.post('save', async function () {
  await updateProductRating(this.productId);
});

reviewSchema.post('remove', async function () {
  await updateProductRating(this.productId);
});

// Hàm hỗ trợ để cập nhật đánh giá trung bình của sản phẩm
async function updateProductRating(productId) {
  const Product = mongoose.model('Product');
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingAvg: Number(stats[0].avgRating.toFixed(1)),
      ratingCount: stats[0].count
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingAvg: 0,
      ratingCount: 0
    });
  }
}

// Phương thức để đánh dấu đánh giá là hữu ích
reviewSchema.methods.markAsHelpful = async function () {
  this.helpfulCount += 1;
  return this.save();
};

// Phương thức để báo cáo đánh giá không phù hợp
reviewSchema.methods.report = async function () {
  this.reportCount += 1;
  return this.save();
};

// Phương thức để phê duyệt đánh giá
reviewSchema.methods.approve = async function () {
  this.isApproved = true;
  const saved = await this.save();

  // Cập nhật đánh giá trung bình của sản phẩm
  await updateProductRating(this.productId);

  return saved;
};

// Phương thức để từ chối đánh giá
reviewSchema.methods.reject = async function () {
  this.isApproved = false;
  return this.save();
};

// Phương thức để xác minh đánh giá từ khách hàng đã mua sản phẩm
reviewSchema.methods.verifyPurchase = async function () {
  const OrderItem = mongoose.model('OrderItem');
  const Order = mongoose.model('Order');

  // Tìm các đơn hàng của người dùng có chứa sản phẩm này
  const orderItems = await OrderItem.find({
    productId: this.productId
  }).populate({
    path: 'orderId',
    match: {
      userId: this.userId,
      status: 'delivered'  // Chỉ tính các đơn hàng đã giao thành công
    }
  });

  const validOrders = orderItems.filter(item => item.orderId);

  if (validOrders.length > 0) {
    this.isVerifiedPurchase = true;
    this.purchaseDate = validOrders[0].orderId.createdAt;
    return this.save();
  }

  return this;
};

// Phương thức tĩnh để lấy tất cả đánh giá của một sản phẩm
reviewSchema.statics.getProductReviews = function (productId, onlyApproved = true) {
  const query = { productId };

  if (onlyApproved) {
    query.isApproved = true;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'username fullName');
};

// Phương thức tĩnh để lấy thống kê đánh giá theo sao
reviewSchema.statics.getRatingStats = async function (productId) {
  const stats = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  // Chuẩn hóa kết quả thành mảng từ 1-5 sao
  const result = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0
  };

  let total = 0;
  stats.forEach(item => {
    result[item._id] = item.count;
    total += item.count;
  });

  result.total = total;

  return result;
};

// Phương thức tĩnh để kiểm tra người dùng đã đánh giá sản phẩm chưa
reviewSchema.statics.hasUserReviewed = async function (userId, productId) {
  const review = await this.findOne({ userId, productId });
  return !!review;
};

// Phương thức tĩnh để kiểm tra người dùng có thể đánh giá sản phẩm hay không
reviewSchema.statics.canUserReviewProduct = async function (userId, productId) {
  // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
  const hasReviewed = await this.hasUserReviewed(userId, productId);
  if (hasReviewed) {
    return false; // Mỗi người dùng chỉ đánh giá một lần
  }

  // Kiểm tra xem người dùng đã nhận sản phẩm chưa
  const OrderItem = mongoose.model('OrderItem');

  const orderItems = await OrderItem.find({ productId })
    .populate({
      path: 'orderId',
      match: { userId, status: 'delivered' } // Chỉ đơn hàng đã giao thành công
    });

  // Lọc các orderItems có orderId (tức là đã populate thành công)
  const validDeliveredOrders = orderItems.filter(item => item.orderId);

  return validDeliveredOrders.length > 0;
};

// Phương thức tĩnh để lấy thông tin mua hàng của người dùng
reviewSchema.statics.getPurchaseInfo = async function (userId, productId) {
  const OrderItem = mongoose.model('OrderItem');

  const orderItems = await OrderItem.find({ productId })
    .populate({
      path: 'orderId',
      match: { userId, status: 'delivered' }
    });

  const validDeliveredOrders = orderItems.filter(item => item.orderId);

  if (validDeliveredOrders.length === 0) {
    return null;
  }

  // Sắp xếp theo thời gian để lấy đơn hàng mới nhất
  validDeliveredOrders.sort((a, b) =>
    b.orderId.createdAt.getTime() - a.orderId.createdAt.getTime()
  );

  return {
    orderId: validDeliveredOrders[0].orderId._id,
    orderNumber: validDeliveredOrders[0].orderId.orderNumber,
    purchaseDate: validDeliveredOrders[0].orderId.createdAt,
    quantity: validDeliveredOrders[0].quantity
  };
};

// Tạo model Review từ schema
const Review = mongoose.model("Review", reviewSchema);

export default Review;