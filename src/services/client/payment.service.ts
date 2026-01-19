import { paymentRepository } from '../../repositories/payment/payment.repository';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { CreatePayment } from '../../types/payment/payment';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';

class PaymentClientService {
    /**
     * Create new payment for invoice
     */
    createPayment = async (customerId: string, payload: CreatePayment) => {
        // 1. Validate invoice exists
        const invoice = await invoiceRepository.findById(payload.invoice_id);

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // 2. Verify ownership
        if (invoice.owner !== customerId) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // 3. Calculate final amount needed
        const finalAmount = invoice.totalPrice - invoice.totalDiscount;

        // 4. Validate payment amount
        if (payload.price <= 0) {
            throw new BadRequestError('Payment amount must be greater than 0');
        }

        // 5. Create payment
        const payment = await paymentRepository.create({
            owner_id: customerId,
            invoice_id: payload.invoice_id,
            payForOrder: payload.invoice_id, // Keep for backward compatibility
            payment_method: payload.payment_method,
            price: payload.price,
            status: 'UNPAID', // Initially unpaid, will be updated after confirmation
            note: payload.note || '',
        } as any);

        // 6. Update invoice status based on payment amount
        if (payload.price >= finalAmount) {
            // Full payment
            await invoiceRepository.updateStatus(payload.invoice_id, 'PAIDED');
        } else if (payload.price > 0 && payload.price < finalAmount) {
            // Partial payment (deposit)
            await invoiceRepository.updateStatus(
                payload.invoice_id,
                'DEPOSITED'
            );
        }

        return payment;
    };

    /**
     * Get customer's payments
     */
    getPayments = async (
        customerId: string,
        page: number = 1,
        limit: number = 10,
        status?: string
    ) => {
        const filter: any = {
            owner_id: customerId,
            deletedAt: null,
        };

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        const items = await paymentRepository.find(filter, {
            limit,
            sort: { createdAt: -1 },
        } as any);
        const total = await paymentRepository.count(filter);

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
     * Get payment detail
     */
    getPaymentDetail = async (customerId: string, paymentId: string) => {
        const payment = await paymentRepository.findById(paymentId);

        if (!payment) {
            throw new NotFoundRequestError('Payment not found');
        }

        // Verify ownership
        if (payment.owner_id !== customerId) {
            throw new NotFoundRequestError('Payment not found');
        }

        return payment;
    };

    /**
     * Mark payment as paid (for admin or payment gateway callback)
     */
    markAsPaid = async (paymentId: string) => {
        const payment = await paymentRepository.findById(paymentId);

        if (!payment) {
            throw new NotFoundRequestError('Payment not found');
        }

        // Update payment status
        const updated = await paymentRepository.update(paymentId, {
            status: 'PAID',
        } as any);

        return updated;
    };
}

export default new PaymentClientService();
