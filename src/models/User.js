import mongoose from "mongoose";

// Định nghĩa schema cho model User
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addresses: [
      {
        id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString()
        },
        receiverName: {
          type: String,
          trim: true
        },
        phone: {
          type: String,
          trim: true
        },
        addressLine: {
          type: String,
          trim: true
        },
        ward: {
          type: String,
          trim: true
        },
        district: {
          type: String,
          trim: true
        },
        city: {
          type: String,
          trim: true
        },
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
);

// Tạo index cho các trường
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Đảm bảo virtual fields được trả về khi JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Bỏ mật khẩu khi chuyển đối tượng sang JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

// Phương thức để thêm địa chỉ mới
userSchema.methods.addAddress = function (addressData) {
  const newId = new mongoose.Types.ObjectId().toString();

  // Nếu đánh dấu là địa chỉ mặc định, hủy bỏ mặc định của địa chỉ khác
  if (addressData.isDefault) {
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Nếu đây là địa chỉ đầu tiên, tự động đặt là mặc định
  if (this.addresses.length === 0) {
    addressData.isDefault = true;
  }

  // Thêm địa chỉ với ID mới
  const newAddress = {
    id: newId,
    ...addressData
  };

  this.addresses.push(newAddress);
  return newId;
};

// Phương thức để cập nhật địa chỉ
userSchema.methods.updateAddress = function (addressId, updateData) {
  const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);

  if (addressIndex === -1) {
    return false;
  }

  // Nếu đánh dấu là địa chỉ mặc định, hủy bỏ mặc định của địa chỉ khác
  if (updateData.isDefault) {
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Cập nhật địa chỉ
  this.addresses[addressIndex] = {
    ...this.addresses[addressIndex],
    ...updateData,
    id: addressId // Giữ nguyên ID
  };

  return true;
};

// Phương thức để xóa địa chỉ
userSchema.methods.removeAddress = function (addressId) {
  const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);

  if (addressIndex === -1) {
    return false;
  }

  const isDefault = this.addresses[addressIndex].isDefault;
  this.addresses.splice(addressIndex, 1);

  // Nếu xóa địa chỉ mặc định và còn ít nhất một địa chỉ khác, đặt địa chỉ đầu tiên làm mặc định
  if (isDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }

  return true;
};

// Phương thức để lấy địa chỉ mặc định
userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find(addr => addr.isDefault) || null;
};

// Phương thức để lấy địa chỉ theo ID
userSchema.methods.getAddressById = function (addressId) {
  return this.addresses.find(addr => addr.id === addressId) || null;
};

// Phương thức để đặt địa chỉ mặc định
userSchema.methods.setDefaultAddress = function (addressId) {
  const found = this.addresses.some((addr, index) => {
    if (addr.id === addressId) {
      // Hủy mặc định của tất cả các địa chỉ
      this.addresses.forEach(a => {
        a.isDefault = false;
      });

      // Đặt địa chỉ này làm mặc định
      this.addresses[index].isDefault = true;
      return true;
    }
    return false;
  });

  return found;
};

// Phương thức tĩnh để tìm người dùng theo email hoặc username
userSchema.statics.findByCredentials = function (identifier) {
  // Tìm theo email hoặc tên đăng nhập
  return this.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  });
};

// Tạo model từ schema
const User = mongoose.model("User", userSchema);

export default User;