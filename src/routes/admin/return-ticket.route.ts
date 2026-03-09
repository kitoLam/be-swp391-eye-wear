import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import {
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { ObjectIdSchema } from '../../types/common/objectId';
import returnTicketController from '../../controllers/return-ticket/return-ticket.controller';
import { ReturnTicketListQuerySchema } from '../../types/return-ticket/return-ticket.request';

const router = Router();

router.use(authenticateMiddleware);

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

// [PATCH] status endpoints
router.patch(
    '/:id/status/approved',
    validateParams(ObjectIdSchema),
    returnTicketController.approveReturnTicket
);
router.patch(
    '/:id/status/rejected',
    validateParams(ObjectIdSchema),
    returnTicketController.rejectReturnTicket
);
router.patch(
    '/:id/status/in-progress',
    validateParams(ObjectIdSchema),
    returnTicketController.processReturnTicket
);

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

export default router;

