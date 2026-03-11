import { FilterQuery } from 'mongoose';
import {
    IReturnTicketDocument,
    ReturnTicketModel,
} from '../../models/return-ticket/return-ticket.model';
import {
    AuthAdminContext,
    AuthCustomerContext,
} from '../../types/context/context';
import {
    CreateReturnTicketRequest,
    ReturnTicketListQuery,
} from '../../types/return-ticket/return-ticket.request';
import returnTicketRepository from '../../repositories/return-ticket/return-ticket.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import {
    BadRequestError,
    ConflictRequestError,
    ForbiddenRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { ReturnTicketStatus } from '../../config/enums/return-ticket.enum';
import { OrderStatus } from '../../config/enums/order.enum';
import { config } from '../../config/env.config';
import axios from 'axios';

class ReturnTicketService {
    /**
     * Client: Create return ticket
     * Conditions:
     * - Order status must be COMPLETED
     * - Invoice containing this order must be DELIVERED
     * - Trả hàng theo toàn bộ order
     */
    createReturnTicket = async (
        customerContext: AuthCustomerContext,
        requestBody: CreateReturnTicketRequest
    ) => {
        const order = await orderRepository.findOne({
            _id: requestBody.orderId,
        });

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        if (order.status !== OrderStatus.COMPLETED) {
            throw new ConflictRequestError(
                'Only completed orders can be returned'
            );
        }

        const invoice = await invoiceRepository.findOne({
            _id: order.invoiceId,
            // owner: customerContext.id,
        });

        if (!invoice) {
            throw new NotFoundRequestError(
                'Invoice containing this order not found'
            );
        }

        if (invoice.status !== InvoiceStatus.DELIVERED) {
            throw new ConflictRequestError(
                'Only orders from DELIVERED invoices can be returned'
            );
        }

        const existingTicket = await ReturnTicketModel.findOne({
            orderId: requestBody.orderId,
            status: {
                $nin: [ReturnTicketStatus.CANCEL, ReturnTicketStatus.REJECTED],
            },
        });
        if (existingTicket) {
            throw new ConflictRequestError(
                'Return ticket already exists for this order'
            );
        }

        // Trả hàng theo toàn bộ order với quantity cụ thể.
        // Doanh thu tính theo tiền hàng sau giảm giá, KHÔNG tính phí ship.
        // Phân bổ discount theo tỷ trọng giá order trong tổng tiền hàng của invoice.
        const allOrdersInInvoice = await orderRepository.findAllNoPagination({
            invoiceId: invoice._id,
            deletedAt: null,
        });

        const grossItemsAmount = allOrdersInInvoice.reduce(
            (sum, currentOrder) => sum + (currentOrder.price || 0),
            0
        );

        const orderGrossAmount = order.price || 0;

        const discountAllocatedToOrder =
            grossItemsAmount > 0
                ? (invoice.totalDiscount * orderGrossAmount) / grossItemsAmount
                : 0;

        const netOrderAmount = Math.max(
            0,
            orderGrossAmount - discountAllocatedToOrder
        );

        const returnTicket = new ReturnTicketModel({
            orderId: requestBody.orderId,
            customerId: customerContext.id,
            reason: requestBody.reason,
            description: requestBody.description,
            media: requestBody.media,
            quantity: order.products[0].quantity,
            money: Math.round(netOrderAmount),
            status: ReturnTicketStatus.PENDING,
        });

        return await returnTicket.save();
    };

