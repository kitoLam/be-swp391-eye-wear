import { Request, Response } from 'express';
import voucherClientService from '../../services/client/voucher.service';
import { ApiResponse } from '../../utils/api-response';
import { ValidateVoucherPayload } from '../../services/client/voucher.service';

class VoucherClientController {
    /**
     * Get my vouchers
     */
    getMyVouchers = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const result = await voucherClientService.getMyVouchers(customerId);
        res.json(
            ApiResponse.success('Lấy danh sách voucher thành công!', result)
        );
    };

    /**
     * Validate voucher
     */
    validateVoucher = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as ValidateVoucherPayload;
        const result = await voucherClientService.validateVoucher(
            customerId,
            payload
        );
        res.json(ApiResponse.success('Voucher hợp lệ!', result));
    };

    /**
     * Get available vouchers (public)
     */
    getAvailableVouchers = async (req: Request, res: Response) => {
        const result = await voucherClientService.getAvailableVouchers();
        res.json(
            ApiResponse.success(
                'Lấy danh sách vouchers khả dụng thành công!',
                result
            )
        );
    };

    /**
     * Assign voucher (Test)
     */
    assignVoucher = async (req: Request, res: Response) => {
        const { customerId, voucherId, metadata } = req.body;
        const result = await voucherClientService.assignVoucher(
            customerId,
            voucherId,
            metadata
        );
        res.json(ApiResponse.success('Assign voucher success', result));
    };
}

export default new VoucherClientController();
