import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import invoiceService from '../../services/admin/invoice.service';
import {
    InvoiceListQuery,
    InvoiceRevenueQuery,
} from '../../types/invoice/invoice.query';
import { formatDateToString, formatNumberToVND } from '../../utils/formatter';
import { InvoiceAssignHandleDeliveryRequest, RejectInvoiceRequest } from '../../types/invoice/invoice.request';

class InvoiceController {
    getListInvoice = async (req: Request, res: Response) => {
        const query = req.validatedQuery as InvoiceListQuery;
        const data = await invoiceService.getInvoiceListWithOrders(query);
        const invoiceListFinal = data.invoiceList.map((item: any) => {
            return {
                id: item._id.toString(),
                invoiceCode: item.invoiceCode,
                fullName: item.fullName,
                phone: item.phone,
                finalPrice: formatNumberToVND(
                    item.totalPrice - item.totalDiscount
                ),
                status: item.status,
                createdAt: formatDateToString(item.createdAt),
                address: [
                    item.address.street,
                    item.address.ward,
                    item.address.city,
                ].join(', '),
                orders: item.orders,
            };
        });
        res.json(
            ApiResponse.success('Get invoice list success', {
                pagination: data.pagination,
                invoiceList: invoiceListFinal,
            })
        );
    };

    getListInvoiceByDeliveryStaff = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const query = req.validatedQuery as InvoiceListQuery;
        const data = await invoiceService.getInvoiceListWithOrders(
            query,
            adminContext.id
        );
        const invoiceListFinal = data.invoiceList.map((item: any) => {
            return {
                id: item._id.toString(),
                invoiceCode: item.invoiceCode,
                fullName: item.fullName,
                phone: item.phone,
                finalPrice: formatNumberToVND(
                    item.totalPrice - item.totalDiscount
                ),
                status: item.status,
                createdAt: formatDateToString(item.createdAt),
                address: [
                    item.address.street,
                    item.address.ward,
                    item.address.city,
                ].join(', '),
                orders: item.orders,
            };
        });
        res.json(
            ApiResponse.success('Get invoice list by delivery staff success', {
                pagination: data.pagination,
                invoiceList: invoiceListFinal,
            })
        );
    };

    approveInvoice = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        await invoiceService.approveInvoice(invoiceId, adminContext);
        res.json(ApiResponse.success('Approve invoice success', null));
    };

    rejectInvoice = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        const body = req.body as RejectInvoiceRequest;
        const updatedInvoice = await invoiceService.rejectInvoice(invoiceId, adminContext, body);
        res.json(ApiResponse.success('Reject invoice success', {
            rejectedNote: updatedInvoice?.rejectedNote,
        }));
    };

    onboardInvoice = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        await invoiceService.onboardInvoice(invoiceId, adminContext);
        res.json(ApiResponse.success('Onboard invoice success', null));
    };

    completeInvoice = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        await invoiceService.completeInvoice(invoiceId, adminContext);
        res.json(ApiResponse.success('Complete invoice success', null));
    };

    readyToShipInvoice = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        const data = await invoiceService.readyToShipInvoice(invoiceId, adminContext);
        res.json(
            ApiResponse.success('Update invoice to ready to ship success', {
                shipmentInfo: data.shipmentData,
                updatedInvoice: data.updatedInvoice
            })
        );
    };

    deliveringInvoice = async (req: Request, res: Response) => {
        const invoiceId = req.params.id as string;
        const shipmentInfo = await invoiceService.deliveringInvoice(
            invoiceId
        );
        res.json(
            ApiResponse.success('Update invoice to delivering success', {
                shipmentInfo,
            })
        );
    };

    deliveredInvoice = async (req: Request, res: Response) => {
        // No adminContext needed for this public endpoint
        const invoiceId = req.params.id as string;
        await invoiceService.deliveredInvoice(invoiceId);
        res.json(
            ApiResponse.success('Update invoice to delivered success', null)
        );
    };

    /**
     * Get deposited invoices with order types
     * Endpoint: GET /admin/invoices/deposited
     */
    getDepositedInvoices = async (req: Request, res: Response) => {
        const data = await invoiceService.getDepositedInvoicesWithOrderTypes();

        // Format response data
        const formattedData = data.map(invoice => ({
            id: invoice._id.toString(),
            invoiceCode: invoice.invoiceCode,
            fullName: invoice.fullName,
            phone: invoice.phone,
            finalPrice: formatNumberToVND(
                invoice.totalPrice - invoice.totalDiscount
            ),
            status: invoice.status,
            address: [
                invoice.address.street,
                invoice.address.ward,
                invoice.address.city,
            ].join(', '),
            orders: invoice.orders, // Already formatted by aggregation: [{id, type}]
            createdAt: formatDateToString(invoice.createdAt),
        }));

        res.json(
            ApiResponse.success('Get deposited invoices success', formattedData)
        );
    };

    assignInvoiceToHandleDelivery = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const invoiceId = req.params.id as string;
        const body = req.body as InvoiceAssignHandleDeliveryRequest;
        const updatedInvoice =
            await invoiceService.assignInvoiceToHandleDelivery(
                adminContext,
                invoiceId,
                body
            );
        res.json(
            ApiResponse.success('Assign invoice to handle delivery success', {
                updatedInvoice,
            })
        );
    };

    getInvoiceDetail = async (req: Request, res: Response) => {
        const invoiceId = req.params.id as string;
        const data = await invoiceService.getInvoiceDetail(invoiceId);
        res.json(ApiResponse.success('Get invoice detail success', data));
    };

    getRevenueByPeriod = async (req: Request, res: Response) => {
        const query = req.validatedQuery as InvoiceRevenueQuery;
        const data = await invoiceService.getRevenueByPeriod(query);
        res.json(ApiResponse.success('Get invoice revenue by period success', {
            ...query,
            rows: data,
        }));
    };
}
export default new InvoiceController();
