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
import { OrderStatus, OrderType } from '../../config/enums/order.enum';

class ReturnTicketService {
    /**
     * Client: Create return ticket
     * Conditions:
     * - Order status must be COMPLETED
     * - Invoice containing this order must be DELIVERED
     * - If order type is NORMAL and has more than 1 product, require requestBody.skus
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
            deletedAt: null,
        });
        if (existingTicket) {
            throw new ConflictRequestError(
                'Return ticket already exists for this order'
            );
        }

        const orderTypes = Array.isArray(order.type)
            ? order.type
            : [order.type];
        const isNormalOrder = orderTypes.includes(OrderType.NORMAL);
        const hasMultipleProducts =
            Array.isArray(order.products) && order.products.length > 1;

        if (isNormalOrder && hasMultipleProducts) {
            if (!requestBody.skus || requestBody.skus.length === 0) {
                throw new ConflictRequestError(
                    'This order contains multiple products. Please provide skus to return.'
                );
            }
        }

        // Calculate money for return ticket
        // Formula: money = (totalPrice - totalDiscount) * skuPrice / totalPrice
        let skuPrice = 0;
        if (requestBody.skus && requestBody.skus.length > 0) {
            // Sum pricePerUnit * quantity for matching SKUs
            for (const orderProduct of order.products) {
                if (
                    orderProduct.product &&
                    requestBody.skus.includes(orderProduct.product.sku)
                ) {
                    skuPrice +=
                        orderProduct.product.pricePerUnit *
                        orderProduct.quantity;
                }
                if (
                    orderProduct.lens &&
                    requestBody.skus.includes(orderProduct.lens.sku)
                ) {
                    skuPrice +=
                        orderProduct.lens.pricePerUnit * orderProduct.quantity;
                }
            }
        } else {
            // No skus specified → use entire order price
            skuPrice = order.price;
        }

        const money =
            invoice.totalPrice > 0
                ? ((invoice.totalPrice - invoice.totalDiscount) * skuPrice) /
                  invoice.totalPrice
                : 0;

        const returnTicket = new ReturnTicketModel({
            orderId: requestBody.orderId,
            customerId: customerContext.id,
            reason: requestBody.reason,
            description: requestBody.description,
            media: requestBody.media,
            skus: requestBody.skus ?? null,
            money: Math.round(money),
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
        adminContext: AuthAdminContext
    ) => {
        const returnTicket = await ReturnTicketModel.findById(id);
        if (!returnTicket)
            throw new NotFoundRequestError('Return ticket not found');

        returnTicket.status = status;
        returnTicket.staffVerify = adminContext.id;

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
