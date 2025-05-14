import mongoose from "mongoose";

/**
 * Location model - Quản lý địa điểm phân cấp (tỉnh/thành phố, quận/huyện, phường/xã)
 */
const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["city", "district", "ward"],
      required: true,
      description: "Phân loại địa phương: tỉnh/thành phố, quận/huyện, phường/xã"
    },
    level: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      description: "Cấp độ địa lý: 1=city, 2=district, 3=ward"
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      description: "ID của địa phương cấp trên trực tiếp"
    },
    code: {
      type: String,
      trim: true,
      description: "Mã hành chính địa phương"
    },
    status: {
      type: Boolean,
      default: true,
      description: "Trạng thái sử dụng của địa phương"
    }
  },
  { timestamps: true }
);

// Tạo index cho các trường quan trọng
locationSchema.index({ type: 1, name: 1, parentId: 1 }, { unique: true });
locationSchema.index({ parentId: 1 });
locationSchema.index({ type: 1 });
locationSchema.index({ level: 1 });
locationSchema.index({ code: 1 });
locationSchema.index({ status: 1 });

// Đảm bảo virtual fields được trả về khi JSON
locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

// Virtual fields để lấy số lượng địa phương con
locationSchema.virtual('childrenCount').get(function () {
  return this._childrenCount || 0;
});

// Virtual cho tên đầy đủ phân cấp
locationSchema.virtual('fullName').get(function () {
  return this._fullName || this.name;
});

// Phương thức instance để lấy danh sách địa phương con trực tiếp
locationSchema.methods.getChildren = async function () {
  return this.constructor.find({
    parentId: this._id,
    status: true
  }).sort({ name: 1 });
};

// Phương thức instance để lấy đường dẫn phân cấp
locationSchema.methods.getPath = async function () {
  if (this._path) {
    return this._path;
  }

  const path = [{ id: this._id, name: this.name, type: this.type, level: this.level }];
  let currentLocation = this;

  while (currentLocation.parentId) {
    const parent = await this.constructor.findById(currentLocation.parentId);
    if (!parent) break;
    path.unshift({ id: parent._id, name: parent.name, type: parent.type, level: parent.level });
    currentLocation = parent;
  }

  this._path = path;
  return path;
};

// Phương thức instance để lấy tên đầy đủ phân cấp
locationSchema.methods.getFullName = async function (separator = ", ") {
  const path = await this.getPath();
  return path.map(item => item.name).join(separator);
};

// Phương thức tĩnh để lấy các địa phương cấp cao nhất (cities)
locationSchema.statics.getCities = function () {
  return this.find({
    type: "city",
    level: 1,
    status: true
  }).sort({ name: 1 });
};

// Phương thức tĩnh để lấy quận/huyện theo thành phố
locationSchema.statics.getDistrictsByCity = function (cityId) {
  return this.find({
    parentId: cityId,
    type: "district",
    level: 2,
    status: true
  }).sort({ name: 1 });
};

// Phương thức tĩnh để lấy phường/xã theo quận/huyện
locationSchema.statics.getWardsByDistrict = function (districtId) {
  return this.find({
    parentId: districtId,
    type: "ward",
    level: 3,
    status: true
  }).sort({ name: 1 });
};

// Phương thức tĩnh để tìm kiếm địa điểm theo tên
locationSchema.statics.searchByName = function (name, types = null) {
  const query = {
    name: new RegExp(name, 'i'),
    status: true
  };

  if (types && Array.isArray(types) && types.length) {
    query.type = { $in: types };
  }

  return this.find(query).limit(20);
};

// Phương thức tĩnh để lấy cây phân cấp đầy đủ từ một địa điểm
locationSchema.statics.getLocationTree = async function (rootId = null) {
  const query = rootId ? { _id: rootId } : { level: 1, status: true };
  const roots = await this.find(query);

  for (const root of roots) {
    await this._populateChildren(root);
  }

  return roots;
};

