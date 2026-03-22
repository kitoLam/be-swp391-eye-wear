import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import {
    validateParams,
    validateQuery,
    validateBody,
} from '../../middlewares/share/validator.middleware';
import { ObjectIdSchema } from '../../types/common/objectId';
import returnTicketController from '../../controllers/return-ticket/return-ticket.controller';
import { ReturnTicketListQuerySchema, ApproveRejectReturnTicketSchema } from '../../types/return-ticket/return-ticket.request';

const router = Router();

// ============ Public callback endpoints (NO AUTH) ============
// These are called by the shipment service
router.patch(
    '/:id/status/delivering',
    validateParams(ObjectIdSchema),
    returnTicketController.deliveringReturnTicket
);
router.patch(
    '/:id/status/returned',
    validateParams(ObjectIdSchema),
    returnTicketController.returnedReturnTicket
);
router.patch(
    '/:id/status/fail-returned',
    validateParams(ObjectIdSchema),
    returnTicketController.failReturnedReturnTicket
);

// ============ Protected endpoints (REQUIRE AUTH) ============
router.use(authenticateMiddleware);

// [GET] monthly report: current vs previous month, total and per status
router.get(
    '/monthly-report',
    returnTicketController.getMonthlyReport
);

// [GET] staff get list return order
router.get(
    '/',
    validateQuery(ReturnTicketListQuerySchema),
    returnTicketController.getStaffReturnTicketList
);

// [GET] staff get list return by staffId (from token)
router.get(
    '/my-history',
    validateQuery(ReturnTicketListQuerySchema),
    returnTicketController.getReturnTicketsByStaff
);

router.get(
    '/returned-orders',
    validateQuery(ReturnTicketListQuerySchema),
    returnTicketController.getReturnedOrders
);

// [PATCH] staffVerify: update staffVerify from token
router.patch(
    '/:id/staff-verify',
    validateParams(ObjectIdSchema),
    returnTicketController.updateStaffVerify
);

// [PATCH] status endpoints - staff actions
router.patch(
    '/:id/status/approved',
    validateParams(ObjectIdSchema),
    validateBody(ApproveRejectReturnTicketSchema),
    returnTicketController.approveReturnTicket
);
router.patch(
    '/:id/status/rejected',
    validateParams(ObjectIdSchema),
    validateBody(ApproveRejectReturnTicketSchema),
    returnTicketController.rejectReturnTicket
);
// router.patch(
//     '/:id/status/in-progress',
//     validateParams(ObjectIdSchema),
//     returnTicketController.processReturnTicket
// );

export default router;