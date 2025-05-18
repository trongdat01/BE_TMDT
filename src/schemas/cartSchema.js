import Joi from 'joi';

export const addToCartSchema = Joi.object({
    productId: Joi.string().required(),
    variantId: Joi.string().allow(null, ''),
    quantity: Joi.number().integer().min(1).default(1),
    sessionId: Joi.string().allow(null, ''),
});

export const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
});

export const mergeCartSchema = Joi.object({
    sessionId: Joi.string().required(),
});
