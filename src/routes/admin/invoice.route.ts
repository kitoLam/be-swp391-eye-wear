import { Router } from 'express';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { InvoiceListQuerySchema } from '../../types/invoice/invoice.query';
import invoiceController from '../../controllers/admin/invoice.controller';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { ObjectIdSchema } from '../../types/common/objectId';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';
import { InvoiceAssignHandleDeliverySchema, RejectInvoiceSchema } from '../../types/invoice/invoice.request';
const router = Router();

// Public route - NO AUTHENTICATION
router.patch(
    '/:id/status/delivered',
    validateParams(ObjectIdSchema),
    invoiceController.deliveredInvoice
);
router.patch(
    '/:id/status/delivering',
    validateParams(ObjectIdSchema),
    invoiceController.deliveringInvoice
);
router.use(authenticateMiddleware);
// api lấy danh sách hóa đơn
router.get(
    '/',
    validateQuery(InvoiceListQuerySchema),
    invoiceController.getListInvoice
);
router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    invoiceController.getInvoiceDetail
)
// api lấy danh sách hóa đơn theo staffHandleDelivery của staff đang đăng nhập
router.get(
    '/handle-delivery',
    validateQuery(InvoiceListQuerySchema),
    invoiceController.getListInvoiceByDeliveryStaff
);
// =============== MANAGER ROLE =============
router.get(
    '/manager',
    requireAdminRoles([RoleType.MANAGER]),
    validateQuery(InvoiceListQuerySchema),
    invoiceController.getListInvoice
);
// =============== SALE ROLE ===============
router.patch(
    '/:id/status/approve',
    validateParams(ObjectIdSchema),
    invoiceController.approveInvoice
);
router.patch(
    '/:id/status/reject',
    validateParams(ObjectIdSchema),
    validateBody(RejectInvoiceSchema),
    invoiceController.rejectInvoice
);
// =============== END SALE ROLE ============

// =============== MANAGER ROLE =============
router.patch(
    '/:id/assign/handle-delivery',
    validateParams(ObjectIdSchema),
    validateBody(InvoiceAssignHandleDeliverySchema),
    invoiceController.assignInvoiceToHandleDelivery
);
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

// =============== OPERATION ROLE =============
router.patch(
    '/:id/status/ready-to-ship',
    validateParams(ObjectIdSchema),
    invoiceController.readyToShipInvoice
);
// =============== END MANAGER ROLE =============

export default router;
