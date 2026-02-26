/**
 * Phần cấu hình, mọi người không cần ận tâm về phần này, nó sẽ được cấu hình sẵn các db để moiij ngời làm
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.resolve(
        __dirname,
        `../../.env.${process.env.NODE_ENV || 'development'}`
    ),
});

// =====================================================
// BƯỚC 2: ĐỊNH NGHĨA KIỂU DỮ LIỆU (TypeScript Interface)
// =====================================================
// Interface này giúp TypeScript biết config có những thuộc tính gì
// và kiểu dữ liệu của từng thuộc tính
interface Config {
    // Môi trường: development, production, test
    env: string;

    // Port server chạy (mặc định 5000)
    port: number;

    // Phiên bản API (v1, v2, ...)
    apiVersion: string;

    // Cấu hình MongoDB
    mongodb: {
        uri: string; // Connection string của MongoDB Atlas
    };

    // Cấu hình Redis
    redis: {
        url: string; // URL Redis Cloud
        bullMQ_URL: string;
    };

    // Cấu hình JWT (JSON Web Token)
    jwt: {
        secret: string; // Khóa bí mật để mã hóa token
        expiresIn: string; // Thời gian hết hạn access token
        expiresInSecond: number; // Thời gian hết hạn của access token tính theo dây
        refreshSecret: string; // Khóa bí mật cho refresh token
        refreshExpiresIn: string; // Thời gian hết hạn refresh token
        refreshExpiresInSecond: number; // Thời gian hết hạn của refresh token tính theo dây
    };

    // Cấu hình CORS (cho phép frontend truy cập)
    cors: {
        origin: string[]; // URL của frontend (VD: http://localhost:3000)
    };

    cloudinary: {
        cloud_name: string;
        secret_key: string;
        api_key: string;
    };

    supabase: {
        url: string;
        key: string;
    };

    mail: {
        sender: string;
        pass: string;
    },

    otp: {
        waitingMinute: number;
    },

    shipment: {
        createApi: string;
    },

    googleOAuth20: {
        client_id: string,
        client_secret: string,
        callback_url: string,
    }
}

// =====================================================
// BƯỚC 3: TẠO OBJECT CONFIG
// =====================================================
// Đọc giá trị từ process.env và gán vào object config
// Nếu không có giá trị trong .env thì dùng giá trị mặc định (sau dấu ||)

export const config: Config = {
    // Môi trường: lấy từ NODE_ENV, mặc định là 'development'
    env: process.env.NODE_ENV || 'development',

    // Port: chuyển string thành number, mặc định 5000
    port: parseInt(process.env.PORT || '5000', 10),

    // API version: mặc định 'v1'
    apiVersion: process.env.API_VERSION || 'v1',

    // MongoDB configuration
    mongodb: {
        // Connection string từ MongoDB Atlas
        uri: process.env.MONGODB_URI || '',
    },

    // Redis configuration
    redis: {
        url: process.env.REDIS_URL || '',
        bullMQ_URL: process.env.REDIS_FOR_BULLMQ_URL || '',
    },

    // JWT configuration
    jwt: {
        // Secret key để mã hóa access token (phải đủ dài và phức tạp)
        secret: process.env.JWT_SECRET || 'your-secret-key',
        // Thời gian hết hạn access token (7d = 7 ngày, 1h = 1 giờ)
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        expiresInSecond: process.env.JWT_EXPIRES_IN_SECOND
            ? Number(process.env.JWT_EXPIRES_IN_SECOND)
            : 600,
        // Secret key cho refresh token (khác với access token)
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        // Thời gian hết hạn refresh token (thường dài hơn access token)
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        refreshExpiresInSecond: process.env.JWT_REFRESH_EXPIRES_IN_SECOND
            ? Number(process.env.JWT_REFRESH_EXPIRES_IN_SECOND)
            : 2592000,
    },

    // CORS configuration
    cors: {
        // URL frontend được phép truy cập API
        // Development: http://localhost:3000
        // Production: https://yourdomain.com
        origin: [
            process.env.FE_CLIENT_DOMAIN || '',
            process.env.FE_ADMIN_DOMAIN || '',
        ],
    },

    cloudinary: {
        api_key: process.env.CLOUD_API_KEY || '',
        secret_key: process.env.CLOUD_SECRET_KEY || '',
        cloud_name: process.env.CLOUD_NAME || '',
    },

    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
    },

    mail: {
        pass: process.env.MAIL_PASS || '',
        sender: process.env.MAIL_SENDER || '',
    },

    otp: {
        waitingMinute: process.env.OTP_WAITING_MINUTE
            ? Number(process.env.OTP_WAITING_MINUTE)
            : 5
    },
    shipment: {
        createApi: process.env.SHIPMENT_CREATE_API || ''
    },

    googleOAuth20: {
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        callback_url: process.env.GOOGLE_CALLBACK_URL || '',
    }
};

// =====================================================
// BƯỚC 4: KIỂM TRA CÁC BIẾN BẮT BUỘC
// =====================================================
// Danh sách các biến môi trường BẮT BUỘC phải có
const requiredEnvVars = [
    'MONGODB_URI', // Không có thì không kết nối được MongoDB
    'REDIS_URL', // Không có thì không kết nối được Redis
    'JWT_SECRET', // Không có thì không tạo được token
    'SUPABASE_URL',
    'SUPABASE_KEY',
];

// Kiểm tra từng biến
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        // Hiển thị cảnh báo nếu thiếu biến
        console.warn(`>>>  Thiếu biến môi trường: ${envVar}`);
        console.warn(`>>>  Vui lòng thêm ${envVar} vào file .env.development`);
    }
}
