import { Router } from 'express';
import {
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { InvoiceListQuerySchema } from '../../types/invoice/invoice.query';
import invoiceController from '../../controllers/admin/invoice.controller';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { ObjectIdSchema } from '../../types/common/objectId';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách hóa đơn
router.get(
    '/',
    validateQuery(InvoiceListQuerySchema),
    invoiceController.getListInvoice
);
// api lấy danh sách hóa đơn có status DEPOSITED với order types

// =============== MANAGER ROLE =============
router.get(
    '/manager',
    requireAdminRoles([RoleType.MANAGER]),
    validateQuery(InvoiceListQuerySchema),
    invoiceController.getListInvoice
);

// =============== SALE ROLE ===============
router.get('/deposited', invoiceController.getDepositedInvoices);
router.patch(
    '/:id/status/approve',
    validateParams(ObjectIdSchema),
    invoiceController.approveInvoice
);
router.patch(
    '/:id/status/reject',
    validateParams(ObjectIdSchema),
    invoiceController.rejectInvoice
);
// =============== END SALE ROLE ============

// =============== MANAGER ROLE =============
router.patch(
    '/:id/status/onboard',
    validateParams(ObjectIdSchema),
    invoiceController.onboardInvoice
);
router.patch(
    '/:id/status/complete',
    requireAdminRoles([RoleType.MANAGER]),
    validateParams(ObjectIdSchema),
    invoiceController.completeInvoice
);
// =============== END MANAGER ROLE =============

export default router;
