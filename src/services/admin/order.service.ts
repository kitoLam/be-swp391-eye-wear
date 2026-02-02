import { FilterQuery } from 'mongoose';
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
import { OrderListAdminQuery, OrderStatsQuery } from '../../types/order/order.query';
import { AssignOrderDTO } from '../../types/order/order.request';
import { IOrderDocument } from '../../models/order/order.model.mongo';

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
    getOrdersByStaffAssigned = async (staffId: string, query: OrderListAdminQuery) => {
        const filter : FilterQuery<IOrderDocument> = {};
        if(query.orderCode){
            filter.orderCode = new RegExp(query.orderCode, 'gi');
        }
        if(query.status){
            filter.status = query.status;
        }
        const orders = await orderRepository.find({
            ...filter,
            deletedAt: null,
            assignedStaff: staffId, // Lấy các order được giao CHO staff này
        }, {
            limit: query.limit,
            page: query.page
        });

        return orders;
    };
    
    /**
     * Lấy chi tiết đơn hàng theo id
     * @param id - ID của đơn hàng
     * @returns Chi tiết đơn hàng
     * @throws {NotFoundRequestError} Nếu đơn hàng không tồn tại
     */
    getOrderDetail = async (id: string) => {
        const order = await orderRepository.findOne({
            _id: id,
        });
        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }
        return order;
    }

    /**
     * Lấy thống kê đơn hàng của staff
     * @param query.staffId - ID của staff
     * @returns Thống kê đơn hàng của staff này
     * @property {number} totalAssigned - Tổng số đơn hàng được giao cho staff (nhưng chưa xử lí)
     * @property {number} totalMaking - Tổng số đơn hàng đang được sản xuất
     * @property {number} totalPackaging - Tổng số đơn hàng đang được đóng gói
     * @property {number} totalCompleted - Tổng số đơn hàng đang được đóng gói
     * @property {number} totalPreOrder - Tổng số đơn hàng trước khi được sản xuất
     * @throws {NotFoundRequestError} Nếu staff không tồn tại
     */
    getOrderSummary = async (query: OrderStatsQuery) => {
        const foundStaff = await adminAccountRepository.findOne({
            _id: query.staffId
        });
        if(!foundStaff){
            throw new NotFoundRequestError('Staff not found');
        }
        const totalASSIGNED = await orderRepository.count({ deletedAt: null, status: OrderStatus.ASSIGNED, assignedStaff: query.staffId });
        const totalMAKING = await orderRepository.count({ deletedAt: null, status: OrderStatus.MAKING, assignedStaff: query.staffId });
        const totalPACKAGING = await orderRepository.count({ deletedAt: null, status: OrderStatus.PACKAGING, assignedStaff: query.staffId });
        const totalWaitingPreOrder = 0 //await orderRepository.count({ deletedAt: null, status: OrderStatus.PACKAGING, assignedStaff: query.staffId });

        return {
            totalAssigned: totalASSIGNED,
            totalMaking: totalMAKING,
            totalPackaging: totalPACKAGING,
            totalWaitingPreOrder: totalWaitingPreOrder
        }
    }

    getOrderPendingBreakdown = async (query: OrderStatsQuery) => {
        const foundStaff = await adminAccountRepository.findOne({
            _id: query.staffId
        });
        if(!foundStaff){
            throw new NotFoundRequestError('Staff not found');
        }
        const totalInProcessingOrders = await orderRepository.count({ deletedAt: null, $or: [{ status: OrderStatus.ASSIGNED }, { status: OrderStatus.MAKING }, { status: OrderStatus.PACKAGING }], assignedStaff: query.staffId });
        const totalASSIGNED = await orderRepository.count({ deletedAt: null, status: OrderStatus.ASSIGNED, assignedStaff: query.staffId });
        const totalMAKING = await orderRepository.count({ deletedAt: null, status: OrderStatus.MAKING, assignedStaff: query.staffId });
        const totalPACKAGING = await orderRepository.count({ deletedAt: null, status: OrderStatus.PACKAGING, assignedStaff: query.staffId });
        const totalWaitingPreOrder = 0 //await orderRepository.count({ deletedAt: null, status: OrderStatus.PACKAGING, assignedStaff: query.staffId });

        return {
            total: totalInProcessingOrders,
            assigned: {
                total: totalASSIGNED,
                percentage: Math.round((totalASSIGNED / totalInProcessingOrders) * 100)
            },
            making: {
                total: totalMAKING,
                percentage: Math.round((totalMAKING / totalInProcessingOrders) * 100)
            },
            packaging: {
                total: totalPACKAGING,
                percentage: Math.round((totalPACKAGING / totalInProcessingOrders) * 100)
            },
            waitingPreOrder: {
                total: totalWaitingPreOrder,
                percentage: Math.round((totalWaitingPreOrder / totalInProcessingOrders) * 100)
            }
        }
    }

    approveOrder = async (adminContext: AuthAdminContext, orderId: string) => {
        const foundOrder = await orderRepository.findOne({
            _id: orderId
        });
        if(!foundOrder){
            throw new NotFoundRequestError('Order not found');
        }
        
        if(foundOrder.status !== OrderStatus.PENDING){
            throw new ConflictRequestError('Only approve order is pending!');
        }
        
        await orderRepository.update(orderId, {
            status: OrderStatus.APPROVED
        });
        
    }
}
export default new OrderService();
