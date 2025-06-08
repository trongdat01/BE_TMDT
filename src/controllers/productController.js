import Product from '../models/Product.js';
import ProductCategory from '../models/ProductCategory.js';
import mongoose from 'mongoose';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';

// GET /products - Lấy danh sách sản phẩm (có phân trang, lọc theo danh mục, thương hiệu, giá...)
export const getAllProducts = handleAsync(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		sortBy = 'createdAt',
		sortOrder = 'desc',
		minPrice,
		maxPrice,
		brandId,
		categoryId,
		isActive,
		search
	} = req.query;

	// Xây dựng filter query
	const filter = {};

	// Lọc theo giá
	if (minPrice !== undefined || maxPrice !== undefined) {
		filter.price = {};
		if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
		if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
	}

	// Lọc theo thương hiệu
	if (brandId) {
		filter.brandId = brandId;
	}

	// Lọc theo trạng thái
	if (isActive !== undefined) {
		filter.isActive = isActive === 'true';
	} else {
		// Mặc định chỉ hiển thị sản phẩm đang kích hoạt
		filter.isActive = true;
	}

	// Tìm kiếm theo text
	if (search) {
		filter.$text = { $search: search };
	}

	// Xử lý trường hợp lọc theo danh mục
	let productIds = [];
	if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
		// Tìm tất cả sản phẩm thuộc danh mục này
		const productCategories = await ProductCategory.find({ categoryId });
		productIds = productCategories.map(pc => pc.productId);

		// Nếu không có sản phẩm nào thuộc danh mục này, trả về danh sách trống
		if (productIds.length === 0) {
			return res.status(200).json({
				success: true,
				count: 0,
				totalCount: 0,
				currentPage: Number(page),
				totalPages: 0,
				data: []
			});
		}

		// Thêm điều kiện filter theo danh sách productIds
		filter._id = { $in: productIds };
	}

	// Tính toán skip cho pagination
	const skip = (Number(page) - 1) * Number(limit);

	// Xác định cách sắp xếp
	const sort = {};
	sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

	// Đếm tổng số sản phẩm thỏa mãn filter
	const totalCount = await Product.countDocuments(filter);

	// Query sản phẩm với filter, sắp xếp và phân trang
	const products = await Product.find(filter)
		.populate('brandId', 'name slug')
		.sort(sort)
		.skip(skip)
		.limit(Number(limit));

	// Lấy danh mục cho mỗi sản phẩm
	const productsWithCategories = await Promise.all(
		products.map(async (product) => {
			const productCategories = await ProductCategory.find({ productId: product._id })
				.populate('categoryId', 'name slug');

			const productObj = product.toJSON();
			productObj.categories = productCategories.map(pc => pc.categoryId);
			return productObj;
		})
	);

	// Tính toán thông tin phân trang
	const totalPages = Math.ceil(totalCount / Number(limit));

	res.status(200).json({
		success: true,
		count: products.length,
		totalCount,
		currentPage: Number(page),
		totalPages,
		data: productsWithCategories
	});
});

// GET /products/{id} - Lấy thông tin chi tiết của một sản phẩm
export const getProductById = handleAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(createError(400, 'ID sản phẩm không hợp lệ'));
	}

	const product = await Product.findById(id)
		.populate('brandId', 'name slug');

	if (!product) {
		return next(createError(404, 'Không tìm thấy sản phẩm'));
	}

	// Lấy danh sách danh mục của sản phẩm
	const productCategories = await ProductCategory.find({ productId: id })
		.populate('categoryId', 'name slug');

	const result = product.toJSON();
	result.categories = productCategories.map(pc => pc.categoryId);

	res.status(200).json({
		success: true,
		data: result
	});
});

