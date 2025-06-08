import mongoose from "mongoose";

/**
 * ProductVariant model - Biến thể của sản phẩm (màu sắc, kích cỡ)
 */
const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      trim: true,
      required: true,
      description: "Tên biến thể, VD: 'Đỏ / XL'"
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      min: 0
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    color: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    weight: {
      type: Number,
      min: 0,
      description: "Trọng lượng tính bằng gram"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ color: 1 });
productVariantSchema.index({ size: 1 });
productVariantSchema.index({ isActive: 1 });

// Virtual field cho giá hiển thị - lấy từ biến thể nếu có, nếu không lấy từ sản phẩm chính
productVariantSchema.virtual('displayPrice').get(function () {
  return this.price || this._productCache?.displayPrice || 0;
});

// Phương thức để kiểm tra có còn hàng không
productVariantSchema.methods.checkAvailability = function (quantity = 1) {
  return this.stockQuantity >= quantity && this.isActive;
};

// Đảm bảo virtual fields được trả về khi JSON
productVariantSchema.set('toJSON', { virtuals: true });
productVariantSchema.set('toObject', { virtuals: true });

// Phương thức tĩnh để tìm biến thể theo màu sắc
productVariantSchema.statics.findByColor = function (productId, color) {
  return this.find({ productId, color, isActive: true });
};

// Phương thức tĩnh để tìm biến thể theo kích cỡ
productVariantSchema.statics.findBySize = function (productId, size) {
  return this.find({ productId, size, isActive: true });
};

// Phương thức tĩnh để lấy tất cả các màu sắc có sẵn của một sản phẩm
productVariantSchema.statics.getAvailableColors = async function (productId) {
  const variants = await this.find({ productId, isActive: true }, { color: 1 });
  const colors = [...new Set(variants.map(variant => variant.color))].filter(Boolean);
  return colors;
};

// Phương thức tĩnh để lấy tất cả các kích cỡ có sẵn của một sản phẩm
productVariantSchema.statics.getAvailableSizes = async function (productId) {
  const variants = await this.find({ productId, isActive: true }, { size: 1 });
  const sizes = [...new Set(variants.map(variant => variant.size))].filter(Boolean);
  return sizes;
};

// Phương thức để cập nhật số lượng tồn kho
productVariantSchema.methods.updateStock = async function (quantity) {
  if (this.stockQuantity + quantity < 0) {
    throw new Error('Số lượng tồn kho không đủ');
  }

  this.stockQuantity += quantity;
  return this.save();
};

// Middleware pre-save để đảm bảo tính chất hợp lệ của dữ liệu
productVariantSchema.pre('save', async function (next) {
  if (this.stockQuantity < 0) {
    this.stockQuantity = 0;
  }
  next();
});

// Tạo model ProductVariant từ schema
const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;