    /**
     * Common: Get return ticket list (with filters)
     */
    getReturnTicketList = async (
        query: ReturnTicketListQuery,
        customerContext?: AuthCustomerContext,
        _adminContext?: AuthAdminContext
    ) => {
        const filter: FilterQuery<IReturnTicketDocument> = { deletedAt: null };

        if (query.status) {
            filter.status = query.status;
        }
        if (query.orderId) {
            filter.orderId = query.orderId;
        }

        if (customerContext) {
            filter.customerId = customerContext.id;
        }

        if (query.staffVerify) {
            filter.staffVerify = query.staffVerify;
        }

        if (query.search) {
            const regex = new RegExp(query.search, 'gi');
            filter.$or = [
                { reason: regex },
                { description: regex },
                { orderId: regex },
            ];
        }

        const result = await returnTicketRepository.find(filter, {
            limit: query.limit,
            page: query.page,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        return {
            returnTicketList: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    };

    /**
     * Staff: Update status (Generic)
     */
    updateStatus = async (
        id: string,
        status: ReturnTicketStatus,
        adminContext?: AuthAdminContext
    ) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');

        // validate same staff
        if(status != ReturnTicketStatus.CANCEL){
            if(returnTicket.staffVerify != adminContext!.id){
                throw new ForbiddenRequestError('This ticket is currently verified by another staff');
            }
        }
        // Validate status transition
        this.validateStatusTransition(returnTicket.status, status);

        returnTicket.status = status;

        return await returnTicket.save();
    };

    /**
     * Validate status transition based on workflow:
     * PENDING -> APPROVED/CANCEL/REJECTED -> IN_PROGRESS -> DELIVERING -> RETURNED/FAIL_RETURNED
     */
    private validateStatusTransition = (
        currentStatus: ReturnTicketStatus,
        newStatus: ReturnTicketStatus
    ) => {
        const validTransitions: Record<ReturnTicketStatus, ReturnTicketStatus[]> = {
            [ReturnTicketStatus.PENDING]: [
                ReturnTicketStatus.APPROVED,
                ReturnTicketStatus.CANCEL,
                ReturnTicketStatus.REJECTED,
            ],
            [ReturnTicketStatus.APPROVED]: [ReturnTicketStatus.IN_PROGRESS],
            [ReturnTicketStatus.IN_PROGRESS]: [ReturnTicketStatus.DELIVERING],
            [ReturnTicketStatus.DELIVERING]: [
                ReturnTicketStatus.RETURNED,
                ReturnTicketStatus.FAIL_RETURNED,
            ],
            [ReturnTicketStatus.CANCEL]: [],
            [ReturnTicketStatus.REJECTED]: [],
            [ReturnTicketStatus.RETURNED]: [],
            [ReturnTicketStatus.FAIL_RETURNED]: [],
        };

        const allowedStatuses = validTransitions[currentStatus] || [];

        if (!allowedStatuses.includes(newStatus)) {
            throw new ConflictRequestError(
                `Cannot update status from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedStatuses.join(', ') || 'None (final status)'}`
            );
        }
    };

    /**
     * Staff: Explicitly update staffVerify
     */
    updateStaffVerify = async (id: string, adminContext: AuthAdminContext) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');
        if(returnTicket.staffVerify)
            throw new BadRequestError('Return ticket already verified');
        returnTicket.staffVerify = adminContext.id;
        return await returnTicket.save();
    };

    getReturnedOrders = async (query: ReturnTicketListQuery) => {
        const filter: FilterQuery<IReturnTicketDocument> = {
            deletedAt: null,
            status: ReturnTicketStatus.RETURNED,
        };

        if (query.search) {
            const regex = new RegExp(query.search, 'gi');
            filter.$or = [{ orderId: regex }, { reason: regex }];
        }

        const result = await returnTicketRepository.find(filter, {
            limit: query.limit,
            page: query.page,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        const returnedOrderIds = result.data.map(item => item.orderId);
        const returnedOrders = await orderRepository.findAllNoPagination({
            _id: { $in: returnedOrderIds },
            deletedAt: null,
        });

        const orderMap = new Map(
            returnedOrders.map(order => [order._id.toString(), order])
        );

        return {
            returnedOrders: result.data.map(ticket => ({
                returnTicket: ticket,
                order: orderMap.get(ticket.orderId) ?? null,
            })),
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    };

    /**
     * Get detail
     */
    getReturnTicketDetail = async (id: string, customerId?: string) => {
        const filter: any = { _id: id, deletedAt: null };
        if (customerId) filter.customerId = customerId;

        const returnTicket = await ReturnTicketModel.findOne(filter);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');
        return returnTicket;
    };

    /**
     * Mark return ticket as IN_PROGRESS and call shipment API
     * @param id - ID of the return ticket
     * @param adminContext - Context of the admin user
     */
    startReturnShipment = async (
        id: string,
        adminContext: AuthAdminContext
    ) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket) {
            throw new NotFoundRequestError('Return ticket not found');
        }

        // Logic check: Chỉ cho phép từ APPROVED sang IN_PROGRESS
        if (returnTicket.status !== ReturnTicketStatus.APPROVED) {
            throw new ConflictRequestError(
                'Return ticket status must be APPROVED to update to IN_PROGRESS'
            );
        }

        // Logic check: userId trong token phải trùng với staffVerify
        if (returnTicket.staffVerify !== adminContext.id) {
            throw new ConflictRequestError(
                'Only the assigned staff can update this return ticket to IN_PROGRESS'
            );
        }

        // Lấy thông tin order và invoice để lấy địa chỉ
        const order = await orderRepository.findOne({
            _id: returnTicket.orderId,
        });
        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        const invoice = await invoiceRepository.findOne({
            _id: order.invoiceId,
        });
        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Cập nhật trạng thái IN_PROGRESS
        returnTicket.status = ReturnTicketStatus.IN_PROGRESS;
        const updatedTicket = await returnTicket.save();

        // ============ Call api shipment =============
        const api = config.shipment.createApi;
        const bodyData = {
            invoiceId: `${returnTicket._id.toString()}`,
            shipAddress:
                invoice.address.street +
                ', ' +
                invoice.address.ward +
                ', ' +
                invoice.address.city,
            successUrlCallback: `https://eyewear-backend.xyz/api/v1/admin/return-tickets/${id}/status/returned`,
            failUrlCallback: `https://eyewear-backend.xyz/api/v1/admin/return-tickets/${id}/status/fail-returned`,
            receiveUrlCallback: `https://eyewear-backend.xyz/api/v1/admin/return-tickets/${id}/status/delivering`,
        };
        try {
            const response = await axios.post<{
                data: { shipCode: string; estimatedShipDate: string };
            }>(api, bodyData);
            return {
                updatedTicket,
                shipmentData: response.data.data,
            };
        } catch (error) {
            throw new Error('Failed to call api shipment');
        }
    };

    /**
     * Mark return ticket as DELIVERING
     * NO AUTHENTICATION REQUIRED - Public endpoint (callback from shipment)
     * @param id - ID of the return ticket
     */
    deliveringReturnTicket = async (id: string) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket) {
            throw new NotFoundRequestError('Return ticket not found');
        }

        if (
            returnTicket.status === ReturnTicketStatus.CANCEL ||
            returnTicket.status === ReturnTicketStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot update status of a canceled or rejected return ticket'
            );
        }

