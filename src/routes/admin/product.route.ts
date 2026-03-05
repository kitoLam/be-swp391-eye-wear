import { Router } from 'express';
import {
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import productController from '../../controllers/admin/product.controller';
import { ObjectIdSchema } from '../../types/common/objectId';
import { ProductListQuerySchema } from '../../types/product/product/product.query';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';

const router = Router();

// Search routes (phải đặt trước /:id để tránh conflict)
router.get(
    '/search/name-slug',
    // authenticateMiddleware,
    productController.searchByNameSlug
);
router.get(
    '/search/sku/:sku',
    // authenticateMiddleware,
    productController.searchBySku
);

// Statistics
router.get(
    '/statistics',
    // authenticateMiddleware,
    productController.getProductStatistics
);

// CRUD routes
// Note: Body validation removed for create/update due to union type schemas
// Validation will be handled at service layer
router.post(
    '/',
    authenticateMiddleware,
    requireAdminRoles([RoleType.MANAGER]),
    productController.createProduct
);
router.post(
    '/available',
    authenticateMiddleware,
    requireAdminRoles([RoleType.MANAGER]),
    productController.createProductAvailable
);
router.post(
    '/pre-order',
    authenticateMiddleware,
    requireAdminRoles([RoleType.MANAGER]),
    productController.createProductPreOrder
);
router.get(
    '/',
    validateQuery(ProductListQuerySchema),
    // authenticateMiddleware,
    productController.getProductList
);
router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    // authenticateMiddleware,
    productController.getProductDetail
);
router.patch(
    '/:id',
    validateParams(ObjectIdSchema),
    authenticateMiddleware,
    requireAdminRoles([RoleType.MANAGER]),
    productController.updateProduct
);
router.delete(
    '/:id',
    validateParams(ObjectIdSchema),
    authenticateMiddleware,
    requireAdminRoles([RoleType.MANAGER]),
    productController.deleteProduct
);

export default router;
