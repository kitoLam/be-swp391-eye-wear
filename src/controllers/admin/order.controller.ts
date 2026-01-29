import { Request, Response } from "express";
import { AssignOrderDTO } from "../../types/order/order.request";
import { ApiResponse } from "../../utils/api-response";
import orderService from "../../services/admin/order.service";

class OrderController {
  /**
   * [POST] /:id/status/assign
   */
  assignOrder = async (req: Request, res: Response) => {
    const adminContext = req.adminAccount!;
    const orderId = req.params.id as string;
    const payload = req.body as AssignOrderDTO;
    await orderService.assignOrderToOperationStaff(adminContext, orderId, payload);
    res.json(ApiResponse.success('Assign successfully', null));
  }

  makingOrder = async (req: Request, res: Response) => {
    const adminContext = req.adminAccount!;
    const orderId = req.params.id as string;
    await orderService.makingOrder(adminContext, orderId);
    res.json(ApiResponse.success('Tag Making successfully', null));
  }
  packagingOrder = async (req: Request, res: Response) => {
    const adminContext = req.adminAccount!;
    const orderId = req.params.id as string;
    await orderService.packagingOrder(adminContext, orderId);
    res.json(ApiResponse.success('Tag Packaging successfully', null));
  }
  completeOrder = async (req: Request, res: Response) => {
    const adminContext = req.adminAccount!;
    const orderId = req.params.id as string;
    await orderService.completeOrder(adminContext, orderId);
    res.json(ApiResponse.success('Tag complete successfully', null));
  }


}

export default new OrderController();