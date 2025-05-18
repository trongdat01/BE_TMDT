import mongoose from "mongoose";

/**
 * CartItem model - Sản phẩm trong giỏ hàng
 */
const cartItemSchema = new mongoose.Schema(
    {
        cartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cart",
            required: true,
            index: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            default: null
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { timestamps: true }
);

// Tạo index cho các trường quan trọng để tối ưu truy vấn
cartItemSchema.index({ cartId: 1, productId: 1, variantId: 1 });

// Virtual field để tính thành tiền (price * quantity)
cartItemSchema.virtual('subTotal').get(function () {
    return this.price * this.quantity;
});

// Đảm bảo virtual fields được trả về khi JSON
cartItemSchema.set('toJSON', { virtuals: true });
cartItemSchema.set('toObject', { virtuals: true });

// Phương thức để cập nhật số lượng
cartItemSchema.methods.updateQuantity = async function (newQuantity) {
    if (newQuantity < 1) {
        throw new Error('Số lượng sản phẩm phải lớn hơn 0');
    }

    this.quantity = newQuantity;
    return this.save();
};

// Static method để tìm sản phẩm trong giỏ hàng theo productId và variantId
cartItemSchema.statics.findCartItem = async function (cartId, productId, variantId = null) {
    return this.findOne({
        cartId,
        productId,
        ...(variantId ? { variantId } : { variantId: null })
    });
};

// Hook trước khi lưu để cập nhật giỏ hàng
cartItemSchema.pre('save', async function (next) {
    try {
        // Nếu đây là một bản ghi mới hoặc số lượng đã thay đổi
        if (this.isNew || this.isModified('quantity') || this.isModified('price')) {
            const Cart = mongoose.model('Cart');
            const cart = await Cart.findById(this.cartId);
            if (cart) {
                await cart.calculateSubtotal();
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Hook sau khi xóa để cập nhật giỏ hàng
cartItemSchema.post('remove', async function (doc, next) {
    try {
        const Cart = mongoose.model('Cart');
        const cart = await Cart.findById(doc.cartId);
        if (cart) {
            await cart.calculateSubtotal();
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Hook sau khi xóa nhiều bản ghi
cartItemSchema.post('deleteMany', async function (result, next) {
    try {
        // Lưu ý: deletedCount > 0 nghĩa là có bản ghi đã được xóa
        if (result.deletedCount > 0 && this._conditions.cartId) {
            const Cart = mongoose.model('Cart');
            const cart = await Cart.findById(this._conditions.cartId);
            if (cart) {
                await cart.calculateSubtotal();
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;