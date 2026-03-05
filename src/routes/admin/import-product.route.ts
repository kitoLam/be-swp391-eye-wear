import { Router } from 'express';
import { ImportProductRequestSchema } from '../../types/import-product/import-product';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import importProductController from '../../controllers/admin/import-product.controller';
import { RoleType } from '../../config/enums/admin-account';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';

const router = Router();

router.get(
    '/',
    authenticateMiddleware,
    requireAdminRoles([RoleType.OPERATION_STAFF, RoleType.MANAGER]),
    importProductController.getImportProducts
);

router.post(
    '/',
    authenticateMiddleware,
    requireAdminRoles([RoleType.OPERATION_STAFF]),
    validateBody(ImportProductRequestSchema),
    importProductController.importProduct
);

export default router;
