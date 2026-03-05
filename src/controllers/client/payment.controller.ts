import { Request, Response } from 'express';
import paymentClientService from '../../services/client/payment.service';
import { ApiResponse } from '../../utils/api-response';
import { CreatePayment } from '../../types/payment/payment';
import { config } from '../../config/env.config';

class PaymentController {
    getVnpayPaymentUrl = async (req: Request, res: Response) => {
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const customerId = req.customer!.id;
        const invoiceId = req.params.invoiceId as string;
        const url = await paymentClientService.getVnPayUrl(
            customerId,
            invoiceId,
            ipAddr as string
        );
        res.json(ApiResponse.success('Tạo cổng thanh toán vnpay', { url }));
    };
    handlePaymentWithVnPayResult = async (req: Request, res: Response) => {
        let vnp_Params = req.query;
        const { isSuccess, invoiceId } =
            await paymentClientService.handleVnpayPaymentResultCallback(
                vnp_Params
            );
        res.redirect(
            `${config.cors.origin[2]}/payment-result?isSuccess=${isSuccess}&invoiceId=${invoiceId}`
        );
    };

    getZaloPaymentUrl = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const invoiceId = req.params.invoiceId as string;
        const paymentId = req.params.paymentId as string;
        const url = await paymentClientService.getZalopayUrl(
            customerId,
            invoiceId,
            paymentId
        );
        res.json(
            ApiResponse.success('Tạo cổng thanh toán zalo thành công', { url })
        );
    };
    getPayosPaymentUrl = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const invoiceId = req.params.invoiceId as string;
        const paymentId = req.params.paymentId as string;
        const url = await paymentClientService.getPayosUrl(
            customerId,
            invoiceId,
            paymentId
        );
        res.json(
            ApiResponse.success('Tạo cổng thanh toán payos thành công', { url })
        );
    };

    handlePayOsResultCallback = async (req: Request, res: Response) => {
        // const payload = req.body.data as any;
        // const [_notUseVar, paymentId] = payload.description.split(" ");
        // console.log(">>> paymentId::", paymentId);
        // await paymentClientService.handlePayosResultCallback(paymentId);
        res.json(ApiResponse.success('Thanh toán payos thanh cong', null));
    };

    handleZalopayResultCallback = async (req: Request, res: Response) => {
        const result = await paymentClientService.handleZalopayResultCallback({
            dataStr: req.body.data,
            reqMac: req.body.mac,
        });
        res.json(ApiResponse.success('Thanh toán zalo thanh cong', result));
    };

    getPaymentDetail = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const paymentId = req.params.paymentId as string;
        const payment = await paymentClientService.getPaymentDetail(
            customerId,
            paymentId
        );
        res.json(
            ApiResponse.success('Lấy thông tin thanh toán thành công', payment)
        );
    };
}

export default new PaymentController();
