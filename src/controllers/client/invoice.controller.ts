import { NextFunction, Request, Response } from 'express';
import invoiceClientService from '../../services/client/invoice.service';
import { ApiResponse } from '../../utils/api-response';
import { ClientUpdateInvoice } from '../../types/invoice/client-invoice';

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

    cancelInvoice = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        await invoiceClientService.cancelInvoice(
            invoiceId as string,
            req.customer!
        );
        res.json(
            ApiResponse.success('Cancel invoice successfully', null)
        );
    };

    updateInvoice = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        const payload = req.body as ClientUpdateInvoice;
        const data = await invoiceClientService.updateInvoice(
            req.customer!,
            invoiceId as string,
            payload,
        );
        res.json(ApiResponse.success('Update invoice successfully', data));
    }
}

export default new InvoiceController();
