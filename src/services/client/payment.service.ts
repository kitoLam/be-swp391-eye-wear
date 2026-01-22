import { paymentRepository } from '../../repositories/payment/payment.repository';
import { CreatePayment } from '../../types/payment/payment';
import {
    ForbiddenRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import moment from 'moment';
import { orderRepository } from '../../repositories/order/order.repository';
import * as objectUtil from '../../utils/object.util';
class PaymentClientService {
    getVnPayUrl = async (
        customerId: string,
        orderCode: string,
        ipAddr: string
    ) => {
        const orderDetail = await orderRepository.findOne({
            orderCode: orderCode,
            deletedAt: null,
            owner: customerId,
        });
        if (!orderDetail)
            throw new NotFoundRequestError('Đơn hàng không tồn tại');
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        let tmnCode = process.env.VNPAY_TMN_CODE;
        let secretKey = process.env.VNPAY_SECRET;
        let vnpUrl = process.env.VNPAY_URL;
        let returnUrl = `http://localhost:5000/payments/vnpay/result`;
        let orderId = `${orderDetail.orderCode}-${Date.now()}`;
        let amount = orderDetail.payment.finalPrice;
        let bankCode = '';

        let locale = 'vi';
        let currCode = 'VND';
        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = objectUtil.sortObject(vnp_Params);
        const querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require('crypto');
        let hmac = crypto.createHmac('sha512', secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
        return vnpUrl;
    };
    handleVnpayPaymentResult = async (customerId: string, vnp_Params: any, ) => {

        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = objectUtil.sortObject(vnp_Params);

        let secretKey = process.env.VNPAY_SECRET;

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require('crypto');
        let hmac = crypto.createHmac('sha512', secretKey);
        let signed = hmac.update( Buffer.from(signData, 'utf-8')).digest('hex');
        if (secureHash != signed) {
            // chữ kí không hợp lệ
            throw new ForbiddenRequestError('Chữ kí không hợp lệ');
        }
        if (
            vnp_Params.vnp_ResponseCode == '00' &&
            vnp_Params.vnp_TransactionStatus == '00'
        ) {
            const [orderCode, date] = vnp_Params.vnp_TxnRef.split('-');
            // XỬ LÍ LOGIC HẬU THANH TOÁN Ở ĐÂY

            // END XỬ LÍ LOGIC HẬU THANH TOÁN
        } else {
          throw new ForbiddenRequestError('Thanh toán khỏng thành công');
        }
    };
    // /**
    //  * Create new payment for invoice
    //  */
    // createPayment = async (customerId: string, payload: CreatePayment) => {
    //     // 1. Validate invoice exists
    //     const invoice = await invoiceRepository.findById(payload.invoice_id);

    //     if (!invoice) {
    //         throw new NotFoundRequestError('Invoice not found');
    //     }

    //     // 2. Verify ownership
    //     if (invoice.owner !== customerId) {
    //         throw new NotFoundRequestError('Invoice not found');
    //     }

    //     // 3. Calculate final amount needed
    //     const finalAmount = invoice.totalPrice - invoice.totalDiscount;

    //     // 4. Validate payment amount
    //     if (payload.price <= 0) {
    //         throw new BadRequestError('Payment amount must be greater than 0');
    //     }

    //     // 5. Create payment
    //     const payment = await paymentRepository.create({
    //         owner_id: customerId,
    //         invoice_id: payload.invoice_id,
    //         payForOrder: payload.invoice_id, // Keep for backward compatibility
    //         payment_method: payload.payment_method,
    //         price: payload.price,
    //         status: 'UNPAID', // Initially unpaid, will be updated after confirmation
    //         note: payload.note || '',
    //     } as any);

    //     // 6. Update invoice status based on payment amount
    //     if (payload.price >= finalAmount) {
    //         // Full payment
    //         await invoiceRepository.updateStatus(payload.invoice_id, 'PAIDED');
    //     } else if (payload.price > 0 && payload.price < finalAmount) {
    //         // Partial payment (deposit)
    //         await invoiceRepository.updateStatus(
    //             payload.invoice_id,
    //             'DEPOSITED'
    //         );
    //     }

    //     return payment;
    // };

    // /**
    //  * Get customer's payments
    //  */
    // getPayments = async (
    //     customerId: string,
    //     page: number = 1,
    //     limit: number = 10,
    //     status?: string
    // ) => {
    //     const filter: any = {
    //         owner_id: customerId,
    //         deletedAt: null,
    //     };

    //     if (status) {
    //         filter.status = status;
    //     }

    //     const skip = (page - 1) * limit;
    //     const items = await paymentRepository.find(filter, {
    //         limit,
    //         sort: { createdAt: -1 },
    //     } as any);
    //     const total = await paymentRepository.count(filter);

    //     const result = {
    //         items,
    //         pagination: {
    //             page,
    //             limit,
    //             total,
    //             totalPages: Math.ceil(total / limit),
    //         },
    //     };

    //     return result;
    // };

    // /**
    //  * Get payment detail
    //  */
    // getPaymentDetail = async (customerId: string, paymentId: string) => {
    //     const payment = await paymentRepository.findById(paymentId);

    //     if (!payment) {
    //         throw new NotFoundRequestError('Payment not found');
    //     }

    //     // Verify ownership
    //     if (payment.owner_id !== customerId) {
    //         throw new NotFoundRequestError('Payment not found');
    //     }

    //     return payment;
    // };

    // /**
    //  * Mark payment as paid (for admin or payment gateway callback)
    //  */
    // markAsPaid = async (paymentId: string) => {
    //     const payment = await paymentRepository.findById(paymentId);

    //     if (!payment) {
    //         throw new NotFoundRequestError('Payment not found');
    //     }

    //     // Update payment status
    //     const updated = await paymentRepository.update(paymentId, {
    //         status: 'PAID',
    //     } as any);

    //     return updated;
    // };
}

export default new PaymentClientService();
