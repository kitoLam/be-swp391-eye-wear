import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from './config/env.config';
import { errorMiddleware } from './middlewares/share/error.middleware';
import adminRouter from './routes/admin/index.route';
import { corsHandler } from './middlewares/share/cors.middleware';
import { systemConstant } from './config/constants/system.constant';
import clientRouter from './routes/client/index.route';
import cookieParser from 'cookie-parser';
// Tạo Express application
const app: Application = express();
// Tạo HTTP server từ Express app (cần cho Socket.IO)
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: config.cors.origin, // Cho phép frontend kết nối
        credentials: true, // Cho phép gửi cookies
    },
});
/**
 * 1. HELMET - Bảo mật HTTP headers
 * - Bảo vệ app khỏi các lỗ hổng web phổ biến
 * - Tự động set các HTTP headers an toàn
 * - VD: X-Content-Type-Options, X-Frame-Options, etc.
 */
app.use(helmet());
/**
 * 2. CORS - Cross-Origin Resource Sharing
 * - Cho phép frontend gọi API phía backend
 * - origin: URL của frontend được phép truy cập
 * - credentials: true -> cho phép gửi cookies/authentication headers
 */
app.use(corsHandler());
/**
 * 3. COMPRESSION - Nén response
 * - Tự động nén response trước khi gửi về client
 * - Giảm kích thước data transfer -> tăng tốc độ
 * - Đặc biệt hữu ích cho JSON responses lớn
 */
app.use(compression());
/**
 * 4. MORGAN - HTTP request logger
 * - Log mọi HTTP request vào console
 * - Format 'dev': hiển thị method, url, status, response time
 * - VD: GET /api/users 200 15.234 ms
 * - Giúp debug và monitor API
 */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'My API is running 1' });
});
app.use(
    `/api/${config.apiVersion}/${systemConstant.prefixPathAdmin}`,
    adminRouter
);
app.use(
    `/api//${config.apiVersion}/${systemConstant.prefixPathClient}`,
    clientRouter
);
app.use((req, res) => {
    res.status(404).json({ error: 'Route is not found' });
});
app.use(errorMiddleware);
export { app, httpServer };
