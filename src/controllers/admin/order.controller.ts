import { Request, Response } from 'express';
import { ApproveOrderDTO, AssignOrderDTO } from '../../types/order/order.request';
import { ApiResponse } from '../../utils/api-response';
import orderService from '../../services/admin/order.service';
import { BadRequestError } from '../../errors/apiError/api-error';
import { OrderCountTotalQuery, OrderListAdminQuery, OrderStatsQuery } from '../../types/order/order.query';

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
    getOrdersList = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const query = req.validatedQuery as OrderListAdminQuery;
        const orders = await orderService.getOrdersList(adminContext, query);

        res.json(
            ApiResponse.success('Lấy danh sách order thành công!', {
                orders,
            })
        );
    };

    getOrderDetail = async (req: Request, res: Response) => {
        const orderId = req.params.id as string;
        const order = await orderService.getOrderDetail(orderId);
        res.json(ApiResponse.success('Lấy chi tiết đơn hàng!', { order }));
    }

    getOrderSummary = async (req: Request, res: Response) => {
        const query = req.validatedQuery as OrderStatsQuery;
        const data = await orderService.getOrderSummary(query);
        res.json(ApiResponse.success('Get order stats summary success', data));
    }

    getOrderPendingBreakdown = async (req: Request, res: Response) => {
        const query = req.validatedQuery as OrderStatsQuery;
        const data = await orderService.getOrderSummary(query);
        res.json(ApiResponse.success('Get order pending breakdown success', data));
    }

    approveOrder = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const orderId = req.params.id as string;
        const body = req.body as ApproveOrderDTO;
        const updatedOrder = await orderService.approveOrder(adminContext, orderId, body);
        res.json(ApiResponse.success('Approve order successfully', {
            updatedOrder
        }));
    }

    countTotalOrders = async (req: Request, res: Response) => {
        const query = req.validatedQuery as OrderCountTotalQuery;
        const data = await orderService.countTotalOrders(query);
        res.json(ApiResponse.success('Count total orders successfully', {
            total: data
        }));
    }
}

export default new OrderController();
