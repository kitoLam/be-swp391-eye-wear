"use strict";
/**
 * Phần cấu hình, mọi người không cần ận tâm về phần này, nó sẽ được cấu hình sẵn các db để moiij ngời làm
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`),
});
// =====================================================
// BƯỚC 3: TẠO OBJECT CONFIG
// =====================================================
// Đọc giá trị từ process.env và gán vào object config
// Nếu không có giá trị trong .env thì dùng giá trị mặc định (sau dấu ||)
exports.config = {
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
    },
    // Neo4j configuration
    neo4j: {
        // URI Neo4j (VD: neo4j+s://xxxxx.databases.neo4j.io)
        uri: process.env.NEO4J_URI || '',
        // Username Neo4j (thường là 'neo4j')
        user: process.env.NEO4J_USER || 'neo4j',
        // Password Neo4j
        password: process.env.NEO4J_PASSWORD || '',
    },
    // JWT configuration
    jwt: {
        // Secret key để mã hóa access token (phải đủ dài và phức tạp)
        secret: process.env.JWT_SECRET || 'your-secret-key',
        // Thời gian hết hạn access token (7d = 7 ngày, 1h = 1 giờ)
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        // Secret key cho refresh token (khác với access token)
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        // Thời gian hết hạn refresh token (thường dài hơn access token)
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    // CORS configuration
    cors: {
        // URL frontend được phép truy cập API
        // Development: http://localhost:3000
        // Production: https://yourdomain.com
        origin: [process.env.FE_CLIENT_DOMAIN || '', process.env.FE_ADMIN_DOMAIN || ''],
    },
    cloudinary: {
        api_key: process.env.CLOUD_API_KEY || "",
        secret_key: process.env.CLOUD_SECRET_KEY || "",
        cloud_name: process.env.CLOUD_NAME || "",
    }
};
// =====================================================
// BƯỚC 4: KIỂM TRA CÁC BIẾN BẮT BUỘC
// =====================================================
// Danh sách các biến môi trường BẮT BUỘC phải có
const requiredEnvVars = [
    'MONGODB_URI', // Không có thì không kết nối được MongoDB
    'REDIS_URL', // Không có thì không kết nối được Redis
    'NEO4J_URI', // Không có thì không kết nối được Neo4j
    'JWT_SECRET', // Không có thì không tạo được token
];
// Kiểm tra từng biến
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        // Hiển thị cảnh báo nếu thiếu biến
        console.warn(`>>>  Thiếu biến môi trường: ${envVar}`);
        console.warn(`>>>  Vui lòng thêm ${envVar} vào file .env.development`);
    }
}
