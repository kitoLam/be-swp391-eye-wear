import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import invoiceService from '../../services/admin/invoice.service';
import { InvoiceListQuery } from '../../types/invoice/invoice.query';
import { formatDateToString, formatNumberToVND } from '../../utils/formatter';

class InvoiceController {
    getListInvoice = async (req: Request, res: Response) => {
        const query = req.validatedQuery as InvoiceListQuery;
        const data = await invoiceService.getInvoiceList(query);
        const invoiceListFinal = data.invoiceList.map(item => {
          return {
            id: item._id.toString(),
            invoiceCode: item.invoiceCode,
            fullName: item.fullName,
            phone: item.phone,
            finalPrice: formatNumberToVND(item.totalPrice - item.totalDiscount),
            status: item.status,
            createdAt: formatDateToString(item.createdAt),
            address: [item.address.street, item.address.ward, item.address.city].join(', ')
          }
        })
        res.json(ApiResponse.success('Get invoice list success', {
            pagination: data.pagination,
            invoiceList: invoiceListFinal,
        }));
    };

    approveInvoice = async (req: Request, res: Response) => {
      const adminContext = req.adminAccount!;
      const invoiceId = req.params.id as string;
      await invoiceService.approveInvoice(invoiceId, adminContext);
      res.json(ApiResponse.success('Approve invoice success', null));
    }

    rejectInvoice = async (req: Request, res: Response) => {
      const adminContext = req.adminAccount!;
      const invoiceId = req.params.id as string;
      await invoiceService.rejectInvoice(invoiceId, adminContext);
      res.json(ApiResponse.success('Reject invoice success', null));
    }

    onboardInvoice = async (req: Request, res: Response) => {
      const adminContext = req.adminAccount!;
      const invoiceId = req.params.id as string;
      await invoiceService.onboardInvoice(invoiceId, adminContext);
      res.json(ApiResponse.success('Onboard invoice success', null));
    }
}
export default new InvoiceController();
