import { Router } from 'express';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import productController from '../../controllers/common/product.controller';
import { ObjectIdSchema } from '../../types/common/objectId';
import { ProductListQuerySchema } from '../../types/product/product/product.query';
import { ProductConfigManufacturingSchema } from '../../types/product/product/product.dto';

const router = Router();

// Public routes - NO authentication required
router.get(
    '/',
    validateQuery(ProductListQuerySchema),
    productController.getProductList
);

router.post(
    '/config-manufacturing',
    validateBody(ProductConfigManufacturingSchema),
    productController.configProductManufacturing
);

router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    productController.getProductDetail
);

export default router;
