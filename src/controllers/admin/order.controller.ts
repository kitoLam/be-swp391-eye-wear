import { Request, Response } from 'express';
import { AssignOrderDTO } from '../../types/order/order.request';
import { ApiResponse } from '../../utils/api-response';
import orderService from '../../services/admin/order.service';
import { BadRequestError } from '../../errors/apiError/api-error';

class OrderController {
    /**
     * [POST] /:id/status/assign
     */
    assignOrder = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const orderId = req.params.id as string;
        const payload = req.body as AssignOrderDTO;
        await orderService.assignOrderToOperationStaff(
            adminContext,
            orderId,
            payload
        );
        res.json(ApiResponse.success('Assign successfully', null));
    };
    /**
     * [POST] /:id/status/making
     */
    makingOrder = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const orderId = req.params.id as string;
        await orderService.makingOrder(adminContext, orderId);
        res.json(ApiResponse.success('Tag Making successfully', null));
    };
    /**
     * [POST] /:id/status/packaging
     */
    packagingOrder = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const orderId = req.params.id as string;
        await orderService.packagingOrder(adminContext, orderId);
        res.json(ApiResponse.success('Tag Packaging successfully', null));
    };
    /**
     * [POST] /:id/status/complete
     */
    completeOrder = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const orderId = req.params.id as string;
        await orderService.completeOrder(adminContext, orderId);
        res.json(ApiResponse.success('Tag complete successfully', null));
    };
    getOrdersByStaff = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const staffId = adminContext.id;

        const orders = await orderService.getOrdersByStaffAssigned(staffId);

        res.json(
            ApiResponse.success('Lấy danh sách order thành công!', {
                orders,
            })
        );
    };
}

export default new OrderController();
