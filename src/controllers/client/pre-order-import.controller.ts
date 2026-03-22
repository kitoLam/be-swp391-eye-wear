import { NextFunction, Request, Response } from 'express';
import preOrderImportClientService from '../../services/client/pre-order-import.service';
import { ApiResponse } from '../../utils/api-response';

class PreOrderImportClientController {
    getPreOrderImportDetailBySku = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { sku } = req.params;
            const result =
                await preOrderImportClientService.getPreOrderImportDetailBySku(
                    sku as string
                );

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

export default new PreOrderImportClientController();
