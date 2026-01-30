import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import orderAdminService from '../../services/admin/order.service';
import { BadRequestError } from '../../errors/apiError/api-error';

class OrderController {
    getOrdersByStaff = async (req: Request, res: Response) => {
        const adminContext = req.adminAccount!;
        const staffId = req.query.staffId;

        if (!staffId || typeof staffId !== 'string') {
            throw new BadRequestError('staffId is required');
        }

        const orders = await orderAdminService.getOrdersByStaffAndAdmin(
            adminContext.id,
            staffId
        );

        res.json(
            ApiResponse.success('Lấy danh sách order thành công!', {
                orders,
            })
        );
    };
}

export default new OrderController();

