import { NextFunction, Request, Response } from 'express';
import orderClientService from '../../services/client/order.service';
import { ApiResponse } from '../../utils/api-response';
import { ClientCreateOrder } from '../../types/order/order';

class OrderController {

    getOrders = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { page, limit, status } = req.query;
        const result = await orderClientService.getOrders(
            customerId,
            Number(page) || 1,
            Number(limit) || 10,
            status as string
        );
        res.json(
            ApiResponse.success('Lấy danh sách đơn hàng thành công!', result)
        );
    };

    getOrderDetail = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { orderCode } = req.params;
        const order = await orderClientService.getOrderDetail(
            customerId,
            orderCode as string
        );
        res.json(
            ApiResponse.success('Lấy chi tiết đơn hàng thành công!', { order })
        );
    };

    updateOrder = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { orderCode } = req.params;
        const payload = req.body;
        const order = await orderClientService.updateOrder(
            customerId,
            orderCode as string,
            payload
        );
        res.json(
            ApiResponse.success('Cập nhật đơn hàng thành công!', { order })
        );
    };
}

export default new OrderController();
