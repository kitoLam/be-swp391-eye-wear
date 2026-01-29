import { RoleType } from '../../config/enums/admin-account';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { OrderStatus, OrderType } from '../../config/enums/order.enum';
import {
    ConflictRequestError,
    ForbiddenRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { AuthAdminContext } from '../../types/context/context';
import { AssignOrderDTO } from '../../types/order/order.request';

class OrderService {
    /**
     * Hàm xử lí logic giao order cho operation staff
     * @param adminContext
     * @param orderId
     * @param payload
     */
    assignOrderToOperationStaff = async (
        adminContext: AuthAdminContext,
        orderId: string,
        payload: AssignOrderDTO
    ) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId,
        });
        if (!foundOrder) {
            throw new NotFoundRequestError('Order not found');
        }
        if (foundOrder.assignedStaff) {
            throw new ConflictRequestError('Order already assigned');
        }
        const foundAssignedStaff = await adminAccountRepository.findOne({
            _id: payload.assignedStaff,
        });
        if (!foundAssignedStaff) {
            throw new NotFoundRequestError('Assigned staff not found');
        }
        if (foundAssignedStaff.role !== RoleType.OPERATION_STAFF) {
            throw new ConflictRequestError(
                'Assigned staff is not operation staff'
            );
        }
        await orderRepository.update(orderId, {
            assignedStaff: payload.assignedStaff,
            assignerStaff: adminContext.id,
            status: OrderStatus.ASSIGNED,
            assignedAt: new Date(),
        });
    };

    makingOrder = async (adminContext: AuthAdminContext, orderId: string) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId,
        });
        if (!foundOrder) {
            throw new NotFoundRequestError('Order not found');
        }
        // nếu order không phải đơn gia công thì ko cho có trạng thái này
        if (!foundOrder.type.includes(OrderType.MANUFACTURING)) {
            throw new ConflictRequestError(
                'This order can not be manufactured'
            );
        }
        // chỉ cho staff đc phân chỉnh sửa
        if(
            foundOrder.assignedStaff !== adminContext.id
        ){
            throw new ForbiddenRequestError(
                'This order is not assign to you'
            );
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.MAKING,
        });
    };
    packagingOrder = async (
        adminContext: AuthAdminContext,
        orderId: string
    ) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId,
        });
        if (!foundOrder) {
            throw new NotFoundRequestError('Order not found');
        }
        // chỉ cho staff đc phân chỉnh sửa
        if(
            foundOrder.assignedStaff !== adminContext.id
        ){
            throw new ForbiddenRequestError(
                'This order is not assign to you'
            );
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.PACKAGING,
        });
    };
    completeOrder = async (adminContext: AuthAdminContext, orderId: string) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId,
        });
        if (!foundOrder) {
            throw new NotFoundRequestError('Order not found');
        }
        // chỉ cho staff đc phân chỉnh sửa
        if(
            foundOrder.assignedStaff !== adminContext.id
        ){
            throw new ForbiddenRequestError(
                'This order is not assign to you'
            );
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.COMPLETED,
        });
        // nếu các order đều Complete => invoice cũng complete
        const foundInvoice = await invoiceRepository.findOne({
            orders: orderId,
        });
        if (foundInvoice) {
            let isCompleteAll = true;
            for (const orderId of foundInvoice.orders) {
                const itemDetail = await orderRepository.findOne({
                    _id: orderId,
                    status: OrderStatus.COMPLETED,
                });
                if (!itemDetail) {
                    isCompleteAll = false;
                    break;
                }
            }
            if (isCompleteAll) {
                await invoiceRepository.update(foundInvoice._id, {
                    status: InvoiceStatus.COMPLETED,
                });
            }
        }
    };
}
export default new OrderService();
