/**
 * Phần cấu hình, mọi người không cần ận tâm về phần này, nó sẽ được cấu hình sẵn các db để moiij ngời làm
 */

import dotenv from "dotenv";
import path from "path";


dotenv.config({
  path: path.resolve(
    __dirname,
    `../../.env.${process.env.NODE_ENV || "development"}`
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
    host: string; // Địa chỉ Redis server
    port: number; // Port Redis 
    password: string; // Password để kết nối
  };

  // Cấu hình Neo4j
  neo4j: {
    uri: string; // URI kết nối Neo4j
    user: string; // Username 
    password: string; // Password Neo4j
  };

  // Cấu hình JWT (JSON Web Token)
  jwt: {
    secret: string; // Khóa bí mật để mã hóa token
    expiresIn: string; // Thời gian hết hạn access token 
    refreshSecret: string; // Khóa bí mật cho refresh token
    refreshExpiresIn: string; // Thời gian hết hạn refresh token
  };

  // Cấu hình CORS (cho phép frontend truy cập)
  cors: {
    origin: string; // URL của frontend (VD: http://localhost:3000)
  };

  // Cấu hình upload file
  upload: {
    maxFileSize: number; // Kích thước file tối đa (bytes)
    uploadPath: string; // Thư mục lưu file upload
  };
}

// =====================================================
// BƯỚC 3: TẠO OBJECT CONFIG
// =====================================================
// Đọc giá trị từ process.env và gán vào object config
// Nếu không có giá trị trong .env thì dùng giá trị mặc định (sau dấu ||)

export const config: Config = {
  // Môi trường: lấy từ NODE_ENV, mặc định là 'development'
  env: process.env.NODE_ENV || "development",

  // Port: chuyển string thành number, mặc định 5000
  port: parseInt(process.env.PORT || "5000", 10),

  // API version: mặc định 'v1'
  apiVersion: process.env.API_VERSION || "v1",

  // MongoDB configuration
  mongodb: {
    // Connection string từ MongoDB Atlas
    uri: process.env.MONGODB_URI || "",
  },

  // Redis configuration
  redis: {
    // Host Redis Cloud (VD: redis-12345.cloud.redislabs.com)
    host: process.env.REDIS_HOST || "localhost",

    // Port Redis (thường là 6379 local, hoặc custom trên cloud)
    port: parseInt(process.env.REDIS_PORT || "6379", 10),

    // Password Redis Cloud
    password: process.env.REDIS_PASSWORD || "",
  },

  // Neo4j configuration
  neo4j: {
    // URI Neo4j (VD: neo4j+s://xxxxx.databases.neo4j.io)
    uri: process.env.NEO4J_URI || "",

    // Username Neo4j (thường là 'neo4j')
    user: process.env.NEO4J_USER || "neo4j",

    // Password Neo4j
    password: process.env.NEO4J_PASSWORD || "",
  },

  // JWT configuration
  jwt: {
    // Secret key để mã hóa access token (phải đủ dài và phức tạp)
    secret: process.env.JWT_SECRET || "your-secret-key",

    // Thời gian hết hạn access token (7d = 7 ngày, 1h = 1 giờ)
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",

    // Secret key cho refresh token (khác với access token)
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",

    // Thời gian hết hạn refresh token (thường dài hơn access token)
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // CORS configuration
  cors: {
    // URL frontend được phép truy cập API
    // Development: http://localhost:3000
    // Production: https://yourdomain.com
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  // Upload configuration
  upload: {
    // Kích thước file tối đa: 5MB = 5 * 1024 * 1024 = 5242880 bytes
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),

    // Thư mục lưu file upload
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
  },
};

// =====================================================
// BƯỚC 4: KIỂM TRA CÁC BIẾN BẮT BUỘC
// =====================================================
// Danh sách các biến môi trường BẮT BUỘC phải có
const requiredEnvVars = [
  "MONGODB_URI", // Không có thì không kết nối được MongoDB
  "REDIS_HOST", // Không có thì không kết nối được Redis
  "NEO4J_URI", // Không có thì không kết nối được Neo4j
  "JWT_SECRET", // Không có thì không tạo được token
];

// Kiểm tra từng biến
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    // Hiển thị cảnh báo nếu thiếu biến
    console.warn(`⚠️  Thiếu biến môi trường: ${envVar}`);
    console.warn(`    Vui lòng thêm ${envVar} vào file .env.development`);
  }
}
