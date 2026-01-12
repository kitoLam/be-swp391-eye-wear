import { createClient, RedisClientType } from "redis";
import { config } from "../env.config";

class RedisClient {
  private static instance: RedisClient;
  public client: RedisClientType;

  private constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    this.client.on("error", (error) => {
      console.error("❌ Redis Client Error:", error);
    });

    this.client.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    this.client.on("disconnect", () => {
      console.warn("⚠️ Redis disconnected");
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}

export const redisClient = RedisClient.getInstance();
