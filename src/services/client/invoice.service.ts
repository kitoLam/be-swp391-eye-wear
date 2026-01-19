import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';
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

        // 3. Apply voucher discount (if provided)
        let totalDiscount = payload.totalDiscount || 0;

        if (payload.voucher && payload.voucher.length > 0) {
            const voucherCode = payload.voucher[0]; // Support single voucher for now

            // Get voucher from DB
            const voucher = await voucherRepository.findOne({
                code: voucherCode.toUpperCase(),
                deletedAt: null,
            });

            if (!voucher) {
                throw new NotFoundRequestError('Voucher không tồn tại');
            }

            // Check if user has access (for SPECIFIC vouchers)
            if (voucher.applyScope === 'SPECIFIC') {
                const hasAccess = await neo4jVoucherRepository.userHasVoucher(
                    customerId,
                    voucher._id.toString()
                );
                if (!hasAccess) {
                    throw new BadRequestError(
                        'Bạn không có quyền sử dụng voucher này'
                    );
                }
            }

            // Validate voucher
            const now = new Date();
            if (voucher.status !== 'ACTIVE') {
                throw new BadRequestError('Voucher chưa được kích hoạt');
            }
            if (now < voucher.startedDate || now > voucher.endedDate) {
                throw new BadRequestError(
                    'Voucher không trong thời gian sử dụng'
                );
            }
            if (voucher.usageCount >= voucher.usageLimit) {
                throw new BadRequestError('Voucher đã hết lượt sử dụng');
            }
            if (totalPrice < voucher.minOrderValue) {
                throw new BadRequestError(
                    `Giá trị đơn hàng tối thiểu là ${voucher.minOrderValue.toLocaleString()}đ`
                );
            }

            // Calculate discount
            let discount = 0;
            if (voucher.typeDiscount === 'FIXED') {
                discount = voucher.value;
            } else if (voucher.typeDiscount === 'PERCENTAGE') {
                discount = (totalPrice * voucher.value) / 100;
            }

            // Apply max discount limit
            discount = Math.min(discount, voucher.maxDiscountValue);
            discount = Math.min(discount, totalPrice);

            totalDiscount = discount;

            // Mark voucher as used in Neo4j (if SPECIFIC)
            if (voucher.applyScope === 'SPECIFIC') {
                await neo4jVoucherRepository.markVoucherAsUsed(
                    customerId,
                    voucher._id.toString()
                );
            }

            // Increment usage count in MongoDB
            await voucherRepository.incrementUsage(voucher._id.toString());
        }

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
            limit,
            sort: { createdAt: -1 },
        } as any);
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