        returnTicket.status = ReturnTicketStatus.DELIVERING;
        await returnTicket.save();
    };

    /**
     * Mark return ticket as RETURNED
     * NO AUTHENTICATION REQUIRED - Public endpoint (callback from shipment)
     * @param id - ID of the return ticket
     */
    returnedReturnTicket = async (id: string) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket) {
            throw new NotFoundRequestError('Return ticket not found');
        }

        if (
            returnTicket.status === ReturnTicketStatus.CANCEL ||
            returnTicket.status === ReturnTicketStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot update status of a canceled or rejected return ticket'
            );
        }

        returnTicket.status = ReturnTicketStatus.RETURNED;
        const updatedTicket = await returnTicket.save();

        return updatedTicket;
    };

    /**
     * Mark return ticket as FAIL_RETURNED
     * NO AUTHENTICATION REQUIRED - Public endpoint (callback from shipment)
     * @param id - ID of the return ticket
     */
    failReturnedReturnTicket = async (id: string) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket) {
            throw new NotFoundRequestError('Return ticket not found');
        }

        if (
            returnTicket.status === ReturnTicketStatus.CANCEL ||
            returnTicket.status === ReturnTicketStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot update status of a canceled or rejected return ticket'
            );
        }

        // Chỉ cho phép chuyển sang FAIL_RETURNED từ trạng thái DELIVERING
        if (returnTicket.status !== ReturnTicketStatus.DELIVERING) {
            throw new ConflictRequestError(
                'Return ticket status must be DELIVERING to update to FAIL_RETURNED'
            );
        }

        returnTicket.status = ReturnTicketStatus.FAIL_RETURNED;
        const updatedTicket = await returnTicket.save();

        return updatedTicket;
    };
}

export default new ReturnTicketService();
