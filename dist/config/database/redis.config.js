"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const env_config_1 = require("../env.config");
class RedisClient {
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: env_config_1.config.redis.url,
        });
        this.client.on("error", (error) => {
            console.error(">>> Redis Client Error:", error);
            process.exit(1);
        });
        this.client.on("connect", () => {
            console.log(">>> Redis connected successfully");
        });
        this.client.on("disconnect", () => {
            console.warn(">>> Redis disconnected");
        });
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }
    async disconnect() {
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }
}
exports.redisClient = RedisClient.getInstance();
