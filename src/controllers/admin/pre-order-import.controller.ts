import { NextFunction, Request, Response } from 'express';
import preOrderImportService from '../../services/admin/pre-order-import.service';
import { ApiResponse } from '../../utils/api-response';
import { PreOrderImportRequest } from '../../types/pre-order-import/pre-order-import';
import { PreOrderImportQuery } from '../../types/pre-order-import/pre-order-import.query';
import { BadRequestError } from '../../errors/apiError/api-error';

class PreOrderImportController {
    createPreOrderImport = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const result = await preOrderImportService.createPreOrderImport(
                req.body as PreOrderImportRequest,
                req.adminAccount!
            );
            res.json(
                ApiResponse.success(
                    'Pre-order import created successfully',
                    result
                )
            );
        } catch (error) {
            next(error);
        }
    };

    cancelPreOrderImport = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { id } = req.params;
            const result = await preOrderImportService.cancelPreOrderImport(
                id as string,
                req.adminAccount!
            );
            res.json(
                ApiResponse.success(
                    'Pre-order import cancelled successfully',
                    result
                )
            );
        } catch (error) {
            next(error);
        }
    };

    getPreOrderImports = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const query = req.validatedQuery as PreOrderImportQuery;

            const result =
                await preOrderImportService.getPreOrderImports(query);

            res.json(
                ApiResponse.success(
                    'Pre-order imports retrieved successfully',
                    result
                )
            );
        } catch (error) {
            next(error);
        }
    };

    getPreOrderImportDetail = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { id } = req.params;
            const result =
                await preOrderImportService.getPreOrderImportDetail(id as string);

            res.json(
                ApiResponse.success(
                    'Pre-order import detail retrieved successfully',
                    result
                )
            );
        } catch (error) {
            next(error);
        }
    };
}

export default new PreOrderImportController();
