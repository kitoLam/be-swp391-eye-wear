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
    /**
     * Hàm xử lí logic tiến hành gia công cho order
     * @param adminContext
     * @param orderId
     * @returns Promise<void>
     * @throws NotFoundRequestError if order not found
     * @throws ConflictRequestError if order is not manufacturing order
     * @throws ForbiddenRequestError if order is not assigned to current operation staff
     */

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
        if (foundOrder.assignedStaff !== adminContext.id) {
            throw new ForbiddenRequestError('This order is not assign to you');
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.MAKING,
        });
    };
    /**
     * Xử lý logic đóng gói cho order
     * @param adminContext - staff hiện tại
     * @param orderId - id của order cần đóng gói
     * @throws NotFoundRequestError - nếu order không tồn tại
     * @throws ForbiddenRequestError - nếu order không được phân công cho staff hiện tại
     */

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
        if (foundOrder.assignedStaff !== adminContext.id) {
            throw new ForbiddenRequestError('This order is not assign to you');
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.PACKAGING,
        });
    };
    /**
     * Xử lý logic hoàn thành cho order
     * @param adminContext - staff hiện tại
     * @param orderId - id của order cần hoàn thành
     * @throws NotFoundRequestError - nếu order không tồn tại
     * @throws ForbiddenRequestError - nếu order không được phân công cho staff hiện tại
     * @description Logic này sẽ thay đổi trạng thái của order sang COMPLETED,
     * sau đó sẽ kiểm tra các order khác trong invoice có trạng thái COMPLETED
     * hay không. Nếu tất cả các order đều COMPLETED thì sẽ thay đổi trạng thái
     * của invoice thành COMPLETED
     */
    completeOrder = async (adminContext: AuthAdminContext, orderId: string) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId,
        });
        if (!foundOrder) {
            throw new NotFoundRequestError('Order not found');
        }
        // chỉ cho staff đc phân chỉnh sửa
        if (foundOrder.assignedStaff !== adminContext.id) {
            throw new ForbiddenRequestError('This order is not assign to you');
        }
        await orderRepository.update(orderId, {
            status: OrderStatus.COMPLETED,
        });
        // nếu các order đều Complete => invoice cũng complete
        const countCompletedOrder = await orderRepository.count({
            invoice: foundOrder.invoiceId,
            status: OrderStatus.COMPLETED,
        });
        const countAllOrder = await orderRepository.count({
            invoice: foundOrder.invoiceId,
        });
        if (countCompletedOrder === countAllOrder) {
            await invoiceRepository.update(foundOrder.invoiceId, {
                status: InvoiceStatus.COMPLETED,
            });
        }
    };

    /**
     * Lấy danh sách order được giao cho staff
     * @param staffId - ID của staff (lấy từ JWT token)
     * @returns Danh sách order được giao cho staff này
     */
    getOrdersByStaffAssigned = async (staffId: string) => {
        const orders = await orderRepository.find({
            deletedAt: null,
            assignedStaff: staffId, // Lấy các order được giao CHO staff này
        });

        return orders;
    };
}
export default new OrderService();
