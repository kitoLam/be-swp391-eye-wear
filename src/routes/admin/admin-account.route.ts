import { Router } from 'express';
import adminAccountController from '../../controllers/admin/admin-account.controller';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { ObjectIdSchema } from '../../types/common/objectId';
import {
    AdminAccountCreateSchema,
    AdminAccountUpdateSchema,
} from '../../types/admin-account/admin-account.request';
import { AdminAccountListQuerySchema } from '../../types/admin-account/admin-account.query';

const router = Router();

// Tất cả các route admin account đều yêu cầu đăng nhập và role SYSTEM_ADMIN
router.use(authenticateMiddleware);
router.get(
    '/',
    validateQuery(AdminAccountListQuerySchema),
    adminAccountController.getList
);

router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    adminAccountController.getDetail
);
router.use(requireAdminRoles([RoleType.SYSTEM_ADMIN]));

router.post(
    '/',
    validateBody(AdminAccountCreateSchema),
    adminAccountController.create
);

//update account
router.patch(
    '/:id',
    validateParams(ObjectIdSchema),
    validateBody(AdminAccountUpdateSchema),
    adminAccountController.update
);
//delete account
router.delete(
    '/:id',
    validateParams(ObjectIdSchema),
    adminAccountController.delete
);

export default router;