// GET /products/slug/{slug} - Lấy thông tin sản phẩm theo slug
export const getProductBySlug = handleAsync(async (req, res, next) => {
	const { slug } = req.params;

	if (!slug || typeof slug !== 'string') {
		return next(createError(400, 'Slug sản phẩm không hợp lệ'));
	}

	// Thêm log để debug
	console.log(`Finding product with slug: ${slug}`);

	let product;
	try {
		// Truy vấn sản phẩm với slug và đảm bảo sản phẩm đang active
		product = await Product.findOne({
			slug: slug.trim(), // đảm bảo loại bỏ khoảng trắng
			isActive: true
		}).populate('brandId', 'name slug');

		if (!product) {
			console.log(`Product with slug '${slug}' not found or not active`);
			return next(createError(404, 'Không tìm thấy sản phẩm'));
		}
	} catch (error) {
		console.error(`Error finding product by slug: ${error.message}`);
		return next(createError(500, `Lỗi khi tìm sản phẩm: ${error.message}`));
	}

	console.log(`Found product: ${product.name} (${product._id})`);

	try {
		// Lấy danh sách danh mục của sản phẩm
		const productCategories = await ProductCategory.find({ productId: product._id })
			.populate('categoryId', 'name slug');

		console.log(`Found ${productCategories.length} categories for product`);

		const result = product.toJSON();
		result.categories = productCategories.map(pc => pc.categoryId);

		res.status(200).json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error("Error retrieving product categories:", error);
		// Nếu có lỗi khi lấy danh mục, vẫn trả về sản phẩm nhưng không có danh mục
		const result = product.toJSON();
		result.categories = [];

		res.status(200).json({
			success: true,
			data: result,
			warning: "Không thể lấy thông tin danh mục của sản phẩm"
		});
	}
});

// POST /products - Tạo sản phẩm mới (admin/staff)
export const createProduct = handleAsync(async (req, res, next) => {
	const { categories, ...productData } = req.body;

	console.log("Request body:", req.body);
	console.log("Categories received:", categories);

	// Đảm bảo rằng nếu có brandId, nó phải là ObjectId hợp lệ
	if (productData.brandId) {
		if (!mongoose.Types.ObjectId.isValid(productData.brandId)) {
			return next(createError(400, 'ID thương hiệu không hợp lệ'));
		}
	} else {
		// Nếu brandId là chuỗi rỗng, đặt thành null
		productData.brandId = null;
	}

	// Kiểm tra nếu đã có SKU thì đảm bảo nó là duy nhất
	if (productData.sku) {
		const existingProduct = await Product.findOne({ sku: productData.sku });
		if (existingProduct) {
			return next(createError(400, 'SKU đã tồn tại trong hệ thống'));
		}
	}

	// Bắt đầu một session để đảm bảo tính toàn vẹn giao dịch
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Tạo sản phẩm mới
		const newProduct = new Product(productData);

		// Lưu sản phẩm vào cơ sở dữ liệu
		const savedProduct = await newProduct.save({ session });
		// Nếu có danh sách danh mục, tạo các liên kết
		if (categories && Array.isArray(categories) && categories.length > 0) {
			console.log("Categories array is valid with length:", categories.length);

			const productCategoryDocs = categories.map(categoryId => {
				// Kiểm tra ID danh mục có hợp lệ không
				if (!mongoose.Types.ObjectId.isValid(categoryId)) {
					console.log("Invalid category ID:", categoryId);
					throw new Error(`ID danh mục không hợp lệ: ${categoryId}`);
				}

				console.log("Valid category ID:", categoryId);
				return {
					productId: savedProduct._id,
					categoryId: categoryId
				};
			});

			// Lưu tất cả liên kết sản phẩm-danh mục
			console.log("Inserting product-category relationships:", productCategoryDocs);
			const insertedDocs = await ProductCategory.insertMany(productCategoryDocs, { session });
			console.log("Inserted documents:", insertedDocs);
		} else {
			console.log("No valid categories to process:", categories);
		}

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		// Lấy sản phẩm với thông tin danh mục
		const productWithCategories = await Product.findById(savedProduct._id)
			.populate('brandId', 'name slug');

		// Lấy danh sách danh mục của sản phẩm
		const productCategories = await ProductCategory.find({ productId: savedProduct._id })
			.populate('categoryId', 'name slug');

		const result = productWithCategories.toJSON();
		result.categories = productCategories.map(pc => pc.categoryId);

		res.status(201).json({
			success: true,
			data: result
		});
	} catch (error) {
		// Nếu có lỗi, rollback transaction
		await session.abortTransaction();
		session.endSession();
		return next(createError(400, `Lỗi khi tạo sản phẩm: ${error.message}`));
	}
});

