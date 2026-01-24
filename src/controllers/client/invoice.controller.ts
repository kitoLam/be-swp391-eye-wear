import { NextFunction, Request, Response } from 'express';
import invoiceClientService from '../../services/client/invoice.service';
import { ApiResponse } from '../../utils/api-response';

class InvoiceController {
    /**
     * Create invoice (Checkout)
     */
    createInvoice = async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;
        const customerId = req.customer!.id;

        const data = await invoiceClientService.createInvoice(
            customerId,
            payload
        );

        res.json(ApiResponse.success('Tạo hóa đơn thành công!', data));
    };

    /**
     * Get customer's invoices
     */
    getInvoices = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { page, limit, status } = req.query;

        const result = await invoiceClientService.getInvoices(
            customerId,
            Number(page) || 1,
            Number(limit) || 10,
            status as string
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
        const { invoiceId } = req.params;

        const invoice = await invoiceClientService.getInvoiceDetail(
            customerId,
            invoiceId as string
        );

        res.json(
            ApiResponse.success('Lấy chi tiết hóa đơn thành công!', { invoice })
        );
    };

    /**
     * Update invoice status
     */
    updateInvoiceStatus = async (req: Request, res: Response) => {
        const { invoiceId } = req.params;
        const { status, managerId } = req.body;

        const invoice = await invoiceClientService.updateInvoiceStatus(
            invoiceId as string,
            status,
            managerId
        );

        res.json(
            ApiResponse.success('Cập nhật trạng thái hóa đơn thành công!', {
                invoice,
            })
        );
    };
}

export default new InvoiceController();
