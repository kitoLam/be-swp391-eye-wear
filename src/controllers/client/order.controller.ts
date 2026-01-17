import { Request, Response } from 'express';
import orderClientService from '../../services/client/order.service';
import { ApiResponse } from '../../utils/api-response';
import { ClientCreateOrder } from '../../types/order/order';

class OrderController {
    createOrder = async (req: Request, res: Response) => {
        const payload = req.body as ClientCreateOrder;
        // In real app, we might associate order with req.customer!.id
        const order = await orderClientService.createOrder(payload);
        res.json(ApiResponse.success('Tạo đơn hàng thành công!', { order }));
    };
}

export default new OrderController();
