import { Router } from 'express';
import invoiceController from '../../controllers/client/invoice.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { ClientCreateInvoiceSchema } from '../../types/invoice/client-invoice';
import { UpdateInvoiceSchema } from '../../types/invoice/invoice';

const router = Router();

router.use(authenticateMiddlewareClient);

// Create invoice (Checkout)
router.post(
    '/',
    validateBody(ClientCreateInvoiceSchema),
    invoiceController.createInvoice
);

// Get invoices
router.get('/', invoiceController.getInvoices);

router.patch('/:id/cancel', invoiceController.cancelInvoice);

// Get invoice detail
router.get('/:invoiceId', invoiceController.getInvoiceDetail);

export default router;
