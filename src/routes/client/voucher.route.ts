import express from 'express';
import voucherClientController from '../../controllers/client/voucher.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';

const router = express.Router();

// Public routes
router.get('/available', voucherClientController.getAvailableVouchers);

// Protected routes
router.use(authenticateMiddlewareClient);
router.get('/my-vouchers', voucherClientController.getMyVouchers);
router.post('/validate', voucherClientController.validateVoucher);
router.post('/assign', voucherClientController.assignVoucher); // Test route

export default router;
