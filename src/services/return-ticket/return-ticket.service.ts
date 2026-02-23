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
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { ReturnTicketStatus } from '../../config/enums/return-ticket.enum';
import { OrderStatus } from '../../config/enums/order.enum';

class ReturnTicketService {
    /**
     * Client: Create return ticket
     * Condition: Order status must be COMPLETED and Invoice status must be DELIVERED
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

        // Checking if order is COMPLETED
        if (order.status !== OrderStatus.COMPLETED) {
            throw new ConflictRequestError(
                'Only completed orders can be returned'
            );
        }

        // Find Invoice containing this orderId and check its status
        const invoice = await invoiceRepository.findOne({
            orders: requestBody.orderId,
            owner: customerContext.id,
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

        // Check if return ticket already exists for this order
        const existingTicket = await ReturnTicketModel.findOne({
            orderId: requestBody.orderId,
            deletedAt: null,
        });
        if (existingTicket) {
            throw new ConflictRequestError(
                'Return ticket already exists for this order'
            );
        }

        const returnTicket = new ReturnTicketModel({
            orderId: requestBody.orderId,
            customerId: customerContext.id,
            reason: requestBody.reason,
            description: requestBody.description,
            media: requestBody.media,
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

        // Filter by ownership if context is provided
        if (customerContext) {
            filter.customerId = customerContext.id;
        }

        // If staff filtered by their own verification
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
        adminContext: AuthAdminContext
    ) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');

        returnTicket.status = status;
        returnTicket.staffVerify = adminContext.id; // Automatically update staffVerify when status changes

        return await returnTicket.save();
    };

    /**
     * Staff: Explicitly update staffVerify
     */
    updateStaffVerify = async (id: string, adminContext: AuthAdminContext) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');

        returnTicket.staffVerify = adminContext.id;
        return await returnTicket.save();
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
}

export default new ReturnTicketService();
