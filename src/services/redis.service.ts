import { redisClient } from '../config/database/redis.config';
class RedisService {
    async getDataByKey<T>(key: string): Promise<T | null> {
        const data = await redisClient.client.get(key);
        return data ? (JSON.parse(data) as T) : null;
    }
    /**
     * Set data with expired time in redis
     * @param key - key of data
     * @param value - value of data
     * @param ttl - time to live in second
     * @returns Promise<boolean> - true if data saved successfully, false otherwise
     */
    async setDataWithExpiredTime(
        key: string,
        value: any,
        ttl: number
    ): Promise<boolean> {
        // trả về string "OK" tức đã lưu thành công vào redis
        const isOk = await redisClient.client.setEx(
            key,
            ttl,
            JSON.stringify(value)
        );
        return isOk === 'Ok';
    }
    isExistKey = async (key: string): Promise<boolean> => {
        // hàm exist check trong những key truyền vào có bao nhiêu key tồn tại
        // truyền 1 key thì ra 1 là key đó tồn tại, tương tự 2 thì ra 2,
        // ta bắt exist với 1 key = việc check số lg exist = 0
        const numOfExist = await redisClient.client.exists(key);
        return numOfExist > 0;
    };
    async deleteDataByKey(key: string): Promise<void> {
        await redisClient.client.del(key);
    }
}
export default new RedisService();
