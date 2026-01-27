import { Router } from "express";
import { validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { InvoiceListQuerySchema } from "../../types/invoice/invoice.query";
import invoiceController from "../../controllers/admin/invoice.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { ObjectIdSchema } from "../../types/common/objectId";
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách hóa đơn
router.get('/', validateQuery(InvoiceListQuerySchema), invoiceController.getListInvoice);

router.patch('/:id/status/approve', validateParams(ObjectIdSchema), invoiceController.approveInvoice);

router.patch('/:id/status/reject', validateParams(ObjectIdSchema), invoiceController.rejectInvoice);

export default router;