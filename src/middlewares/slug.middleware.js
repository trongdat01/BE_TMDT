import slugify from "slugify";

const slugMiddleware = (sourceField, targetField, unique = false) => {
	return function (schema) {
		// Thêm middleware pre-validate để đảm bảo slug được tạo trước khi validate
		schema.pre("validate", function (next) {
			if (!this[targetField] && this[sourceField]) {
				let slug = "";
				if (unique === true) {
					slug = slugify(`${this[sourceField]}-${this._id || new Date().getTime()}`, { lower: true, strict: true, locale: "vi" });
				} else {
					slug = slugify(`${this[sourceField]}`, { lower: true, strict: true, locale: "vi" });
				}
				this[targetField] = slug;
			}
			next();
		});

		// Giữ middleware pre-save để đảm bảo
		schema.pre("save", function (next) {
			if (!this[targetField] && this[sourceField]) {
				let slug = "";
				if (unique === true) {
					slug = slugify(`${this[sourceField]}-${this._id}`, { lower: true, strict: true, locale: "vi" });
				} else {
					slug = slugify(`${this[sourceField]}`, { lower: true, strict: true, locale: "vi" });
				}
				this[targetField] = slug;
			}
			next();
		});
	};
};

export default slugMiddleware;