// PUT /products/{id} - Cập nhật thông tin sản phẩm (admin/staff)
export const updateProduct = handleAsync(async (req, res, next) => {
	const { id } = req.params;
	const { categories, ...productData } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(createError(400, 'ID sản phẩm không hợp lệ'));
	}

	// Kiểm tra nếu brandId không hợp lệ
	if (productData.brandId && productData.brandId !== '' && !mongoose.Types.ObjectId.isValid(productData.brandId)) {
		return next(createError(400, 'ID thương hiệu không hợp lệ'));
	}

	// Nếu brandId là chuỗi rỗng, đặt thành null
	if (productData.brandId === '') {
		productData.brandId = null;
	}

	// Bắt đầu một session để đảm bảo tính toàn vẹn giao dịch
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Cập nhật và trả về sản phẩm đã được cập nhật
		const updatedProduct = await Product.findByIdAndUpdate(
			id,
			{ $set: productData },
			{ new: true, runValidators: true, session }
		);

		if (!updatedProduct) {
			await session.abortTransaction();
			session.endSession();
			return next(createError(404, 'Không tìm thấy sản phẩm'));
		}

		// Nếu có danh sách danh mục, cập nhật liên kết
		if (categories && Array.isArray(categories)) {
			// Xóa tất cả liên kết hiện tại
			await ProductCategory.deleteMany({ productId: id }, { session });

			if (categories.length > 0) {
				const productCategoryDocs = categories.map(categoryId => {
					// Kiểm tra ID danh mục có hợp lệ không
					if (!mongoose.Types.ObjectId.isValid(categoryId)) {
						throw new Error(`ID danh mục không hợp lệ: ${categoryId}`);
					}

					return {
						productId: id,
						categoryId: categoryId
					};
				});

				// Thêm liên kết mới
				await ProductCategory.insertMany(productCategoryDocs, { session });
			}
		}

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		// Lấy sản phẩm với thông tin danh mục
		const productWithCategories = await Product.findById(id)
			.populate('brandId', 'name slug');

		// Lấy danh sách danh mục của sản phẩm
		const productCategories = await ProductCategory.find({ productId: id })
			.populate('categoryId', 'name slug');

		const result = productWithCategories.toJSON();
		result.categories = productCategories.map(pc => pc.categoryId);

		res.status(200).json({
			success: true,
			data: result
		});
	} catch (error) {
		// Nếu có lỗi, rollback transaction
		await session.abortTransaction();
		session.endSession();
		return next(createError(400, `Lỗi khi cập nhật sản phẩm: ${error.message}`));
	}
});

// DELETE /products/{id} - Xóa vĩnh viễn sản phẩm (admin)
export const deleteProduct = handleAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(createError(400, 'ID sản phẩm không hợp lệ'));
	}

	// Bắt đầu một session để đảm bảo tính toàn vẹn giao dịch
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Xóa tất cả liên kết danh mục
		await ProductCategory.deleteMany({ productId: id }, { session });

		// Xóa sản phẩm
		const deletedProduct = await Product.findByIdAndDelete(id, { session });

		if (!deletedProduct) {
			await session.abortTransaction();
			session.endSession();
			return next(createError(404, 'Không tìm thấy sản phẩm'));
		}

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			success: true,
			message: 'Sản phẩm đã được xóa vĩnh viễn',
			data: deletedProduct
		});
	} catch (error) {
		// Nếu có lỗi, rollback transaction
		await session.abortTransaction();
		session.endSession();
		return next(createError(400, `Lỗi khi xóa sản phẩm: ${error.message}`));
	}
});

