import { Socket } from 'socket.io';
import { z, ZodError } from 'zod';

/**
 * Middleware factory để validate dữ liệu từ socket event
 * @param schema - Zod schema để validate
 * @returns Socket middleware function
 */
export const validateSocketData = (schema: z.ZodSchema<any>) => {
    return (socket: Socket, data: any, next: (err?: Error) => void) => {
        try {
            // Validate data với schema
            schema.parse(data);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return next(new Error(`Validation error`));
            }
            next(new Error('Validation error'));
        }
    };
};

/**
 * Wrapper để tạo event handler có validation
 * @param schema - Zod schema để validate
 * @param handler - Event handler function
 * @returns Wrapped handler với validation
 */
export const withValidation = <T>(
    schema: z.ZodSchema<T>,
    handler: (data: T, callback: any) => void | Promise<void>
    //                                  ↑ Thêm callback parameter
) => {
    return async (data: any, callback: any) => {
        try {
            // Validate data
            const validatedData = schema.parse(JSON.parse(data));
            // Gọi handler với validated data VÀ callback
            await handler(validatedData, callback);
            handler;
        } catch (error) {
            if (error instanceof ZodError) {
                // Nếu có callback, trả error qua callback
                callback({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                });
            } else {
                callback({
                    success: false,
                    code: 'SERVER_ERROR',
                    message: 'An error occurred',
                });
            }
        }
    };
};
