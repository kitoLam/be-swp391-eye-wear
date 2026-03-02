import { Router } from 'express';
import shipController from '../../controllers/common/ship.controller';
import { validateParams } from '../../middlewares/share/validator.middleware';
import { GetShipCodeByInvoiceIdParamsSchema } from '../../types/ship/ship.request';

const router = Router();

router.get(
    '/invoice/:invoiceId/ship-code',
    validateParams(GetShipCodeByInvoiceIdParamsSchema),
    shipController.getShipCodeByInvoiceId
);

export default router;

