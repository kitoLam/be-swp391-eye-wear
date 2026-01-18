import { Router } from 'express';
import invoiceController from '../../controllers/client/invoice.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import {
    CreateInvoiceSchema,
    UpdateInvoiceSchema,
} from '../../types/invoice/invoice';

const router = Router();

// All invoice routes require authentication
router.use(authenticateMiddlewareClient);

// Create invoice
router.post(
    '/',
    validateBody(CreateInvoiceSchema),
    invoiceController.createInvoice
);

// Get invoices list
router.get('/', invoiceController.getInvoices);

// Get invoice detail
router.get('/:id', invoiceController.getInvoiceDetail);

// Update invoice
router.patch(
    '/:id',
    validateBody(UpdateInvoiceSchema),
    invoiceController.updateInvoice
);

export default router;
