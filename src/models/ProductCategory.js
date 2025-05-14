import mongoose from "mongoose";

/**
 * ProductCategory model - Bảng trung gian liên kết Product và Category (quan hệ nhiều-nhiều)
 */
const productCategorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    }
  },
  { timestamps: false } // Không cần timestamps cho bảng quan hệ
);

// Tạo index ghép productId và categoryId thành primary key
productCategorySchema.index({ productId: 1, categoryId: 1 }, { unique: true });

// Index riêng cho từng trường để tối ưu truy vấn
productCategorySchema.index({ productId: 1 });
productCategorySchema.index({ categoryId: 1 });

// Các phương thức tĩnh để quản lý mối quan hệ product-category

// Phương thức để gán một danh mục cho sản phẩm
productCategorySchema.statics.assignCategory = async function (productId, categoryId) {
  try {
    // Kiểm tra xem bản ghi đã tồn tại chưa
    const existingRelation = await this.findOne({ productId, categoryId });
    if (existingRelation) return existingRelation;

    // Tạo mối quan hệ mới
    return await this.create({ productId, categoryId });
  } catch (error) {
    throw error;
  }
};

// Phương thức để gán nhiều danh mục cho một sản phẩm
productCategorySchema.statics.assignCategories = async function (productId, categoryIds) {
  try {
    // Xóa các mối quan hệ hiện tại
    await this.deleteMany({ productId });

    // Tạo mảng các đối tượng để chèn vào
    const relations = categoryIds.map(categoryId => ({
      productId,
      categoryId
    }));

    // Chèn nhiều bản ghi cùng lúc
    return await this.insertMany(relations);
  } catch (error) {
    throw error;
  }
};

// Phương thức để lấy tất cả danh mục của một sản phẩm
productCategorySchema.statics.getCategoriesByProduct = async function (productId) {
  try {
    // Tham chiếu trực tiếp đến Category để lấy chi tiết
    const relations = await this.find({ productId }).populate('categoryId');

    // Trích xuất thông tin danh mục từ kết quả
    return relations.map(relation => relation.categoryId);
  } catch (error) {
    throw error;
  }
};

// Phương thức để lấy tất cả sản phẩm thuộc một danh mục (bao gồm cả danh mục con)
productCategorySchema.statics.getProductsByCategory = async function (categoryId, includeSubcategories = true) {
  try {
    let categoryIds = [categoryId];

    // Nếu bao gồm danh mục con
    if (includeSubcategories) {
      const Category = mongoose.model('Category');
      const subcategories = await Category.find({ parentId: categoryId });

      if (subcategories.length > 0) {
        categoryIds = [...categoryIds, ...subcategories.map(cat => cat._id)];
      }
    }

    // Tìm tất cả sản phẩm trong các danh mục đã chọn
    const relations = await this.find({
      categoryId: { $in: categoryIds }
    }).populate('productId');

    // Trích xuất thông tin sản phẩm từ kết quả
    return relations.map(relation => relation.productId);
  } catch (error) {
    throw error;
  }
};

// Phương thức để xóa một sản phẩm khỏi danh mục
productCategorySchema.statics.removeCategory = async function (productId, categoryId) {
  try {
    return await this.deleteOne({ productId, categoryId });
  } catch (error) {
    throw error;
  }
};

// Tạo model ProductCategory từ schema
const ProductCategory = mongoose.model("ProductCategory", productCategorySchema);

export default ProductCategory;