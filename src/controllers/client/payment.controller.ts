import { Request, Response } from 'express';
import paymentClientService from '../../services/client/payment.service';
import { ApiResponse } from '../../utils/api-response';
import { CreatePayment } from '../../types/payment/payment';

class PaymentController {
    getVnpayPaymentUrl = async (req: Request, res: Response) => {
      let ipAddr = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress;
      const customerId = req.customer!.id;
      const invoiceId = req.params.invoiceId as string;
      const url = await paymentClientService.getVnPayUrl(customerId, invoiceId, ipAddr as string);
      res.json(ApiResponse.success('Tạo cổng thanh toán vnpay', { url }));
    }
    handlePaymentWithVnPayResult = async (req: Request, res: Response) => {
      let vnp_Params = req.query;
      const result = await paymentClientService.handleVnpayPaymentResultCallback(vnp_Params);
      res.json(ApiResponse.success('Thanh toán vnpay thanh cong', result));
    }

    getZaloPaymentUrl = async (req: Request, res: Response) => {
      const customerId = req.customer!.id;
      const invoiceId = req.params.invoiceId as string;
      const paymentId = req.params.paymentId as string;
      const url = await paymentClientService.getZalopayUrl(customerId, invoiceId, paymentId);
      res.json(ApiResponse.success('Tạo cổng thanh toán zalo thành công', { url }));
    }

    handleZalopayResultCallback = async (req: Request, res: Response) => {
      const result = await paymentClientService.handleZalopayResultCallback({
        dataStr: req.body.data,
        reqMac: req.body.mac
      });
      res.json(ApiResponse.success('Thanh toán zalo thanh cong', result));
    }
}

export default new PaymentController();
