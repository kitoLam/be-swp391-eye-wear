import { Router } from 'express';
import {
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import productController from '../../controllers/common/product.controller';
import { ObjectIdSchema } from '../../types/common/objectId';
import { ProductListQuerySchema } from '../../types/product/product/product.query';

const router = Router();

// Public routes - NO authentication required
router.get(
    '/',
    validateQuery(ProductListQuerySchema),
    productController.getProductList
);

// Get all distinct product specs (for filter UI)
router.get('/specs', productController.getProductSpecs);

router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    productController.getProductDetail
);
router.get('/:id/variants/:sku', productController.getSpecificProductVariant);
export default router;
