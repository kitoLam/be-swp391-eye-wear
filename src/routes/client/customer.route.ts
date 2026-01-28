import { Router } from 'express';
import customerController from '../../controllers/client/customer.controller';
import { authenticateMiddlewareClient as authMiddleware } from '../../middlewares/client/auth.middleware';

const router = Router();

router.get('/', authMiddleware, customerController.getCustomerProfile);

export default router;
