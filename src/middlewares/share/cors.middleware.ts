import cors from 'cors';
import { config } from '../../config/env.config';

export const corsHandler = () => {
    return cors({
        origin: [...config.cors.origin],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: [
            'Authorization',
            'Authentication',
            'Content-Type',
            'x-device-id',
        ],
        credentials: true,
    });
};
