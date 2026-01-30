import { orderRepository } from '../../repositories/order/order.repository';
import { AssignmentOrderStatus } from '../../config/enums/order.enum';

class OrderAdminService {
    getOrdersByStaffAndAdmin = async (adminId: string, staffId: string) => {
        const orders = await orderRepository.find({
            deletedAt: null,
            staffId,
            assigneeId: adminId,
            assignmentStatus: AssignmentOrderStatus.ASSIGNED,
        });

        return orders;
    };
}

export default new OrderAdminService();

