import { Request, Response } from 'express';
import invoiceClientService from '../../services/client/invoice.service';
import { ApiResponse } from '../../utils/api-response';
import { CreateInvoice, UpdateInvoice } from '../../types/invoice/invoice';

class InvoiceController {
    /**
     * Create invoice
     */
    createInvoice = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as CreateInvoice;
        const invoice = await invoiceClientService.createInvoice(
            customerId,
            payload
        );
        res.json(ApiResponse.success('Tạo hóa đơn thành công!', { invoice }));
    };

    /**
     * Get invoices list
     */
    getInvoices = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        const result = await invoiceClientService.getInvoices(
            customerId,
            page,
            limit,
            status
        );
        res.json(
            ApiResponse.success('Lấy danh sách hóa đơn thành công!', result)
        );
    };

    /**
     * Get invoice detail
     */
    getInvoiceDetail = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const invoiceId = req.params.id as string;
        const invoice = await invoiceClientService.getInvoiceDetail(
            customerId,
            invoiceId
        );
        res.json(
            ApiResponse.success('Lấy chi tiết hóa đơn thành công!', { invoice })
        );
    };

    /**
     * Update invoice
     */
    updateInvoice = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const invoiceId = req.params.id as string;
        const payload = req.body as UpdateInvoice;
        const invoice = await invoiceClientService.updateInvoice(
            customerId,
            invoiceId,
            payload
        );
        res.json(
            ApiResponse.success('Cập nhật hóa đơn thành công!', { invoice })
        );
    };
}

export default new InvoiceController();
