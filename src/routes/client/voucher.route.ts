import { Router } from 'express';
import voucherClientController from '../../controllers/client/voucher.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import z from 'zod';

const router = Router();

// Validate voucher schema
const ValidateVoucherSchema = z.object({
    code: z.string().min(1, 'Voucher code is required'),
    orderValue: z.number().min(0, 'Order value must be non-negative'),
});

// Public routes
router.get('/available', voucherClientController.getAvailableVouchers);

// Protected routes (require authentication)
router.use(authenticateMiddlewareClient);

router.get('/my-vouchers', voucherClientController.getMyVouchers);
router.post(
    '/validate',
    validateBody(ValidateVoucherSchema),
    voucherClientController.validateVoucher
);

export default router;
