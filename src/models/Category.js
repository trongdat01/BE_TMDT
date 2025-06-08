import mongoose from "mongoose";
import slugMiddleware from "../middlewares/slug.middleware.js";

/**
 * Category model - Danh mục sản phẩm
 */
const categorySchema = new mongoose.Schema(
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
      type: String,
      trim: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    imageUrl: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
// Không cần index cho slug vì đã được định nghĩa trong schema với unique: true
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });

// Áp dụng middleware slug tự động
categorySchema.plugin(slugMiddleware('name', 'slug', false));

// Virtual để lấy đường dẫn đầy đủ của danh mục
categorySchema.virtual('path').get(function () {
  return this._path || [];
});

categorySchema.virtual('hasChildren').get(function () {
  return this._childrenCount > 0;
});

// Đảm bảo virtual fields được trả về khi JSON
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

// Phương thức để lấy toàn bộ đường dẫn danh mục (từ gốc đến danh mục hiện tại)
categorySchema.methods.getFullPath = async function () {
  if (this._path) {
    return this._path;
  }

  const path = [];
  let currentCategory = this;

  while (currentCategory.parentId) {
    const parent = await this.constructor.findById(currentCategory.parentId);
    if (!parent) break;
    path.unshift({ id: parent._id, name: parent.name, slug: parent.slug });
    currentCategory = parent;
  }

  this._path = path;
  return path;
};

// Phương thức tĩnh để lấy danh mục gốc (root categories)
categorySchema.statics.getRootCategories = function (includeInactive = false) {
  const query = { parentId: null };
  if (!includeInactive) {
    query.isActive = true;
  }

  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Phương thức tĩnh để lấy danh mục con trực tiếp của một danh mục
categorySchema.statics.getChildCategories = function (parentId, includeInactive = false) {
  const query = { parentId: parentId };
  if (!includeInactive) {
    query.isActive = true;
  }

  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Phương thức tĩnh để lấy toàn bộ cây danh mục
categorySchema.statics.getCategoryTree = async function (includeInactive = false) {
  const rootCategories = await this.getRootCategories(includeInactive);

  for (const category of rootCategories) {
    await this._populateChildren(category, includeInactive);
  }

  return rootCategories;
};

// Phương thức hỗ trợ để đệ quy lấy danh mục con
categorySchema.statics._populateChildren = async function (category, includeInactive) {
  const children = await this.getChildCategories(category._id, includeInactive);

  if (children.length > 0) {
    category._doc.children = children;
    category._childrenCount = children.length;

    for (const child of children) {
      await this._populateChildren(child, includeInactive);
    }
  } else {
    category._childrenCount = 0;
  }
};

// Phương thức để lấy tất cả danh mục liên quan đến sản phẩm (danh mục cha và các danh mục cùng cấp)
categorySchema.statics.getRelatedCategories = async function (categoryId) {
  const category = await this.findById(categoryId);
  if (!category) return [];

  const parentId = category.parentId || category._id;
  const query = category.parentId ?
    { parentId: category.parentId, isActive: true } :
    { _id: { $ne: category._id }, parentId: null, isActive: true };

  return this.find(query).sort({ displayOrder: 1 });
};

// Middleware pre-save
categorySchema.pre('save', async function (next) {
  if (this.parentId && this.parentId.toString() === this._id.toString()) {
    this.parentId = null; // Ngăn không cho danh mục trỏ đến chính nó
  }
  next();
});

// Tạo model Category từ schema
const Category = mongoose.model("Category", categorySchema);

export default Category;