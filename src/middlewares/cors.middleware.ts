import cors from 'cors';
import { config } from '../config/env.config';

export const corsHandler = () => {
    return cors({
        origin: [...config.cors.origin],
        credentials: true,
    });
};
