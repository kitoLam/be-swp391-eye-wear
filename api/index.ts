import { app } from '../src/app';
import { connectMongoDB } from '../src/config/database/mongodb.config';
import { redisClient } from '../src/config/database/redis.config';

let isInitialized = false;

async function initializeApp() {
    if (!isInitialized) {
        try {
            await connectMongoDB();
            await redisClient.connect();
            isInitialized = true;
            console.log('✅ Serverless function initialized');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
}

// Export default handler cho Vercel
export default async (req: any, res: any) => {
    try {
        await initializeApp();
        return app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
