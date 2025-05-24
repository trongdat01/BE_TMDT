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

// errorResponse được loại bỏ vì trùng lặp với errorMessageHandler
// Sử dụng errorMessageHandler trong errorMessage.middleware.js thay thế
