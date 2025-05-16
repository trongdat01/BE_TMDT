/**
 * Middleware để xác thực request body theo schema
 * @param {Object} schema - Schema Joi để xác thực
 * @returns {Function} Middleware Express
 */
const validBodyRequest = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body);

	if (error) {
		return res.status(400).json({
			success: false,
			message: error.details[0].message
		});
	}

	req.body = value;
	next();
};

/**
 * Middleware để xác thực bất kỳ thuộc tính nào của request theo schema
 * @param {Object} schema - Schema Joi để xác thực
 * @param {String} property - Thuộc tính của request (body, query, params...)
 * @returns {Function} Middleware Express
 */
export const validateSchema = (schema, property = 'body') => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req[property], {
			abortEarly: false,
			stripUnknown: true,
			allowUnknown: true
		});

		if (error) {
			const errorMessage = error.details.map(detail => detail.message).join(', ');
			return res.status(400).json({
				success: false,
				message: errorMessage
			});
		}

		req[property] = value;
		next();
	};
};

export default validBodyRequest;
