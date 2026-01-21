import { Request, Response } from 'express';
import orderClientService from '../../services/client/order.service';
import { ApiResponse } from '../../utils/api-response';
import { ClientCreateOrder } from '../../types/order/order';

class OrderController {
    createOrder = async (req: Request, res: Response) => {
        const payload = req.body as ClientCreateOrder;
        const customerId = req.customer!.id;
        const order = await orderClientService.createOrder(customerId, payload);
        res.json(ApiResponse.success('Tạo đơn hàng thành công!', { order }));
    };

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
        const { id } = req.params;
        const order = await orderClientService.getOrderDetail(
            customerId,
            id as string
        );
        res.json(
            ApiResponse.success('Lấy chi tiết đơn hàng thành công!', { order })
        );
    };

    updateOrder = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { id } = req.params;
        const payload = req.body;
        const order = await orderClientService.updateOrder(
            customerId,
            id as string,
            payload
        );
        res.json(
            ApiResponse.success('Cập nhật đơn hàng thành công!', { order })
        );
    };
}

export default new OrderController();
