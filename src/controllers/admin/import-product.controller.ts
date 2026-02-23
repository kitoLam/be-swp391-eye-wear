import { NextFunction, Request, Response } from 'express';
import importProductService from '../../services/admin/import-product.service';
import { ApiResponse } from '../../utils/api-response';
import { ImportProductRequest } from '../../types/import-product/import-product';

class ImportProductController {
    importProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await importProductService.importProduct(
                req.body as ImportProductRequest,
                req.adminAccount!
            );
            res.json(
                ApiResponse.success('Product imported successfully', null)
            );
        } catch (error) {
            next(error);
        }
    };
}

export default new ImportProductController();
