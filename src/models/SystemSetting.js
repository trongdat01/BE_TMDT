import mongoose from "mongoose";

/**
 * SystemSetting model - Cài đặt hệ thống
 * Lưu trữ các tham số cấu hình hệ thống như phí vận chuyển, ngưỡng miễn phí vận chuyển...
 */
const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      description: "Khóa cấu hình: shippingFee, freeShippingThreshold..."
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false } // Không cần timestamps tự động vì đã có updatedAt tùy chỉnh
);

// Tạo index cho các trường quan trọng
systemSettingSchema.index({ key: 1 }, { unique: true });

// Middleware để tự động cập nhật trường updatedAt khi giá trị được thay đổi
systemSettingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Đảm bảo virtual fields được trả về khi JSON
systemSettingSchema.set('toJSON', { virtuals: true });
systemSettingSchema.set('toObject', { virtuals: true });

// Danh sách các cài đặt mặc định của hệ thống
const defaultSettings = {
  shippingFee: {
    value: "20000",
    description: "Phí vận chuyển tiêu chuẩn (VND)"
  },
  freeShippingThreshold: {
    value: "500000",
    description: "Ngưỡng giá trị đơn hàng để miễn phí vận chuyển (VND)"
  },
  taxRate: {
    value: "0",
    description: "Thuế VAT (%)"
  },
  storeName: {
    value: "Shop Thời Trang",
    description: "Tên cửa hàng"
  },
  storeEmail: {
    value: "contact@example.com",
    description: "Email liên hệ của cửa hàng"
  },
  storePhone: {
    value: "0987654321",
    description: "Số điện thoại liên hệ của cửa hàng"
  },
  currencySymbol: {
    value: "₫",
    description: "Ký hiệu tiền tệ"
  },
  maintenanceMode: {
    value: "false",
    description: "Chế độ bảo trì website (true/false)"
  }
};

// Phương thức tĩnh để lấy giá trị cài đặt hệ thống
systemSettingSchema.statics.getSetting = async function (key) {
  const setting = await this.findOne({ key: key.toLowerCase() });
  return setting ? setting.value : null;
};

// Phương thức tĩnh để lấy nhiều cài đặt cùng lúc
systemSettingSchema.statics.getMultipleSettings = async function (keys) {
  const settings = await this.find({ key: { $in: keys.map(k => k.toLowerCase()) } });

  const result = {};
  settings.forEach(setting => {
    result[setting.key] = setting.value;
  });

  return result;
};

// Phương thức tĩnh để cập nhật giá trị cài đặt
systemSettingSchema.statics.updateSetting = async function (key, value, userId = null, description = null) {
  const updates = {
    value,
    updatedAt: new Date()
  };

  if (userId) {
    updates.updatedBy = userId;
  }

  if (description !== null) {
    updates.description = description;
  }

  const options = {
    upsert: true, // Tạo mới nếu không tồn tại
    new: true,    // Trả về document sau khi cập nhật
    runValidators: true
  };

  return this.findOneAndUpdate({ key: key.toLowerCase() }, updates, options);
};

// Phương thức tĩnh để cập nhật nhiều cài đặt cùng lúc
systemSettingSchema.statics.updateMultipleSettings = async function (settingsData, userId = null) {
  const updates = [];

  for (const [key, data] of Object.entries(settingsData)) {
    let value, description;

    if (typeof data === 'object' && data !== null) {
      value = data.value;
      description = data.description;
    } else {
      value = data;
      description = null;
    }

    updates.push(this.updateSetting(key, value, userId, description));
  }

  return Promise.all(updates);
};

// Phương thức tĩnh để khởi tạo các cài đặt mặc định nếu chưa tồn tại
systemSettingSchema.statics.initializeDefaultSettings = async function () {
  const existingKeys = (await this.find({}, 'key')).map(doc => doc.key);
  const missingDefaults = {};

  for (const [key, data] of Object.entries(defaultSettings)) {
    if (!existingKeys.includes(key.toLowerCase())) {
      missingDefaults[key] = data;
    }
  }

  if (Object.keys(missingDefaults).length > 0) {
    return this.updateMultipleSettings(missingDefaults);
  }

  return [];
};

// Phương thức tĩnh để lấy giá trị dưới dạng số
systemSettingSchema.statics.getNumericSetting = async function (key, defaultValue = 0) {
  const value = await this.getSetting(key);
  return value !== null ? Number(value) : defaultValue;
};

// Phương thức tĩnh để lấy giá trị dưới dạng boolean
systemSettingSchema.statics.getBooleanSetting = async function (key, defaultValue = false) {
  const value = await this.getSetting(key);
  return value !== null ? value.toLowerCase() === 'true' : defaultValue;
};

// Tạo model từ schema
const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);

export default SystemSetting;