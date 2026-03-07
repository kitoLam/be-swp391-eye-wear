import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config/env.config';
import { authSocketMiddleware } from './middlewares/auth.middleware';
import { NotificationHandler } from './handlers/notification.handler';
export class MySocketServer {
    private static io: Server | null = null;
    init = (server: HttpServer) => {
        MySocketServer.io = new Server(server, {
            cors: {
                origin: config.cors.origin, // Cho phép frontend kết nối
                credentials: true, // Cho phép gửi cookies
            },
        });
        console.log("✅ SocketIO connected successfully")
        // Middleware xác thực
        MySocketServer.io.use(authSocketMiddleware);

        MySocketServer.io.on('connection', async (socket) => {            
            // ============= Đăng ký các event bên phần notification =============
            const notificationHandler = new NotificationHandler(socket);
            notificationHandler.registerHandler();
            // ============= End Đăng ký các event bên phần notification =========

            socket.on('disconnect', async () => {
                notificationHandler.endHandler();
            });
        });
    };

    static getIO = () => {
        if (!MySocketServer.io) throw new Error('Socket has not initialized yet !');
        return MySocketServer.io;
    };
}