// DELETE /products/soft-delete/{id} - Xóa mềm sản phẩm (admin/staff)
export const softDeleteProduct = handleAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(createError(400, 'ID sản phẩm không hợp lệ'));
	}

	const product = await Product.findByIdAndUpdate(
		id,
		{ isActive: false },
		{ new: true }
	);

	if (!product) {
		return next(createError(404, 'Không tìm thấy sản phẩm'));
	}

	res.status(200).json({
		success: true,
		message: 'Sản phẩm đã được xóa mềm thành công',
		data: product
	});
});

// PATCH /products/restore/{id} - Khôi phục sản phẩm đã xóa mềm (admin)
export const restoreProduct = handleAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(createError(400, 'ID sản phẩm không hợp lệ'));
	}

	const product = await Product.findByIdAndUpdate(
		id,
		{ isActive: true },
		{ new: true }
	);

	if (!product) {
		return next(createError(404, 'Không tìm thấy sản phẩm'));
	}

	res.status(200).json({
		success: true,
		message: 'Sản phẩm đã được khôi phục thành công',
		data: product
	});
});

// GET /products/featured - Lấy danh sách sản phẩm nổi bật
export const getFeaturedProducts = handleAsync(async (req, res) => {
	const { limit = 10 } = req.query;

	// Sử dụng phương thức tĩnh đã định nghĩa trong model
	const featuredProducts = await Product.findFeatured(Number(limit));

	// Lấy danh mục cho mỗi sản phẩm
	const productsWithCategories = await Promise.all(
		featuredProducts.map(async (product) => {
			const productCategories = await ProductCategory.find({ productId: product._id })
				.populate('categoryId', 'name slug');

			const productObj = product.toJSON();
			productObj.categories = productCategories.map(pc => pc.categoryId);
			return productObj;
		})
	);

	res.status(200).json({
		success: true,
		count: productsWithCategories.length,
		data: productsWithCategories
	});
});

// GET /products/search - Tìm kiếm sản phẩm
export const searchProducts = handleAsync(async (req, res) => {
	const {
		q, // từ khóa tìm kiếm
		page = 1,
		limit = 10,
		sortBy = 'createdAt',
		sortOrder = 'desc'
	} = req.query;

	if (!q) {
		return res.status(200).json({
			success: true,
			count: 0,
			totalCount: 0,
			currentPage: Number(page),
			totalPages: 0,
			data: []
		});
	}

	// Sử dụng text search của MongoDB
	const filter = {
		$text: { $search: q },
		isActive: true // Chỉ tìm kiếm sản phẩm đang hoạt động
	};

	// Tính toán skip cho pagination
	const skip = (Number(page) - 1) * Number(limit);

	// Xác định cách sắp xếp
	const sort = {};

	if (q) {
		// Nếu có từ khóa tìm kiếm, sắp xếp theo điểm liên quan (textScore)
		sort.score = { $meta: "textScore" };
	} else {
		// Nếu không có từ khóa, sắp xếp theo trường thông thường
		sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
	}

	// Đếm tổng số sản phẩm thỏa mãn filter
	const totalCount = await Product.countDocuments(filter);

	// Truy vấn sản phẩm
	let products;

	if (q) {
		// Nếu có từ khóa tìm kiếm, thêm trường điểm liên quan
		products = await Product.find(filter, { score: { $meta: "textScore" } })
			.populate('brandId', 'name slug')
			.sort(sort)
			.skip(skip)
			.limit(Number(limit));
	} else {
		// Nếu không có từ khóa, truy vấn thông thường
		products = await Product.find(filter)
			.populate('brandId', 'name slug')
			.sort(sort)
			.skip(skip)
			.limit(Number(limit));
	}

	// Lấy danh mục cho mỗi sản phẩm
	const productsWithCategories = await Promise.all(
		products.map(async (product) => {
			const productCategories = await ProductCategory.find({ productId: product._id })
				.populate('categoryId', 'name slug');

			const productObj = product.toJSON();
			productObj.categories = productCategories.map(pc => pc.categoryId);
			return productObj;
		})
	);

	// Tính toán thông tin phân trang
	const totalPages = Math.ceil(totalCount / Number(limit));

	res.status(200).json({
		success: true,
		count: products.length,
		totalCount,
		currentPage: Number(page),
		totalPages,
		data: productsWithCategories
	});
});
