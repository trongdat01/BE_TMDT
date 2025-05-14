import mongoose from "mongoose";

/**
 * OrderItem model - Sản phẩm trong đơn hàng
 */
const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant"
    },
    productName: {
      type: String,
      required: true,
      description: "Tên sản phẩm tại thời điểm đặt hàng"
    },
    variantName: {
      type: String,
      description: "Tên biến thể tại thời điểm đặt hàng"
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      description: "Giá đơn vị tại thời điểm đặt hàng"
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      description: "Tổng tiền = unitPrice * quantity"
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ productId: 1 });

// Middleware để tự động populate thông tin sản phẩm khi cần
orderItemSchema.pre('find', function () {
  this.populate('productId', 'name slug images');
  this.populate('variantId', 'name color size imageUrl');
});

orderItemSchema.pre('findOne', function () {
  this.populate('productId', 'name slug images');
  this.populate('variantId', 'name color size imageUrl');
});

// Đảm bảo virtual fields được trả về khi JSON
orderItemSchema.set('toJSON', { virtuals: true });
orderItemSchema.set('toObject', { virtuals: true });

// Middleware trước khi lưu để tính toán tổng tiền
orderItemSchema.pre('save', function (next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.subtotal = this.unitPrice * this.quantity;
  }
  next();
});

// Phương thức để cập nhật số lượng
orderItemSchema.methods.updateQuantity = async function (quantity) {
  if (quantity <= 0) {
    throw new Error('Số lượng phải lớn hơn 0');
  }

  this.quantity = quantity;
  this.subtotal = this.unitPrice * quantity;

  await this.save();

  // Cập nhật tổng tiền của đơn hàng
  await this.updateOrderTotal();

  return this;
};

// Phương thức để cập nhật tổng tiền của đơn hàng
orderItemSchema.methods.updateOrderTotal = async function () {
  const Order = mongoose.model('Order');
  const OrderItem = mongoose.model('OrderItem');

  // Tính lại tổng tiền của đơn hàng
  const items = await OrderItem.find({ orderId: this.orderId });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await Order.findById(this.orderId);
  order.subtotal = subtotal;
  order.totalAmount = subtotal + order.shippingCost - order.discountAmount;

  return order.save();
};

// Phương thức tĩnh để lấy các sản phẩm trong đơn hàng
orderItemSchema.statics.getItemsByOrder = function (orderId) {
  return this.find({ orderId })
    .sort({ createdAt: 1 })
    .populate('productId', 'name slug images')
    .populate('variantId', 'name color size imageUrl');
};

// Phương thức tĩnh để tạo các mặt hàng trong đơn hàng từ giỏ hàng
orderItemSchema.statics.createFromCartItems = async function (orderId, cartItems) {
  const orderItems = [];

  for (const cartItem of cartItems) {
    const product = await mongoose.model('Product').findById(cartItem.productId);
    const variant = cartItem.variantId ?
      await mongoose.model('ProductVariant').findById(cartItem.variantId) : null;

    if (!product) {
      throw new Error(`Sản phẩm với ID ${cartItem.productId} không tồn tại`);
    }

    const orderItem = new this({
      orderId,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      productName: product.name,
      variantName: variant?.name || '',
      quantity: cartItem.quantity,
      unitPrice: cartItem.price,
      subtotal: cartItem.price * cartItem.quantity
    });

    await orderItem.save();
    orderItems.push(orderItem);
  }

  return orderItems;
};

// Phương thức tĩnh để lấy sản phẩm bán chạy nhất
orderItemSchema.statics.getBestSellingProducts = async function (limit = 10) {
  return this.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order'
      }
    },
    { $unwind: '$order' },
    {
      $match: {
        'order.status': { $in: ['delivered', 'shipped'] }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalSold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$subtotal' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
};

// Tạo model OrderItem từ schema
const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;