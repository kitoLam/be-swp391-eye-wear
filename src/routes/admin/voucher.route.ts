import { Router } from 'express';
import voucherAdminController from '../../controllers/admin/voucher.controller';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import {
    CreateVoucherSchema,
    UpdateVoucherSchema,
} from '../../types/voucher/voucher';
import z from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticateMiddleware);

// CRUD operations
router.post(
    '/',
    validateBody(CreateVoucherSchema),
    voucherAdminController.createVoucher
);
router.get('/', voucherAdminController.getVouchers);
router.get('/statistics', voucherAdminController.getStatistics);
router.get('/:id', voucherAdminController.getVoucherDetail);
router.patch(
    '/:id',
    validateBody(UpdateVoucherSchema),
    voucherAdminController.updateVoucher
);
router.delete('/:id', voucherAdminController.deleteVoucher);

// Grant/Revoke operations
const GrantRevokeSchema = z.object({
    userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

router.post(
    '/:id/grant',
    validateBody(GrantRevokeSchema),
    voucherAdminController.grantVoucher
);
router.post(
    '/:id/revoke',
    validateBody(GrantRevokeSchema),
    voucherAdminController.revokeVoucher
);

// Query operations
router.get('/:id/users', voucherAdminController.getVoucherUsers);

// User vouchers (admin view)
router.get('/users/:userId/vouchers', voucherAdminController.getUserVouchers);

export default router;
