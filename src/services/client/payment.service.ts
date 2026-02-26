import { paymentRepository } from '../../repositories/payment/payment.repository';
import {
    ForbiddenRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import moment from 'moment';
import { orderRepository } from '../../repositories/order/order.repository';
import * as objectUtil from '../../utils/object.util';
import { constants, createHmac } from 'node:crypto';
import axios from 'axios';
// import { removeJobFromQueue } from '../../queues/invoice.queue';
import { redisPrefix } from '../../config/constants/redis.constant';
import {
    PaymentMethodType,
    PaymentStatus,
} from '../../config/enums/payment.enum';
import { productRepository } from '../../repositories/product/product.repository';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import invoiceService from './invoice.service';
import { removeJobFromQueue } from '../../queues/invoice.queue';
import { ProductVariantMode } from '../../config/enums/product.enum';
import { PreOrderImportModel } from '../../models/pre-order-import/pre-order-import.model.mongo';
class PaymentClientService {
    handlePaymentCallback = async (invoiceId: string, paymentId: string) => {
        // xóa timeout job
        removeJobFromQueue({
            invoiceId: invoiceId,
        });
        const invoiceDetail = await invoiceRepository.findOne({
            _id: invoiceId,
            deletedAt: null,
        });
        const paymentDetail = await paymentRepository.findOne({
            _id: paymentId,
            status: PaymentStatus.UNPAID,
            deletedAt: null,
        });
        if (invoiceDetail && paymentDetail) {
            // trừ stock thật mongo
            const itemsUpdateRedis: { key: string; qty: number }[] = [];
            const itemsUpdateMongo: {
                id: string;
                sku: string;
                qty: number;
            }[] = [];
            const orderList = await orderRepository.findAllNoPagination({
                invoiceId: invoiceDetail._id,
            });
            for (const orderDetail of orderList) {
                if (orderDetail) {
                    for (const item of orderDetail.products) {
                        if (item.lens) {
                            const key = `${redisPrefix.productLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                            itemsUpdateRedis.push({
                                key,
                                qty: item.quantity,
                            });
                            itemsUpdateMongo.push({
                                id: item.lens.lens_id,
                                sku: item.lens.sku,
                                qty: item.quantity,
                            });
                        }
                        if (item.product) {
                            const key = `${redisPrefix.productLockOnline}:${item.product.product_id}:${item.product.sku}`;
                            itemsUpdateRedis.push({
                                key,
                                qty: item.quantity,
                            });
                            itemsUpdateMongo.push({
                                id: item.product.product_id,
                                sku: item.product.sku,
                                qty: item.quantity,
                            });
                        }
                    }
                }
            }
            // trừ stock trong mongo
            for (const item of itemsUpdateMongo) {
                const foundProduct = await productRepository.findOne({
                    _id: item.id,
                    'variants.sku': item.sku,
                })!;
                if (!foundProduct) {
                    throw new NotFoundRequestError('Not found product');
                }
                const productVariant = foundProduct.variants.find(
                    v => v.sku === item.sku
                );
                if (!productVariant) {
                    throw new NotFoundRequestError(
                        `Product with sku ${item.sku} not found`
                    );
                }
                if (productVariant.mode == ProductVariantMode.AVAILABLE) {
                    await productRepository.updateByFilter(
                        {
                            _id: item.id,
                            'variants.sku': item.sku,
                        },
                        {
                            $inc: {
                                'variants.$.stock': item.qty,
                            },
                        }
                    );
                } else {
                    await PreOrderImportModel.updateOne(
                        {
                            sku: item.sku,
                        },
                        {
                            $inc: {
                                preOrderedQuantity: -item.qty,
                            },
                        }
                    );
                }
                await productRepository.updateByFilter(
                    {
                        _id: item.id,
                        'variants.sku': item.sku,
                    },
                    { $inc: { 'variants.$.stock': -item.qty } }
                );
            }
            await invoiceService.releaseProductLock(itemsUpdateRedis, 'online');
            // cập nhật payment thành PAID
            await paymentRepository.updateByFilter(
                { _id: paymentId },
                { status: PaymentStatus.PAID }
            );
            // Cập nhật invoice status
            await invoiceRepository.updateByFilter(
                { _id: invoiceId },
                { status: InvoiceStatus.DEPOSITED }
            );
        }
    };

    getVnPayUrl = async (
        customerId: string,
        invoiceId: string,
        ipAddr: string
    ) => {
        const invoiceDetail = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customerId,
        });
        if (!invoiceDetail)
            throw new NotFoundRequestError('Đơn hàng không tồn tại');

        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        let tmnCode = process.env.VNPAY_TMN_CODE;
        let secretKey = process.env.VNPAY_SECRET;
        let vnpUrl = process.env.VNPAY_URL;
        let returnUrl = process.env.VNPAY_RETURN_URL; //process.env.VNPAY_RETURN_URL;
        // TODO: Fix - orderCode and payment properties don't exist on Order model
        // let orderId = `${orderDetail.orderCode}-${Date.now()}`;
        // let amount = orderDetail.payment.finalPrice;
        let vnPayOrderId = `${invoiceDetail._id.toString()}-${Date.now()}`;
        let amount =
            (invoiceDetail.totalPrice - invoiceDetail.totalDiscount) * 100;
        let bankCode = '';

        let locale = 'vi';
        let currCode = 'VND';
        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = vnPayOrderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + vnPayOrderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount;
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
    handleVnpayPaymentResultCallback = async (vnp_Params: any) => {
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = objectUtil.sortObject(vnp_Params);

        let secretKey = process.env.VNPAY_SECRET;

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require('crypto');
        let hmac = crypto.createHmac('sha512', secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        if (secureHash != signed) {
            // chữ kí không hợp lệ
            throw new ForbiddenRequestError('Chữ kí không hợp lệ');
        }
        if (
            vnp_Params.vnp_ResponseCode == '00' &&
            vnp_Params.vnp_TransactionStatus == '00'
        ) {
            const [invoiceId, date] = vnp_Params.vnp_TxnRef.split('-');
            // XỬ LÍ LOGIC HẬU THANH TOÁN Ở ĐÂY
            console.log('>>> invoiceId::', invoiceId);
            const paymentDetail = await paymentRepository.findOne({
                invoiceId: invoiceId,
                deletedAt: null
            });
            if(!paymentDetail){
                throw new NotFoundRequestError("Not found payment to handle");
            }
            await this.handlePaymentCallback(invoiceId, paymentDetail._id.toString());
            // END XỬ LÍ LOGIC HẬU THANH TOÁN
        } else {
            throw new ForbiddenRequestError('Thanh toán khỏng thành công');
        }
    };

    getZalopayUrl = async (
        customerId: string,
        invoiceId: string,
        paymentId: string
    ) => {
        const existInvoice = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customerId,
            deletedAt: null,
        });
        if (!existInvoice) {
            throw new NotFoundRequestError('Đơn hàng không tồn tại');
        }

        // app info
        const app_id = process.env.ZALO_APP_ID;
        const key1 = process.env.ZALO_KEY1;
        const key2 = process.env.ZALO_KEY2;
        const apiZalopay = process.env.ZALO_API;
        const transID = Math.floor(Math.random() * 1000000);
        const embed_data = {
            invoiceId,
            paymentId,
            // sau khi gọi call back thành công, zalo đẩy chuyển UI từ màn hình thanh toán zalo sang màn hình app
            // redirecturl: `${process.env.API_FE_CLIENT}/orders/success?orderCode=${orderCode}`,
        };
        const order = {
            app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: `${existInvoice.owner}`,
            app_time: Date.now(), // miliseconds
            item: JSON.stringify([]),
            embed_data: JSON.stringify(embed_data),
            // amount: Math.round(Number(existOrder.payment.finalPrice)),
            amount: existInvoice.totalPrice - existInvoice.totalDiscount, // Placeholder
            description: `Thanh toán hóa đơn #${invoiceId}`,
            bank_code: '', // zalopayapp -> scan QR
            mac: '',
            callback_url: `${process.env.APP_API}/payments/zalopay/result-callback`, // sau khi zalo pay thực hiện xong việc thanh toán thu tiền, sẽ chạy vào callback_url để xử lí tiếp
        };
        const data =
            app_id +
            '|' +
            order.app_trans_id +
            '|' +
            order.app_user +
            '|' +
            order.amount +
            '|' +
            order.app_time +
            '|' +
            order.embed_data +
            '|' +
            order.item;
        order.mac = createHmac('sha256', `${key1}`).update(data).digest('hex');
        const resAxios = await axios.post(`${apiZalopay}`, null, {
            params: order,
        });
        console.log(resAxios);
        return resAxios.data.order_url;
    };

    handleZalopayResultCallback = async (zaloPayload: {
        reqMac: string;
        dataStr: string;
    }) => {
        const key2: any = `${process.env.ZALO_KEY2}`;
        let result: any = {};
        const { reqMac, dataStr } = zaloPayload;
        try {
            let mac = createHmac('sha256', key2).update(dataStr).digest('hex');
            // kiểm tra callback hợp lệ (đến từ ZaloPay server)
            if (reqMac !== mac) {
                // callback không hợp lệ
                result.return_code = -1;
                result.return_message = 'mac not equal';
            } else {
                // thanh toán thành công
                // merchant cập nhật trạng thái cho đơn hàng
                // dataJson chứa app_user chứa thống thông tin khách hàng
                let dataJson = JSON.parse(dataStr, key2);
                const embedData = dataJson.embed_data
                    ? JSON.parse(dataJson.embed_data)
                    : {};
                const { invoiceId, paymentId } = embedData;
                await this.handlePaymentCallback(invoiceId, paymentId);
                // cập nhật payment là đã thanh toán
                result.return_code = 1;
                result.return_message = 'success';
            }
        } catch (ex: any) {
            result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
            result.return_message = ex.message;
        }
        // đây là result ta trả cho zalo pay khi zalo gọi đến api này
        return result;
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
