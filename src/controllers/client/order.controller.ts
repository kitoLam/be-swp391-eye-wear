import { NextFunction, Request, Response } from 'express';
import orderClientService from '../../services/client/order.service';
import { ApiResponse } from '../../utils/api-response';
import { ClientUpdateOrder } from '../../types/order/order.request';
class OrderController {

    getOrderByInvoiceId = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const invoiceId = req.params.invoiceId as string;
        const data = await orderClientService.getOrderByInvoiceId(
            customerId,
            invoiceId
        );
        res.json(
            ApiResponse.success('Lấy đơn hàng theo mã hóa đơn thành công!', data)
        );
    };

    getOrderDetail = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const orderId = req.params.orderId as string;
        const order = await orderClientService.getOrderDetail(
            customerId,
            orderId as string
        );
        res.json(
            ApiResponse.success('Lấy chi tiết đơn hàng thành công!', { order })
        );
    };

    updateOrderPrescription = async (req: Request, res: Response) => {
        const customer = req.customer!;
        const orderId = req.params.orderId;
        const payload = req.body as ClientUpdateOrder;
        const order = await orderClientService.updateOrderPrescription(
            customer,
            orderId as string,
            payload
        );
        res.json(
            ApiResponse.success('Cập nhật đơn hàng thành công!', { order })
        );
    };
}

export default new OrderController();