// Phương thức đệ quy hỗ trợ để lấy cây phân cấp
locationSchema.statics._populateChildren = async function (location) {
  const children = await this.find({ parentId: location._id, status: true });

  if (children.length > 0) {
    location._doc.children = children;
    location._childrenCount = children.length;

    for (const child of children) {
      await this._populateChildren(child);
    }
  } else {
    location._childrenCount = 0;
  }
};

// Phương thức tĩnh để lấy đường dẫn phân cấp từ mã hành chính
locationSchema.statics.getLocationsByAddress = async function (city, district = null, ward = null) {
  const result = {};

  // Tìm thành phố
  result.city = await this.findOne({
    name: new RegExp(`^${city}$`, 'i'),
    type: 'city',
    status: true
  });

  if (result.city && district) {
    // Tìm quận/huyện
    result.district = await this.findOne({
      name: new RegExp(`^${district}$`, 'i'),
      parentId: result.city._id,
      type: 'district',
      status: true
    });

    if (result.district && ward) {
      // Tìm phường/xã
      result.ward = await this.findOne({
        name: new RegExp(`^${ward}$`, 'i'),
        parentId: result.district._id,
        type: 'ward',
        status: true
      });
    }
  }

  return result;
};

// Phương thức tĩnh để xác thực tính hợp lệ của một địa chỉ
locationSchema.statics.validateAddress = async function (cityId, districtId, wardId) {
  // Kiểm tra phường/xã hợp lệ
  const ward = await this.findOne({
    _id: wardId,
    type: 'ward',
    status: true
  });

  if (!ward) return false;

  // Kiểm tra quận/huyện hợp lệ và là parent của phường/xã
  const district = await this.findOne({
    _id: districtId,
    type: 'district',
    status: true
  });

  if (!district || !ward.parentId.equals(district._id)) return false;

  // Kiểm tra thành phố hợp lệ và là parent của quận/huyện
  const city = await this.findOne({
    _id: cityId,
    type: 'city',
    status: true
  });

  if (!city || !district.parentId.equals(city._id)) return false;

  return true;
};

// Phương thức tĩnh để import dữ liệu từ file JSON
locationSchema.statics.importFromJson = async function (jsonData) {
  const cities = jsonData.filter(item => item.level === 1);
  const importResults = {
    created: 0,
    errors: 0
  };

  for (const city of cities) {
    try {
      // Tạo hoặc cập nhật thành phố
      const cityDoc = await this.findOneAndUpdate(
        { name: city.name, type: 'city' },
        {
          name: city.name,
          type: 'city',
          level: 1,
          code: city.code,
          status: true
        },
        { upsert: true, new: true }
      );
      importResults.created++;

      // Xử lý các quận/huyện
      if (city.districts && Array.isArray(city.districts)) {
        for (const district of city.districts) {
          try {
            // Tạo hoặc cập nhật quận/huyện
            const districtDoc = await this.findOneAndUpdate(
              { name: district.name, type: 'district', parentId: cityDoc._id },
              {
                name: district.name,
                type: 'district',
                level: 2,
                parentId: cityDoc._id,
                code: district.code,
                status: true
              },
              { upsert: true, new: true }
            );
            importResults.created++;

            // Xử lý các phường/xã
            if (district.wards && Array.isArray(district.wards)) {
              for (const ward of district.wards) {
                try {
                  await this.findOneAndUpdate(
                    { name: ward.name, type: 'ward', parentId: districtDoc._id },
                    {
                      name: ward.name,
                      type: 'ward',
                      level: 3,
                      parentId: districtDoc._id,
                      code: ward.code,
                      status: true
                    },
                    { upsert: true, new: true }
                  );
                  importResults.created++;
                } catch (error) {
                  importResults.errors++;
                  console.error(`Lỗi khi import phường/xã ${ward.name}:`, error);
                }
              }
            }
          } catch (error) {
            importResults.errors++;
            console.error(`Lỗi khi import quận/huyện ${district.name}:`, error);
          }
        }
      }
    } catch (error) {
      importResults.errors++;
      console.error(`Lỗi khi import thành phố ${city.name}:`, error);
    }
  }

  return importResults;
};

// Tạo model từ schema
const Location = mongoose.model("Location", locationSchema);

export default Location;