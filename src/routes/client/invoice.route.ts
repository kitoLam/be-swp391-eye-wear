import { Router } from 'express';
import invoiceController from '../../controllers/client/invoice.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import {
    CreateInvoiceSchema,
    UpdateInvoiceSchema,
} from '../../types/invoice/invoice';

const router = Router();

router.use(authenticateMiddlewareClient);

// Create invoice (Checkout)
router.post(
    '/',
    validateBody(CreateInvoiceSchema),
    invoiceController.createInvoice
);

// Get invoices
router.get('/', invoiceController.getInvoices);

// Get invoice detail
router.get('/:invoiceId', invoiceController.getInvoiceDetail);

// Update invoice status (admin/staff)
router.patch(
    '/:invoiceId/status',
    validateBody(UpdateInvoiceSchema),
    invoiceController.updateInvoiceStatus
);

export default router;
