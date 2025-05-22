export const successResponse = (req, res, next) => {
    res.success = (data = {}, message = 'Thành công', status = 200) => {
        return res.status(status).json({
            success: true,
            message,
            data
        });
    };
    if (req.data) {
        const { message = 'Thành công', ...data } = req.data;
        res.status(res.statusCode !== 200 ? res.statusCode : 200).json({
            success: true,
            message,
            ...data
        });
        return;
    }
    next();
};

export const errorResponse = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.statusCode || 500;
    const message = err.message || 'Lỗi máy chủ';
    res.status(status).json({
        success: false,
        message
    });
};
