import mongoose from "mongoose";

/**
 * Cart model - Giỏ hàng người dùng
 */
const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            sparse: true // Cho phép null nhưng nếu có giá trị thì phải duy nhất
        },
        sessionId: {
            type: String,
            trim: true,
            sparse: true // Cho phép null nhưng nếu có giá trị thì phải duy nhất
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },
        shippingCost: {
            type: Number,
            default: 20000,
            min: 0
        }
    },
    { timestamps: true }
);

// Tạo index cho các trường quan trọng - Tạm thời comment lại để loại bỏ duplicate
// cartSchema.index({ userId: 1 });
// cartSchema.index({ sessionId: 1 });

// Virtual field cho tổng tiền (subtotal + shippingCost)
cartSchema.virtual('totalAmount').get(function () {
    return this.subtotal + this.shippingCost;
});

// Virtual field cho số lượng sản phẩm trong giỏ hàng
cartSchema.virtual('itemCount').get(function () {
    return this._itemCount || 0;
});

// Đảm bảo virtual fields được trả về khi JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Middleware pre-find để tự động nối với CartItem
cartSchema.pre('findOne', function () {
    this.populate({
        path: 'items',
        options: { sort: { createdAt: -1 } }
    });
});

// Thiết lập virtual để lấy các items trong giỏ hàng
cartSchema.virtual('items', {
    ref: 'CartItem',
    localField: '_id',
    foreignField: 'cartId'
});

// Phương thức để tính toán lại tổng tiền
cartSchema.methods.calculateSubtotal = async function () {
    const CartItem = mongoose.model('CartItem');
    const cartItems = await CartItem.find({ cartId: this._id });

    let subtotal = 0;
    for (const item of cartItems) {
        subtotal += item.price * item.quantity;
    }

    this.subtotal = subtotal;
    this._itemCount = cartItems.length;

    return this.save();
};

// Phương thức để kiểm tra giỏ hàng có trống không
cartSchema.methods.isEmpty = async function () {
    const CartItem = mongoose.model('CartItem');
    const count = await CartItem.countDocuments({ cartId: this._id });
    return count === 0;
};

// Phương thức để xóa tất cả items trong giỏ hàng
cartSchema.methods.clearCart = async function () {
    const CartItem = mongoose.model('CartItem');
    await CartItem.deleteMany({ cartId: this._id });

    this.subtotal = 0;
    return this.save();
};

// Phương thức tĩnh để tìm hoặc tạo giỏ hàng dựa vào người dùng
cartSchema.statics.findOrCreateByUser = async function (userId) {
    try {
        let cart = await this.findOne({ userId });

        if (!cart) {
            cart = await this.create({ userId, subtotal: 0 });
        }

        return cart;
    } catch (error) {
        throw error;
    }
};

// Phương thức tĩnh để tìm hoặc tạo giỏ hàng dựa vào session
cartSchema.statics.findOrCreateBySession = async function (sessionId) {
    try {
        let cart = await this.findOne({ sessionId });

        if (!cart) {
            cart = await this.create({ sessionId, subtotal: 0 });
        }

        return cart;
    } catch (error) {
        throw error;
    }
};

// Phương thức để chuyển giỏ hàng từ session sang user khi đăng nhập
cartSchema.statics.mergeSessionCart = async function (sessionId, userId) {
    const CartItem = mongoose.model('CartItem');

    // Tìm giỏ hàng của session
    const sessionCart = await this.findOne({ sessionId });
    if (!sessionCart) return null;

    // Tìm hoặc tạo giỏ hàng của user
    let userCart = await this.findOne({ userId });
    if (!userCart) {
        userCart = await this.create({ userId, subtotal: 0 });
    }

    // Chuyển tất cả items từ session cart sang user cart
    await CartItem.updateMany(
        { cartId: sessionCart._id },
        { $set: { cartId: userCart._id } }
    );

    // Tính lại tổng tiền cho giỏ hàng người dùng
    await userCart.calculateSubtotal();

    // Xóa giỏ hàng session cũ
    await this.deleteOne({ _id: sessionCart._id });

    return userCart;
};

// Tạo model Cart từ schema
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;