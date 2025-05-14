import mongoose from "mongoose";

/**
 * Discount model - Mã giảm giá
 */
const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixedAmount"],
      required: true,
      description: "Loại giảm giá: phần trăm hoặc số tiền cố định"
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      description: "Giá trị giảm giá: % hoặc số tiền"
    },
    minPurchaseAmount: {
      type: Number,
      min: 0,
      default: 0,
      description: "Giá trị đơn hàng tối thiểu để áp dụng"
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
      description: "Số tiền giảm tối đa (áp dụng cho giảm giá phần trăm)"
    },
    isActive: {
      type: Boolean,
      default: true,
      description: "Trạng thái kích hoạt của mã giảm giá"
    },
    startDate: {
      type: Date,
      required: true,
      description: "Ngày bắt đầu hiệu lực"
    },
    endDate: {
      type: Date,
      required: true,
      description: "Ngày kết thúc hiệu lực"
    },
    usageLimit: {
      type: Number,
      min: 0,
      description: "Số lần sử dụng tối đa của mã giảm giá"
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Số lần mã đã được sử dụng"
    },
    appliesTo: {
      type: String,
      enum: ["all", "products", "categories", "brands"],
      default: "all",
      description: "Đối tượng áp dụng mã giảm giá"
    },
    appliesToIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      description: "Danh sách ID của sản phẩm, danh mục hoặc thương hiệu được áp dụng"
    },
    description: {
      type: String,
      trim: true,
      description: "Mô tả chi tiết về mã giảm giá"
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
discountSchema.index({ code: 1 }, { unique: true });
discountSchema.index({ isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ appliesTo: 1, appliesToIds: 1 });

// Đảm bảo virtual fields được trả về khi JSON
discountSchema.set('toJSON', { virtuals: true });
discountSchema.set('toObject', { virtuals: true });

// Middleware để kiểm tra tính hợp lệ của dữ liệu trước khi lưu
discountSchema.pre('save', function (next) {
  // Kiểm tra giá trị giảm giá phần trăm phải <= 100%
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Giảm giá phần trăm không thể vượt quá 100%'));
  }

  // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('Ngày bắt đầu phải trước ngày kết thúc'));
  }

  // Nếu đã vượt quá giới hạn sử dụng, tự động đặt isActive thành false
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    this.isActive = false;
  }

  next();
});

// Virtual field để kiểm tra xem mã giảm giá còn hiệu lực không
discountSchema.virtual('isValid').get(function () {
  const now = new Date();

  // Kiểm tra trạng thái, thời hạn và giới hạn sử dụng
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Middleware để kiểm tra tính hợp lệ của mã giảm giá trước khi thực hiện truy vấn
discountSchema.pre('find', function () {
  // Không tự động filter, vì có thể cần lấy cả những mã hết hạn cho báo cáo
});

// Phương thức tĩnh để lấy mã giảm giá hợp lệ theo mã
discountSchema.statics.findValidByCode = async function (code) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: { $exists: false } },
      { usageLimit: null },
      { usageCount: { $lt: '$usageLimit' } }
    ]
  });
};

// Phương thức tĩnh để lấy tất cả mã giảm giá còn hiệu lực
discountSchema.statics.findAllValid = async function () {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: { $exists: false } },
      { usageLimit: null },
      { usageCount: { $lt: '$usageLimit' } }
    ]
  });
};

