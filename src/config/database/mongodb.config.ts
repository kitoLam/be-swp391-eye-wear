import mongoose from 'mongoose';
import { config } from '../env.config';

export const connectMongoDB = async (): Promise<void> => {
    try {
        const options: mongoose.ConnectOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(config.mongodb.uri, options);

        console.log('>>> MongoDB connected successfully');

        mongoose.connection.on('error', error => {
            console.error('>>> MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('>>> MongoDB disconnected');
        });

        process.on('SIGINT', (): void => {
          void (async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
          })();
        });
    } catch (error) {
        console.error('>>> MongoDB connection failed:', error);
        process.exit(1);
    }
};
