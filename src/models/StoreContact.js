import mongoose from "mongoose";

/**
 * StoreContact model - Thông tin liên hệ cửa hàng
 * Lưu trữ thông tin liên hệ, địa điểm các cửa hàng vật lý
 */
const storeContactSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      description: "Tên cửa hàng"
    },
    phone: {
      type: String,
      trim: true,
      description: "Số điện thoại liên hệ"
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      description: "Email liên hệ"
    },
    addressLine: {
      type: String,
      trim: true,
      description: "Địa chỉ chi tiết"
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
    mapLocation: {
      type: {
        lat: Number,
        lng: Number
      },
      description: "Tọa độ bản đồ"
    },
    workingHours: {
      type: String,
      trim: true,
      description: "Giờ làm việc"
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
storeContactSchema.index({ email: 1 });
storeContactSchema.index({ phone: 1 });
storeContactSchema.index({ isActive: 1 });
storeContactSchema.index({ city: 1, district: 1, ward: 1 });

// Đảm bảo virtual fields được trả về khi JSON
storeContactSchema.set('toJSON', { virtuals: true });
storeContactSchema.set('toObject', { virtuals: true });

// Phương thức tạo chuỗi địa chỉ đầy đủ
storeContactSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.addressLine,
    this.ward,
    this.district,
    this.city
  ].filter(Boolean);

  return parts.join(', ');
});

// Virtual field cho trạng thái hoạt động dưới dạng text
storeContactSchema.virtual('status').get(function () {
  return this.isActive ? 'Đang hoạt động' : 'Tạm ngưng';
});

// Phương thức tĩnh để lấy tất cả cửa hàng theo thành phố
storeContactSchema.statics.findByCity = function (city) {
  return this.find({
    city: new RegExp(city, 'i'),
    isActive: true
  });
};

// Phương thức tĩnh để lấy tất cả cửa hàng đang hoạt động
storeContactSchema.statics.findActiveStores = function () {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Phương thức tĩnh để tìm cửa hàng gần vị trí
storeContactSchema.statics.findNearby = async function (lat, lng, maxDistanceKm = 10) {
  const stores = await this.find({ isActive: true });

  // Tính khoảng cách giữa 2 điểm theo công thức Haversine
  function getDistanceFromLatLngInKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Khoảng cách tính bằng km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Lọc và sắp xếp cửa hàng theo khoảng cách
  const storesWithDistance = stores
    .filter(store => store.mapLocation?.lat && store.mapLocation?.lng)
    .map(store => {
      const distance = getDistanceFromLatLngInKm(
        lat,
        lng,
        store.mapLocation.lat,
        store.mapLocation.lng
      );
      return { ...store.toObject(), distance };
    })
    .filter(store => store.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);

  return storesWithDistance;
};

// Phương thức để kiểm tra xem cửa hàng có đang mở cửa không
storeContactSchema.methods.isOpenNow = function () {
  if (!this.workingHours) return false;

  // Định dạng workingHours dự kiến: "T2-T6: 8:00-17:30, T7-CN: 9:00-12:00"
  try {
    const now = new Date();
    const day = now.getDay(); // 0: CN, 1-6: T2-T7
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Chuyển đổi ngày trong tuần từ JS (0 = CN) sang định dạng thông thường (2-7, 1 = CN)
    const mappedDay = day === 0 ? 1 : day + 1;

    // Phân tích chuỗi giờ làm việc
    const periods = this.workingHours.split(',').map(p => p.trim());

    for (const period of periods) {
      const [dayRange, timeRange] = period.split(':').map(p => p.trim());

      // Xác định ngày trong tuần
      let dayStart, dayEnd;

      if (dayRange.includes('-')) {
        const [start, end] = dayRange.split('-').map(d => {
          if (d.includes('CN')) return 1;
          return parseInt(d.replace(/\D/g, ''), 10);
        });
        dayStart = start;
        dayEnd = end;
      } else {
        const day = dayRange.includes('CN') ? 1 : parseInt(dayRange.replace(/\D/g, ''), 10);
        dayStart = dayEnd = day;
      }

      // Kiểm tra xem ngày hiện tại có trong khoảng ngày làm việc không
      const isDayInRange =
        (dayStart <= dayEnd && mappedDay >= dayStart && mappedDay <= dayEnd) ||
        (dayStart > dayEnd && (mappedDay >= dayStart || mappedDay <= dayEnd));

      if (isDayInRange && timeRange) {
        // Kiểm tra giờ làm việc
        const [hourStart, hourEnd] = timeRange.split('-').map(t => {
          const [hour, minute] = t.split(':').map(n => parseInt(n, 10));
          return hour * 60 + (minute || 0); // Chuyển đổi thành phút
        });

        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        if (currentTimeInMinutes >= hourStart && currentTimeInMinutes <= hourEnd) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error parsing working hours:', error);
    return false;
  }
};

// Tạo model từ schema
const StoreContact = mongoose.model("StoreContact", storeContactSchema);

export default StoreContact;