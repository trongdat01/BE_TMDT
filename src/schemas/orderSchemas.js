import Joi from 'joi';

// Schema validate cho tạo đơn hàng mới
export const createOrderSchema = Joi.object({
  address: Joi.string().required(),
  phone: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  note: Joi.string().allow('', null),
  paymentMethod: Joi.string().valid('cod', 'banking').required()
});

// Schema validate cho cập nhật trạng thái đơn hàng
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipping', 'completed', 'cancelled').required(),
  paymentStatus: Joi.string().valid('unpaid', 'paid', 'refunded').optional()
});

// Schema validate cho hủy đơn hàng
export const cancelOrderSchema = Joi.object({
  reason: Joi.string().allow('', null)
});

export default {
    createOrderSchema,
    updateOrderStatusSchema,
    cancelOrderSchema
};