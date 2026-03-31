import { Request, Response } from 'express';
import voucherClientService from '../../services/client/voucher.service';
import { ApiResponse } from '../../utils/api-response';
import { ValidateVoucherPayload } from '../../services/client/voucher.service';

class VoucherClientController {
    /**
     * Get vouchers by clientId (Supabase)
     */
    getVouchersByClientId = async (req: Request, res: Response) => {
        const clientId = req.params.clientId as string;
        const result = await voucherClientService.getVouchersByClientId(clientId);
        res.json(ApiResponse.success('Get voucher list successfully!', result));
    };

    /**
     * Get my vouchers
     */
    getMyVouchers = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const result = await voucherClientService.getMyVouchers(customerId);
        res.json(
            ApiResponse.success('Get voucher list successfully!', result)
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
        res.json(ApiResponse.success('Voucher is valid!', result));
    };

    /**
     * Get available vouchers (public)
     */
    getAvailableVouchers = async (req: Request, res: Response) => {
        const result = await voucherClientService.getAvailableVouchers();
        res.json(
            ApiResponse.success(
                'Get available vouchers successfully!',
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

    /**
     * Claim voucher - Update status from WAITING_CLAIM to CLAIMED
     */
    claimVoucher = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const { voucherCode } = req.body;

        if (!voucherCode) {
            return res.status(400).json(
                ApiResponse.error('Please provide a voucher code')
            );
        }

        const result = await voucherClientService.claimVoucher(customerId, voucherCode);
        res.json(ApiResponse.success('Claimed voucher successfully!', result));
    };
}

export default new VoucherClientController();
