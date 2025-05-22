const errorMessageHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err && err.statusCode && err.message) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }
    if (err && err.isJoi) {
        return res.status(400).json({
            success: false,
            message: err.details?.map(d => d.message).join(', ') || 'Dữ liệu không hợp lệ'
        });
    }
    return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ'
    });
};

export default errorMessageHandler;
