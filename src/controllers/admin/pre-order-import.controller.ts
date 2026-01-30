import { NextFunction, Request, Response } from 'express';
import preOrderImportService from '../../services/admin/pre-order-import.service';
import { ApiResponse } from '../../utils/api-response';
import { PreOrderImportRequest } from '../../types/pre-order-import/pre-order-import';

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
}

export default new PreOrderImportController();
