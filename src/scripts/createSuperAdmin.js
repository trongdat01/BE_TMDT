import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import connectDB from '../configs/db.js';

// Kết nối đến database
await connectDB();

const createSuperAdmin = async () => {
    try {
        // Kiểm tra xem đã có admin nào chưa
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin đã tồn tại trong hệ thống!');
            console.log('Email:', adminExists.email);
            console.log('Username:', adminExists.username);
            return;
        }

        // Tạo mật khẩu mã hóa
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt); // đổi mật khẩu này sau khi tạo xong

        // Tạo super admin
        const superAdmin = new User({
            username: 'superadmin',
            email: 'admin@example.com',
            passwordHash: hashedPassword,
            fullName: 'Super Administrator',
            phoneNumber: '0123456789',
            role: 'admin',
            isActive: true
        });

        await superAdmin.save();

        console.log('Đã tạo Super Admin thành công!');
        console.log('Username: superadmin');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('QUAN TRỌNG: Đổi mật khẩu này ngay sau khi đăng nhập lần đầu!');

    } catch (error) {
        console.error('Lỗi khi tạo Super Admin:', error.message);
    } finally {
        // Đóng kết nối database
        await mongoose.connection.close();
    }
};

// Chạy hàm tạo admin
createSuperAdmin();
