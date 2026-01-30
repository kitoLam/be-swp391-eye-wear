import { Router } from 'express';
import { ImportProductRequestSchema } from '../../types/import-product/import-product';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import importProductController from '../../controllers/admin/import-product.controller';

const router = Router();

router.post(
    '/',
    authenticateMiddleware,
    validateBody(ImportProductRequestSchema),
    importProductController.importProduct
);

export default router;
