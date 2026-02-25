import { Router } from 'express';
import customerController from '../../controllers/admin/customer.controller';
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
    CreateCustomerSchema,
    UpdateCustomerSchema,
} from '../../types/customer/customer';
import { CustomerListQuerySchema } from '../../types/customer/customer.query';

const router = Router();

// Tất cả các route customer đều yêu cầu đăng nhập và role SYSTEM_ADMIN
router.use(authenticateMiddleware);
router.use(requireAdminRoles([RoleType.SYSTEM_ADMIN]));

router.get(
    '/',
    validateQuery(CustomerListQuerySchema),
    customerController.getList
);

router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    customerController.getDetail
);

router.post('/', validateBody(CreateCustomerSchema), customerController.create);

router.patch(
    '/:id',
    validateParams(ObjectIdSchema),
    validateBody(UpdateCustomerSchema),
    customerController.update
);

router.delete(
    '/:id',
    validateParams(ObjectIdSchema),
    customerController.delete
);

export default router;
