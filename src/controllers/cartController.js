import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import ProductVariant from '../models/ProductVariant.js';
import handleAsync from '../utils/handleAsync.js';
import createError from '../utils/createError.js';

// Lấy giỏ hàng
export const getCart = handleAsync(async (req, res, next) => {
    let cart;
    if (req.user) {
        cart = await Cart.findOrCreateByUser(req.user.id);
    } else if (req.body.sessionId || req.query.sessionId) {
        const sessionId = req.body.sessionId || req.query.sessionId;
        cart = await Cart.findOrCreateBySession(sessionId);
    } else {
        return next(createError(400, 'Cần cung cấp sessionId khi chưa đăng nhập'));
    }
    await cart.populate({
        path: 'items',
        populate: [
            { path: 'productId', select: 'name price slug images' },
            { path: 'variantId', select: 'name price stockQuantity' }
        ]
    });
    res.json(cart);
});

// Thêm sản phẩm vào giỏ hàng
export const addToCart = handleAsync(async (req, res, next) => {
    const { productId, variantId, quantity, sessionId } = req.body;
    let cart;
    if (req.user) {
        cart = await Cart.findOrCreateByUser(req.user.id);
    } else if (sessionId) {
        cart = await Cart.findOrCreateBySession(sessionId);
    } else {
        return next(createError(400, 'Cần cung cấp sessionId khi chưa đăng nhập'));
    }

    // Kiểm tra tồn kho nếu có variant
    let price = 0;
    if (variantId) {
        const variant = await ProductVariant.findById(variantId);
        if (!variant || variant.stockQuantity < quantity) {
            return next(createError(400, 'Sản phẩm không đủ tồn kho'));
        }
        price = variant.price;
    } else {
        // Nếu không có variant, lấy giá từ product (bổ sung nếu cần)
    }

    let cartItem = await CartItem.findCartItem(cart._id, productId, variantId);
    if (cartItem) {
        cartItem.quantity += quantity;
        await cartItem.save();
    } else {
        cartItem = await CartItem.create({
            cartId: cart._id,
            productId,
            variantId: variantId || null,
            quantity,
            price
        });
    }
    await cart.calculateSubtotal();
    res.status(201).json(cartItem);
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = handleAsync(async (req, res, next) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cartItem = await CartItem.findById(itemId);
    if (!cartItem) return next(createError(404, 'Không tìm thấy sản phẩm trong giỏ hàng'));
    await cartItem.updateQuantity(quantity);
    res.json(cartItem);
});

// Xóa sản phẩm khỏi giỏ hàng
export const removeCartItem = handleAsync(async (req, res, next) => {
    const { itemId } = req.params;
    const cartItem = await CartItem.findById(itemId);
    if (!cartItem) return next(createError(404, 'Không tìm thấy sản phẩm trong giỏ hàng'));
    await cartItem.remove();
    res.json({ success: true });
});

// Xóa toàn bộ giỏ hàng
export const clearCart = handleAsync(async (req, res, next) => {
    let cart;
    if (req.user) {
        cart = await Cart.findOrCreateByUser(req.user.id);
    } else if (req.body.sessionId || req.query.sessionId) {
        const sessionId = req.body.sessionId || req.query.sessionId;
        cart = await Cart.findOrCreateBySession(sessionId);
    } else {
        return next(createError(400, 'Cần cung cấp sessionId khi chưa đăng nhập'));
    }
    await cart.clearCart();
    res.json({ success: true });
});

// Gộp giỏ hàng guest vào user khi đăng nhập
export const mergeCart = handleAsync(async (req, res, next) => {
    const { sessionId } = req.body;
    if (!req.user) return next(createError(401, 'Yêu cầu đăng nhập'));
    const mergedCart = await Cart.mergeSessionCart(sessionId, req.user.id);
    res.json(mergedCart);
});
