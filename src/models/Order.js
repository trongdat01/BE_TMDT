import mongoose from "mongoose";

/**
 * Order model - Đơn hàng
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    receiverName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    addressLine: {
      type: String,
      required: true,
      trim: true
    },
    ward: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  addressType: {
    type: String,
    enum: ["user_saved", "manual"],
    required: true
  },
  addressId: {
    type: String,
    description: "ID của địa chỉ đã lưu trong users.addresses"
  },
  shippingAddress: {
    type: shippingAddressSchema,
    description: "Địa chỉ giao hàng được nhập trực tiếp"
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 20000,
    min: 0
  },
  shippingFeeWaived: {
    type: Boolean,
    default: false
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "bank_transfer", "momo", "zalopay", "vnpay"]
  },
  shippingMethod: {
    type: String,
    enum: ["standard", "express", "same_day"],
    default: "standard"
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount"
  },
  notes: {
    type: String,
    trim: true
  }
},
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ discountId: 1 });

// Virtual để lấy các items trong đơn hàng
orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual field cho tổng số mặt hàng trong đơn hàng
orderSchema.virtual('itemCount').get(function () {
  return this._itemCount || 0;
});

// Đảm bảo virtual fields được trả về khi JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Middleware pre-find để tự động nối với OrderItem
orderSchema.pre('findOne', function () {
  this.populate({
    path: 'items',
    options: { sort: { createdAt: 1 } }
  });
  this.populate('userId', 'username email fullName phoneNumber');
  this.populate('discountId', 'code name discountType discountValue');
});

// Tạo orderNumber tự động trước khi lưu
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Format: ORD-YYYYMMDDHHmmss-XXXX (X là số ngẫu nhiên)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 chữ số ngẫu nhiên

    this.orderNumber = `ORD-${year}${month}${day}${hours}${minutes}${seconds}-${random}`;
  }
  next();
});

// Phương thức để cập nhật tổng số mặt hàng trong đơn hàng
orderSchema.methods.updateItemCount = async function () {
  const OrderItem = mongoose.model('OrderItem');
  const count = await OrderItem.countDocuments({ orderId: this._id });

  this._itemCount = count;
  return count;
};

// Phương thức để cập nhật trạng thái đơn hàng
orderSchema.methods.updateStatus = async function (status, paymentStatus) {
  if (status) {
    this.status = status;
  }

  if (paymentStatus) {
    this.paymentStatus = paymentStatus;
  }

  return this.save();
};

// Phương thức tĩnh để tạo đơn hàng mới từ giỏ hàng
orderSchema.statics.createFromCart = async function (data) {
  const {
    cartId, userId, addressType, addressId, shippingAddress,
    paymentMethod, shippingMethod, discountId, notes
  } = data;

  // Lấy giỏ hàng và các mặt hàng
  const Cart = mongoose.model('Cart');
  const CartItem = mongoose.model('CartItem');

  const cart = await Cart.findById(cartId).populate('items');
  if (!cart || cart.items.length === 0) {
    throw new Error('Giỏ hàng không tồn tại hoặc trống');
  }

  // Tạo đơn hàng mới
  const order = new this({
    userId,
    addressType,
    addressId: addressType === 'user_saved' ? addressId : undefined,
    shippingAddress: addressType === 'manual' ? shippingAddress : undefined,
    subtotal: cart.subtotal,
    shippingCost: cart.shippingCost,
    taxAmount: 0, // Tính thuế nếu cần
    discountAmount: 0, // Sẽ được cập nhật nếu có mã giảm giá
    totalAmount: cart.subtotal + cart.shippingCost, // Sẽ được cập nhật sau
    paymentMethod,
    shippingMethod,
    discountId,
    notes
  });

  // Lưu order để lấy ID
  await order.save();

  // Chuyển các mặt hàng từ giỏ hàng sang đơn hàng
  const OrderItem = mongoose.model('OrderItem');
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;
    const variant = item.variantId;

    const orderItem = new OrderItem({
      orderId: order._id,
      productId: product._id,
      variantId: variant?._id,
      productName: product.name,
      variantName: variant?.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity
    });

    await orderItem.save();
    orderItems.push(orderItem);
  }

  // Áp dụng mã giảm giá nếu có
  if (discountId) {
    const Discount = mongoose.model('Discount');
    const discount = await Discount.findById(discountId);

    if (discount && discount.isActive) {
      // Tính toán số tiền giảm giá
      let discountAmount = 0;

      if (discount.discountType === 'percentage') {
        discountAmount = (order.subtotal * discount.discountValue) / 100;
        // Áp dụng giới hạn số tiền giảm tối đa nếu có
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
          discountAmount = discount.maxDiscountAmount;
        }
      } else if (discount.discountType === 'fixedAmount') {
        discountAmount = discount.discountValue;
      }

      order.discountAmount = discountAmount;
      order.totalAmount = order.subtotal + order.shippingCost - discountAmount;

      await order.save();
    }
  }

  // Xóa giỏ hàng sau khi đã chuyển thành đơn hàng
  await cart.clearCart();

  return order;
};

// Phương thức tĩnh để lấy các đơn hàng của người dùng
orderSchema.statics.getOrdersByUser = function (userId, status) {
  const query = { userId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('items');
};

// Phương thức tĩnh để lấy thống kê đơn hàng theo trạng thái
orderSchema.statics.getOrderStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

// Tạo model Order từ schema
const Order = mongoose.model("Order", orderSchema);

export default Order;