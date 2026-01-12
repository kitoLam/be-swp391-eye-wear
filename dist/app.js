"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const env_config_1 = require("./config/env.config");
const error_middleware_1 = require("./middlewares/error.middleware");
const index_route_1 = __importDefault(require("./routes/admin/index.route"));
const cors_middleware_1 = require("./middlewares/cors.middleware");
const system_constant_1 = require("./config/constants/system.constant");
const index_route_2 = __importDefault(require("./routes/client/index.route"));
// Tạo Express application
const app = (0, express_1.default)();
exports.app = app;
// Tạo HTTP server từ Express app (cần cho Socket.IO)
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_config_1.config.cors.origin, // Cho phép frontend kết nối
        credentials: true, // Cho phép gửi cookies
    },
});
/**
 * 1. HELMET - Bảo mật HTTP headers
 * - Bảo vệ app khỏi các lỗ hổng web phổ biến
 * - Tự động set các HTTP headers an toàn
 * - VD: X-Content-Type-Options, X-Frame-Options, etc.
 */
app.use((0, helmet_1.default)());
/**
 * 2. CORS - Cross-Origin Resource Sharing
 * - Cho phép frontend gọi API phía backend
 * - origin: URL của frontend được phép truy cập
 * - credentials: true -> cho phép gửi cookies/authentication headers
 */
app.use((0, cors_middleware_1.corsHandler)());
/**
 * 3. COMPRESSION - Nén response
 * - Tự động nén response trước khi gửi về client
 * - Giảm kích thước data transfer -> tăng tốc độ
 * - Đặc biệt hữu ích cho JSON responses lớn
 */
app.use((0, compression_1.default)());
/**
 * 4. MORGAN - HTTP request logger
 * - Log mọi HTTP request vào console
 * - Format 'dev': hiển thị method, url, status, response time
 * - VD: GET /api/users 200 15.234 ms
 * - Giúp debug và monitor API
 */
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'My API is running' });
});
app.use(`/api/${env_config_1.config.apiVersion}${system_constant_1.systemConstant.prefixPathAdmin}`, index_route_1.default);
app.use(`/api//${env_config_1.config.apiVersion}${system_constant_1.systemConstant.prefixPathClient}`, index_route_2.default);
app.use((req, res) => {
    res.status(404).json({ error: 'Route is not found' });
});
app.use(error_middleware_1.errorMiddleware);
