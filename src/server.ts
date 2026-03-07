import { httpServer } from './app';
import { config } from './config/env.config';
import { connectMongoDB } from './config/database/mongodb.config';
import { redisClient } from './config/database/redis.config';
import { checkSupabaseConnection } from './config/supabase.config';
import './queues/invoice.worker';
import './queues/mail.worker';
import { MySocketServer } from './socket/index.socket';
const startServer = async () => {
    try {
        // Connect to databases
        await connectMongoDB();
        await redisClient.connect();
        await checkSupabaseConnection();

        // init socket server instance
        const mySocketServer = new MySocketServer();
        mySocketServer.init(httpServer);
        // end init socket server instance

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
