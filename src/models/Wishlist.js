import mongoose from "mongoose";

/**
 * Wishlist model - Danh sách yêu thích của người dùng
 */
const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant"
        }
    },
    { timestamps: true }
);

// Tạo index cho các trường quan trọng
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ productId: 1 });
// Đảm bảo mỗi người dùng không thêm trùng sản phẩm vào wishlist
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Middleware pre-find để tự động populate thông tin sản phẩm và biến thể
wishlistSchema.pre('find', function () {
    this.populate('productId', 'name slug price salePrice images primaryImage');
    this.populate('variantId', 'name color size imageUrl price');
});

wishlistSchema.pre('findOne', function () {
    this.populate('productId', 'name slug price salePrice images primaryImage');
    this.populate('variantId', 'name color size imageUrl price');
});

// Phương thức tĩnh để thêm sản phẩm vào danh sách yêu thích
wishlistSchema.statics.addToWishlist = async function (userId, productId, variantId = null) {
    try {
        // Kiểm tra sản phẩm tồn tại
        const Product = mongoose.model('Product');
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            throw new Error('Sản phẩm không tồn tại hoặc không khả dụng');
        }

        // Kiểm tra biến thể tồn tại nếu có
        if (variantId) {
            const ProductVariant = mongoose.model('ProductVariant');
            const variant = await ProductVariant.findById(variantId);

            if (!variant || !variant.isActive) {
                throw new Error('Biến thể sản phẩm không tồn tại hoặc không khả dụng');
            }
        }

        // Tạo hoặc cập nhật wishlist item
        const wishlistItem = await this.findOneAndUpdate(
            { userId, productId },
            { userId, productId, variantId },
            { upsert: true, new: true }
        );

        return wishlistItem;
    } catch (error) {
        // Xử lý lỗi trùng lặp index
        if (error.code === 11000) {
            throw new Error('Sản phẩm đã tồn tại trong danh sách yêu thích');
        }
        throw error;
    }
};

// Phương thức tĩnh để xóa sản phẩm khỏi danh sách yêu thích
wishlistSchema.statics.removeFromWishlist = async function (userId, productId) {
    const result = await this.deleteOne({ userId, productId });

    if (result.deletedCount === 0) {
        throw new Error('Sản phẩm không tồn tại trong danh sách yêu thích');
    }

    return result;
};

// Phương thức tĩnh để lấy danh sách yêu thích của người dùng
wishlistSchema.statics.getWishlistByUser = async function (userId) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .populate('productId', 'name slug price salePrice images primaryImage isActive')
        .populate('variantId', 'name color size imageUrl price isActive');
};

// Phương thức tĩnh để kiểm tra sản phẩm có trong danh sách yêu thích không
wishlistSchema.statics.isProductInWishlist = async function (userId, productId) {
    const item = await this.findOne({ userId, productId });
    return !!item;
};

// Phương thức tĩnh để đếm số lượng sản phẩm trong danh sách yêu thích
wishlistSchema.statics.countWishlistItems = async function (userId) {
    return this.countDocuments({ userId });
};

// Phương thức tĩnh để chuyển toàn bộ wishlist sang giỏ hàng
wishlistSchema.statics.moveAllToCart = async function (userId) {
    const wishlistItems = await this.find({ userId })
        .populate('productId', 'price')
        .populate('variantId', 'price');

    if (wishlistItems.length === 0) {
        throw new Error('Danh sách yêu thích trống');
    }

    const Cart = mongoose.model('Cart');
    const CartItem = mongoose.model('CartItem');

    // Tìm hoặc tạo giỏ hàng cho người dùng
    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({ userId });
    }

    // Thêm từng sản phẩm vào giỏ hàng
    const results = [];

    for (const item of wishlistItems) {
        const product = item.productId;
        const variant = item.variantId;

        // Kiểm tra sản phẩm còn hoạt động không
        if (!product.isActive) continue;
        if (variant && !variant.isActive) continue;

        // Lấy giá phù hợp
        const price = variant ? variant.price : (product.salePrice || product.price);

        try {
            const cartItem = await CartItem.addItem(
                cart._id,
                product._id,
                variant?._id,
                1,
                price
            );
            results.push(cartItem);
        } catch (error) {
            console.error(`Không thể thêm sản phẩm ${product.name} vào giỏ hàng: ${error.message}`);
        }
    }

    // Cập nhật tổng tiền giỏ hàng
    await cart.calculateSubtotal();

    return {
        cart,
        addedItems: results.length,
        totalItems: wishlistItems.length
    };
};

// Tạo model Wishlist từ schema
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;