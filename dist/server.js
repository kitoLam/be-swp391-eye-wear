"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_config_1 = require("./config/env.config");
const mongodb_config_1 = require("./config/database/mongodb.config");
const redis_config_1 = require("./config/database/redis.config");
const neo4j_config_1 = require("./config/database/neo4j.config");
const startServer = async () => {
    try {
        // Connect to databases
        await (0, mongodb_config_1.connectMongoDB)();
        await redis_config_1.redisClient.connect();
        // Neo4j connects automatically on initialization
        // Socket.IO connection handler
        app_1.io.on('connection', socket => {
            console.log(`✅ Client connected: ${socket.id}`);
            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });
        // Start server
        app_1.httpServer.listen(env_config_1.config.port, () => {
            console.log(`🚀 Server running on port ${env_config_1.config.port}`);
            console.log(`📝 Environment: ${env_config_1.config.env}`);
            console.log(`🌐 API: http://localhost:${env_config_1.config.port}/api/${env_config_1.config.apiVersion}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
const gracefulShutdown = async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await redis_config_1.redisClient.disconnect();
    await neo4j_config_1.neo4jClient.close();
    process.exit(0);
};
process.on('SIGTERM', () => {
    void (async () => {
        await gracefulShutdown();
    })();
});
void (async () => {
    await startServer();
})();
