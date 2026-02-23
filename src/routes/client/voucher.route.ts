import express from 'express';
import voucherClientController from '../../controllers/client/voucher.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';

const router = express.Router();

// Public routes
router.get('/available', voucherClientController.getAvailableVouchers);

// Protected routes
router.use(authenticateMiddlewareClient);
router.get('/my-vouchers', voucherClientController.getMyVouchers);
router.get('/client/:clientId', voucherClientController.getVouchersByClientId);
router.post('/validate', voucherClientController.validateVoucher);
router.post('/assign', voucherClientController.assignVoucher); // Add voucher to client

export default router;
