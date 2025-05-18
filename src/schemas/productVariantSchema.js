import Joi from 'joi';

export const createProductVariantSchema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    price: Joi.number().min(0).required(),
    stockQuantity: Joi.number().integer().min(0).default(0),
    color: Joi.string().allow('', null),
    size: Joi.string().allow('', null),
    weight: Joi.number().min(0),
    isActive: Joi.boolean().default(true),
    imageUrl: Joi.string().allow('', null),
});

export const updateProductVariantSchema = Joi.object({
    name: Joi.string(),
    sku: Joi.string(),
    price: Joi.number().min(0),
    stockQuantity: Joi.number().integer().min(0),
    color: Joi.string().allow('', null),
    size: Joi.string().allow('', null),
    weight: Joi.number().min(0),
    isActive: Joi.boolean(),
    imageUrl: Joi.string().allow('', null),
});
