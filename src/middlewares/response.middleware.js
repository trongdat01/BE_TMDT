export const successResponse = (req, res, next) => {
    // Thêm hàm success vào đối tượng res để controllers có thể gọi res.success()
    res.success = (data = {}, message = 'Thành công', status = 200) => {
        return res.status(status).json({
            success: true,
            message,
            data
        });
    };

    // Xử lý trường hợp controller đã set req.data (dành cho backward compatibility)
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
