const validBodyRequest = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body);
	if (error) {
		return next(error);
	}
	req.body = value;
	next();
};

export const validateSchema = (schema, property = 'body') => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req[property], {
			abortEarly: false,
			stripUnknown: true,
			allowUnknown: true
		});
		if (error) {
			return next(error);
		}
		req[property] = value;
		next();
	};
};

export default validBodyRequest;
