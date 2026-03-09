import { Router } from 'express';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { CreateReturnTicketSchema, ReturnTicketListQuerySchema } from '../../types/return-ticket/return-ticket.request';
import { ObjectIdSchema } from '../../types/common/objectId';
import returnTicketController from '../../controllers/return-ticket/return-ticket.controller';

const router = Router();

router.use(authenticateMiddlewareClient);

router.post(
    '/',
    validateBody(CreateReturnTicketSchema),
    returnTicketController.createReturnTicket
);

router.get(
    '/',
    validateQuery(ReturnTicketListQuerySchema),
    returnTicketController.getClientReturnTicketList
);

router.patch(
    '/:id/status/cancel',
    validateParams(ObjectIdSchema),
    returnTicketController.cancelReturnTicket
);
export default router;

