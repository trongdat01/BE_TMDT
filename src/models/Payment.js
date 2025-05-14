import mongoose from "mongoose";

/**
 * Payment model - Thanh toán đơn hàng
 */
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "VND",
      trim: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cod", "bank_transfer", "momo", "zalopay", "vnpay"]
    },
    paymentProvider: {
      type: String,
      trim: true
    },
    providerTransactionId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded", "partially_refunded"],
      default: "pending"
    },
    bankCode: {
      type: String,
      trim: true
    },
    bankTransactionInfo: {
      type: String,
      trim: true
    },
    errorCode: {
      type: String,
      trim: true
    },
    errorDescription: {
      type: String,
      trim: true
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentNumber: 1 }, { unique: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ providerTransactionId: 1 });

// Virtual field để kiểm tra nhanh xem thanh toán đã hoàn tất chưa
paymentSchema.virtual('isPaid').get(function () {
  return this.status === 'completed';
});

// Virtual field để kiểm tra nhanh xem thanh toán đã hoàn tiền chưa
paymentSchema.virtual('isRefunded').get(function () {
  return this.status === 'refunded' || this.status === 'partially_refunded';
});

// Đảm bảo virtual fields được trả về khi JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

// Middleware pre-find để tự động populate đơn hàng
paymentSchema.pre('findOne', function () {
  this.populate('orderId', 'orderNumber totalAmount status paymentStatus');
});

// Tạo paymentNumber tự động trước khi lưu
paymentSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Format: PAY-YYYYMMDDHHmmss-XXXX (X là số ngẫu nhiên)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 chữ số ngẫu nhiên

    this.paymentNumber = `PAY-${year}${month}${day}${hours}${minutes}${seconds}-${random}`;
  }
  next();
});

// Middleware sau khi lưu để cập nhật trạng thái đơn hàng
paymentSchema.post('save', async function () {
  const Order = mongoose.model('Order');
  const order = await Order.findById(this.orderId);

  if (order) {
    // Cập nhật trạng thái thanh toán của đơn hàng dựa trên trạng thái thanh toán
    switch (this.status) {
      case 'completed':
        order.paymentStatus = 'paid';
        break;
      case 'failed':
        order.paymentStatus = 'failed';
        break;
      case 'refunded':
      case 'partially_refunded':
        order.paymentStatus = 'refunded';
        break;
      default:
        order.paymentStatus = 'pending';
    }

    await order.save();
  }
});

// Phương thức để đánh dấu thanh toán thành công
paymentSchema.methods.markAsCompleted = async function (providerData = {}) {
  this.status = 'completed';

  // Cập nhật thông tin từ nhà cung cấp thanh toán
  if (providerData.transactionId) {
    this.providerTransactionId = providerData.transactionId;
  }

  if (providerData.bankCode) {
    this.bankCode = providerData.bankCode;
  }

  if (providerData.bankTransactionInfo) {
    this.bankTransactionInfo = providerData.bankTransactionInfo;
  }

  if (providerData.metadata) {
    this.metadata = { ...this.metadata, ...providerData.metadata };
  }

  // Lưu thanh toán
  await this.save();

  // Cập nhật trạng thái đơn hàng
  const Order = mongoose.model('Order');
  const order = await Order.findById(this.orderId);

  if (order && order.status === 'pending') {
    order.status = 'processing';
    await order.save();
  }

  return this;
};

// Phương thức để đánh dấu thanh toán thất bại
paymentSchema.methods.markAsFailed = async function (errorInfo = {}) {
  this.status = 'failed';

  if (errorInfo.code) {
    this.errorCode = errorInfo.code;
  }

  if (errorInfo.description) {
    this.errorDescription = errorInfo.description;
  }

  await this.save();
  return this;
};

// Phương thức để hoàn tiền
paymentSchema.methods.refund = async function (amount = null, reason = '') {
  // Nếu không chỉ định số tiền, hoàn toàn bộ
  const refundAmount = amount || this.amount - this.refundedAmount;

  if (refundAmount <= 0) {
    throw new Error('Số tiền hoàn phải lớn hơn 0');
  }

  if (refundAmount > (this.amount - this.refundedAmount)) {
    throw new Error('Số tiền hoàn vượt quá số tiền đã thanh toán');
  }

  this.refundedAmount += refundAmount;

  // Xác định trạng thái hoàn tiền (một phần hay toàn bộ)
  if (this.refundedAmount === this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }

  // Lưu thông tin lý do hoàn tiền vào metadata
  this.metadata = {
    ...this.metadata,
    refund: {
      ...((this.metadata && this.metadata.refund) || {}),
      date: new Date(),
      amount: refundAmount,
      reason
    }
  };

  await this.save();
  return this;
};

// Phương thức tĩnh để tạo thanh toán mới từ đơn hàng
paymentSchema.statics.createFromOrder = async function (orderId, paymentMethod) {
  const Order = mongoose.model('Order');
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }

  // Kiểm tra xem đã có thanh toán cho đơn hàng này chưa
  const existingPayment = await this.findOne({ orderId });
  if (existingPayment && existingPayment.status === 'completed') {
    throw new Error('Đơn hàng này đã được thanh toán');
  }

  // Tạo thanh toán mới
  const payment = new this({
    orderId,
    amount: order.totalAmount,
    paymentMethod: paymentMethod || order.paymentMethod,
    status: 'pending'
  });

  await payment.save();
  return payment;
};

// Phương thức tĩnh để lấy thống kê thanh toán theo phương thức
paymentSchema.statics.getPaymentStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        }
      }
    }
  ]);
};

// Tạo model Payment từ schema
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;