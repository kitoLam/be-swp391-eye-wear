import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { CreateInvoice, UpdateInvoice } from '../../types/invoice/invoice';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';

class InvoiceClientService {
    /**
     * Create new invoice from orders
     */
    createInvoice = async (customerId: string, payload: CreateInvoice) => {
        // 1. Validate orders exist
        const orders = await Promise.all(
            payload.orders.map(orderId => orderRepository.findById(orderId))
        );

        // Check if any order not found
        if (orders.some(order => !order)) {
            throw new NotFoundRequestError('One or more orders not found');
        }

        // 2. Calculate total price from orders
        const totalPrice = orders.reduce(
            (sum, order) => sum + (order?.price || 0),
            0
        );

        // 3. Apply voucher discount (simplified - actual logic may involve voucher validation)
        // For now, we'll use the discount from payload or calculate it
        const totalDiscount = payload.totalDiscount || 0;

        // 4. Validate discount
        if (totalDiscount > totalPrice) {
            throw new BadRequestError(
                'Total discount cannot exceed total price'
            );
        }

        // 5. Create invoice
        const invoice = await invoiceRepository.create({
            ...payload,
            owner: customerId,
            totalPrice,
            totalDiscount,
            status: 'PENDING',
        } as any);

        return invoice;
    };

    /**
     * Get customer's invoices
     */
    getInvoices = async (
        customerId: string,
        page: number = 1,
        limit: number = 10,
        status?: string
    ) => {
        const filter: any = {
            owner: customerId,
            deletedAt: null,
        };

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        const items = await invoiceRepository.find(filter, {
            skip,
            limit,
            sort: { createdAt: -1 },
        });
        const total = await invoiceRepository.count(filter);

        const result = {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        return result;
    };

    /**
     * Get invoice detail
     */
    getInvoiceDetail = async (customerId: string, invoiceId: string) => {
        const invoice = await invoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Verify ownership
        if (invoice.owner !== customerId) {
            throw new NotFoundRequestError('Invoice not found');
        }

        return invoice;
    };

    /**
     * Update invoice
     */
    updateInvoice = async (
        customerId: string,
        invoiceId: string,
        payload: UpdateInvoice
    ) => {
        const invoice = await invoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Verify ownership
        if (invoice.owner !== customerId) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Update invoice
        const updated = await invoiceRepository.update(invoiceId, payload);
        return updated;
    };
}

export default new InvoiceClientService();
