import { Router } from "express";
import { validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { InvoiceListQuerySchema } from "../../types/invoice/invoice.query";
import invoiceController from "../../controllers/admin/invoice.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { InvoiceVerifyParams } from "../../types/invoice/invoice.params";
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách hóa đơn
router.get('/', validateQuery(InvoiceListQuerySchema), invoiceController.getListInvoice);
//api thay đổi phần verify status của đơn (nếu đã reject rồi thì không đổi lại thành cái khác đc)
// phần quyền chỉ sale làm đc
router.patch('/:id/verify-status/:status', validateParams(InvoiceVerifyParams), invoiceController.verifyInvoice);


export default router;