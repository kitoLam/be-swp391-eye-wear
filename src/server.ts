import { httpServer, io } from './app';
import { config } from './config/env.config';
import { connectMongoDB } from './config/database/mongodb.config';
import { redisClient } from './config/database/redis.config';
import { checkSupabaseConnection } from './config/supabase.config';
import './queues/invoice.worker';
const startServer = async () => {
    try {
        // Connect to databases
        await connectMongoDB();
        await redisClient.connect();
        await checkSupabaseConnection();

        // Socket.IO connection handler
        io.on('connection', socket => {
            console.log(`✅ Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });

        // Start server
        httpServer.listen(config.port, () => {
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📝 Environment: ${config.env}`);
            console.log(
                `🌐 API: http://localhost:${config.port}/api/${config.apiVersion}`
            );
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

void (async () => {
    await startServer();
})();
