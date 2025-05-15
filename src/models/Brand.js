import mongoose from "mongoose";
import slugMiddleware from "../middlewares/slug.middleware.js";
// Import model Product để sử dụng trong các phương thức tĩnh
import Product from "./Product.js";

/**
 * Brand model - Thương hiệu sản phẩm
 */
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isDomestic: {
      type: Boolean,
      default: true,
      description: "Đánh dấu thương hiệu nội địa"
    },
    isActive: {
      type: Boolean,
      default: true,
      description: "Trạng thái hoạt động của thương hiệu"
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
// Không cần index lại cho slug và name vì đã có 'unique: true' trong định nghĩa schema
brandSchema.index({ isDomestic: 1 });
brandSchema.index({ isActive: 1 });

// Áp dụng middleware slug tự động
brandSchema.plugin(slugMiddleware('name', 'slug', false));

// Đảm bảo virtual fields được trả về khi JSON
brandSchema.set('toJSON', { virtuals: true });
brandSchema.set('toObject', { virtuals: true });

// Virtual field cho số lượng sản phẩm
brandSchema.virtual('productCount').get(function () {
  return this._productCount || 0;
});

// Phương thức tĩnh để đếm số lượng sản phẩm cho mỗi thương hiệu
brandSchema.statics.getWithProductCount = async function (filter = {}) {
  // Mặc định chỉ lấy các thương hiệu đang active
  if (filter.isActive === undefined) {
    filter.isActive = true;
  }
  const brands = await this.find(filter);

  for (const brand of brands) {
    brand._productCount = await Product.countDocuments({
      brandId: brand._id,
      isActive: true
    });
  }

  return brands;
};

// Phương thức tĩnh để lấy các thương hiệu phổ biến nhất
brandSchema.statics.getPopularBrands = async function (limit = 10, includeInactive = false) {
  const brandFilter = includeInactive ? {} : { isActive: true };

  // Aggregate để đếm số lượng sản phẩm cho mỗi thương hiệu
  const brandStats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$brandId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  // Lấy thông tin chi tiết của các thương hiệu
  const brandIds = brandStats.map(item => item._id);
  const brands = await this.find({ _id: { $in: brandIds }, ...brandFilter });

  // Sắp xếp kết quả theo thứ tự phổ biến
  const sortedBrands = brandIds.map(id => {
    const brand = brands.find(b => b._id.toString() === id.toString());
    if (brand) {
      const stats = brandStats.find(s => s._id.toString() === id.toString());
      brand._productCount = stats ? stats.count : 0;
    }
    return brand;
  }).filter(Boolean);

  return sortedBrands;
};

// Phương thức để lấy tất cả thương hiệu phân loại theo nguồn gốc (nội địa/quốc tế)
brandSchema.statics.getByOrigin = async function (includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };

  const domestic = await this.find({ ...filter, isDomestic: true }).sort({ name: 1 });
  const international = await this.find({ ...filter, isDomestic: false }).sort({ name: 1 });

  return { domestic, international };
};

// Tạo model Brand từ schema
const Brand = mongoose.model("Brand", brandSchema);

export default Brand;