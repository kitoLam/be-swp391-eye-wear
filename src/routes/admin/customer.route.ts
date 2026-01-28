import { Router } from 'express';
import customerController from '../../controllers/admin/customer.controller';
import { authenticateMiddleware as authMiddleware } from '../../middlewares/admin/auth.middleware';

const router = Router();

router.get('/', authMiddleware, customerController.getCustomers);
router.get('/:id', authMiddleware, customerController.getCustomerById);

export default router;
