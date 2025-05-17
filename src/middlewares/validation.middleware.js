/**
 * Middleware to validate request data against a Joi schema
 * Can validate any property of the request (body, query, params)
 */
export const validateRequest = (schema, property = 'body') => {
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