// Phương thức xác thực mã giảm giá có áp dụng được cho đơn hàng không
discountSchema.methods.validateForOrder = async function (order) {
  // Kiểm tra giá trị đơn hàng tối thiểu
  if (this.minPurchaseAmount > 0 && order.subtotal < this.minPurchaseAmount) {
    return {
      valid: false,
      message: `Giá trị đơn hàng tối thiểu phải từ ${this.minPurchaseAmount.toLocaleString('vi-VN')}đ`
    };
  }

  // Kiểm tra mã có áp dụng cho sản phẩm cụ thể không
  if (this.appliesTo !== 'all' && this.appliesToIds.length > 0) {
    // Kiểm tra sản phẩm đơn hàng có phù hợp với mã giảm giá không
    let valid = false;

    // Lấy danh sách sản phẩm trong đơn hàng
    await order.populate('items');
    const items = order.items || [];

    if (this.appliesTo === 'products') {
      // Kiểm tra có ít nhất một sản phẩm trong đơn hàng nằm trong danh sách sản phẩm áp dụng
      valid = items.some(item => this.appliesToIds.includes(item.productId));
    } else if (this.appliesTo === 'categories') {
      // Kiểm tra sản phẩm thuộc danh mục được áp dụng
      const ProductCategory = mongoose.model('ProductCategory');

      for (const item of items) {
        const categories = await ProductCategory.find({ productId: item.productId });
        const categoryIds = categories.map(c => c.categoryId.toString());

        // Nếu có ít nhất một danh mục của sản phẩm nằm trong danh sách áp dụng
        if (categoryIds.some(catId => this.appliesToIds.includes(catId))) {
          valid = true;
          break;
        }
      }
    } else if (this.appliesTo === 'brands') {
      // Kiểm tra sản phẩm thuộc thương hiệu được áp dụng
      const Product = mongoose.model('Product');

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (product && this.appliesToIds.includes(product.brandId)) {
          valid = true;
          break;
        }
      }
    }

    if (!valid) {
      return {
        valid: false,
        message: 'Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng'
      };
    }
  }

  return { valid: true };
};

// Phương thức tính toán số tiền giảm giá cho đơn hàng
discountSchema.methods.calculateDiscountAmount = function (subtotal) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (subtotal * this.discountValue) / 100;

    // Áp dụng giới hạn số tiền giảm tối đa nếu có
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixedAmount') {
    discountAmount = this.discountValue;

    // Đảm bảo số tiền giảm không vượt quá giá trị đơn hàng
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }

  return discountAmount;
};

// Phương thức áp dụng mã giảm giá và tăng số lần sử dụng
discountSchema.methods.applyToOrder = async function () {
  // Tăng số lần sử dụng
  this.usageCount++;

  // Nếu đã đạt giới hạn, vô hiệu hóa mã giảm giá
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    this.isActive = false;
  }

  return this.save();
};

// Phương thức tĩnh để tạo mã giảm giá ngẫu nhiên
discountSchema.statics.generateCode = function (prefix = 'SHOP', length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;

  if (code.length > 0 && !code.endsWith('-')) {
    code += '-';
  }

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
};

// Phương thức tĩnh để lấy thống kê về các mã giảm giá
discountSchema.statics.getDiscountStats = async function () {
  const now = new Date();

  // Thống kê số lượng mã giảm giá theo trạng thái
  const stats = await this.aggregate([
    {
      $facet: {
        // Mã đang hoạt động
        active: [
          {
            $match: {
              isActive: true,
              startDate: { $lte: now },
              endDate: { $gte: now }
            }
          },
          { $count: 'count' }
        ],
        // Mã chưa bắt đầu
        upcoming: [
          {
            $match: {
              isActive: true,
              startDate: { $gt: now }
            }
          },
          { $count: 'count' }
        ],
        // Mã đã hết hạn
        expired: [
          {
            $match: {
              $or: [
                { isActive: false },
                { endDate: { $lt: now } }
              ]
            }
          },
          { $count: 'count' }
        ],
        // Thống kê theo loại giảm giá
        byType: [
          {
            $group: {
              _id: '$discountType',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  // Chuyển đổi kết quả thành định dạng dễ sử dụng
  const result = {
    active: stats[0].active.length > 0 ? stats[0].active[0].count : 0,
    upcoming: stats[0].upcoming.length > 0 ? stats[0].upcoming[0].count : 0,
    expired: stats[0].expired.length > 0 ? stats[0].expired[0].count : 0,
    byType: {}
  };

  // Thêm số liệu theo loại
  stats[0].byType.forEach(item => {
    result.byType[item._id] = item.count;
  });

  return result;
};

// Tạo model từ schema
const Discount = mongoose.model("Discount", discountSchema);

export default Discount;