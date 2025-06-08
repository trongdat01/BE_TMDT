// filepath: d:\BACKEND_NODEJS\src\models\Product.js
import mongoose from "mongoose";
import slugMiddleware from "../middlewares/slug.middleware.js";

// Schema cho hình ảnh sản phẩm
const imageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    imageUrl: {
      type: String,
      required: true
    },
    altText: {
      type: String
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

// Schema cho sản phẩm
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null nhưng nếu có giá trị phải là duy nhất
      trim: true
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    material: {
      type: String,
      trim: true
    },
    images: [imageSchema],
    origin: {
      type: String,
      trim: true
    },
    warrantyInfo: {
      type: String,
      trim: true
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường
// Không cần đánh index lại cho slug và sku vì đã định nghĩa unique: true trong schema
productSchema.index({ brandId: 1 });
productSchema.index({ name: 'text', description: 'text' }, { name: 'productSearchIndex' });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Middleware kiểm tra trùng lặp slug và SKU trước khi lưu
productSchema.pre('save', async function (next) {
  try {
    // Nếu là document mới hoặc slug bị thay đổi
    if (this.isNew || this.isModified('slug')) {
      // Kiểm tra xem slug đã tồn tại chưa
      const existingProduct = await mongoose.model('Product').findOne({
        slug: this.slug,
        _id: { $ne: this._id } // Loại trừ chính document này
      });

      if (existingProduct) {
        // Nếu slug đã tồn tại, thêm timestamp để tạo slug mới duy nhất
        this.slug = `${this.slug}-${Date.now()}`;
      }
    }

    // Kiểm tra SKU nếu có
    if (this.sku && (this.isNew || this.isModified('sku'))) {
      const existingProductWithSku = await mongoose.model('Product').findOne({
        sku: this.sku,
        _id: { $ne: this._id }
      });

      if (existingProductWithSku) {
        return next(new Error('SKU đã tồn tại trong hệ thống'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Áp dụng middleware slug tự động - đặt thành true để đảm bảo tính duy nhất
productSchema.plugin(slugMiddleware('name', 'slug', true));

// Virtual field cho giá hiển thị (lấy giá khuyến mãi nếu có)
productSchema.virtual('displayPrice').get(function () {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Virtual field cho phần trăm giảm giá
productSchema.virtual('discountPercentage').get(function () {
  if (!this.salePrice || this.salePrice >= this.price) return 0;
  const discount = Math.round(((this.price - this.salePrice) / this.price) * 100);
  return discount;
});

// Virtual field cho URL của hình ảnh chính
productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.imageUrl : this.images[0].imageUrl;
});

// Đảm bảo virtual fields được trả về khi JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Phương thức để kiểm tra có còn hàng không
productSchema.methods.checkAvailability = function (quantity = 1) {
  return this.stockQuantity >= quantity;
};

// Phương thức tĩnh để tìm sản phẩm nổi bật
productSchema.statics.findFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('brandId', 'name slug');
};

// Phương thức tĩnh để tìm sản phẩm mới nhất
productSchema.statics.findNewest = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('brandId', 'name slug');
};

// Tạo model Product từ schema
const Product = mongoose.model("Product", productSchema);

export default Product;