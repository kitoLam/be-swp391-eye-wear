import { Router } from 'express';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { CreateReportTicketSchema } from '../../types/report-ticket/report-ticket.request';
import { ObjectIdSchema } from '../../types/common/objectId';
import reportTicketController from '../../controllers/admin/report-ticket.controller';
import { ReportTicketListQuerySchema } from '../../types/report-ticket/report-ticket.query';
const router = Router();
router.use(authenticateMiddleware);
router.post(
    '/',
    validateBody(CreateReportTicketSchema),
    reportTicketController.createReportTicket
);
router.get(
    '/',
    validateQuery(ReportTicketListQuerySchema),
    reportTicketController.getReportTicketList
);
router.get(
    '/my-history',
    validateQuery(ReportTicketListQuerySchema),
    reportTicketController.getReportTicketHistoryListOfStaff
);
router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    reportTicketController.getReportTicketDetail
);
router.patch(
    '/:id/status/resolve',
    validateParams(ObjectIdSchema),
    reportTicketController.resolveReportTicket
);
router.patch(
    '/:id/status/processing',
    validateParams(ObjectIdSchema),
    reportTicketController.processReportTicket
);
router.patch(
    '/:id/status/reject',
    validateParams(ObjectIdSchema),
    reportTicketController.rejectReportTicket
);

export default router;
