import { NextFunction, Response, Request } from 'express';
import z, { ZodError } from 'zod';
import { BadRequestError } from '../../errors/apiError/api-error';
const validateBody = (schema: z.ZodObject<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestError(error.issues[0].message);
            }
            next(error);
        }
    };
};
const validateQuery = (schema: z.ZodObject<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const query: any = schema.parse(req.query);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            req.query = query;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestError(error.issues[0].message);
            }
            next(error);
        }
    };
};
const validateParams = (schema: z.ZodObject<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestError(error.issues[0].message);
            }
            next(error);
        }
    };
};
const validateData = (
    schema: z.ZodObject<any, any>,
    getDataCb: (req: Request) => unknown
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = getDataCb(req);
            schema.parse(data);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestError(error.issues[0].message);
            }
            next(error);
        }
    };
};
export { validateBody, validateQuery, validateParams, validateData };
