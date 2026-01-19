import { Request, Response } from 'express';
import paymentClientService from '../../services/client/payment.service';
import { ApiResponse } from '../../utils/api-response';
import { CreatePayment } from '../../types/payment/payment';

class PaymentController {
    /**
     * Create payment
     */
    createPayment = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as CreatePayment;
        const payment = await paymentClientService.createPayment(
            customerId,
            payload
        );
        res.json(
            ApiResponse.success('Tạo thanh toán thành công!', { payment })
        );
    };

    /**
     * Get payments list
     */
    getPayments = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        const result = await paymentClientService.getPayments(
            customerId,
            page,
            limit,
            status
        );
        res.json(
            ApiResponse.success('Lấy danh sách thanh toán thành công!', result)
        );
    };

    /**
     * Get payment detail
     */
    getPaymentDetail = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const paymentId = req.params.id as string;
        const payment = await paymentClientService.getPaymentDetail(
            customerId,
            paymentId
        );
        res.json(
            ApiResponse.success('Lấy chi tiết thanh toán thành công!', {
                payment,
            })
        );
    };
}

export default new PaymentController();
