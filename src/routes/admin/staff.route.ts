import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';
import { validateBody, validateQuery } from '../../middlewares/share/validator.middleware';
import { AdminAccountListQuerySchema } from '../../types/admin-account/admin-account.query';
import staffController from '../../controllers/admin/staff.controller';
import { AdminAccountCreateSchema } from '../../types/admin-account/admin-account';

const router = Router();

router.use(authenticateMiddleware);

router.get(
    '/admins',
    requireAdminRoles([RoleType.MANAGER, RoleType.SYSTEM_ADMIN]),
    validateQuery(AdminAccountListQuerySchema),
    staffController.getAdmins
);
router.post('/', validateBody(AdminAccountCreateSchema), staffController.createAdmin);
export default router;
