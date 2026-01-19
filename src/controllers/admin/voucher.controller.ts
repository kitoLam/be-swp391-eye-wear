import { Request, Response } from 'express';
import voucherAdminService from '../../services/admin/voucher.service';
import { ApiResponse } from '../../utils/api-response';
import { CreateVoucher, UpdateVoucher } from '../../types/voucher/voucher';

class VoucherAdminController {
    /**
     * Create voucher
     */
    createVoucher = async (req: Request, res: Response) => {
        const payload = req.body as CreateVoucher;
        const voucher = await voucherAdminService.createVoucher(payload);
        res.json(ApiResponse.success('Tạo voucher thành công!', { voucher }));
    };

    /**
     * Get vouchers list
     */
    getVouchers = async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const applyScope = req.query.applyScope as string;

        const result = await voucherAdminService.getVouchers(
            page,
            limit,
            status,
            applyScope
        );
        res.json(
            ApiResponse.success('Lấy danh sách voucher thành công!', result)
        );
    };

    /**
     * Get voucher detail
     */
    getVoucherDetail = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const voucher = await voucherAdminService.getVoucherDetail(voucherId);
        res.json(
            ApiResponse.success('Lấy chi tiết voucher thành công!', { voucher })
        );
    };

    /**
     * Update voucher
     */
    updateVoucher = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const payload = req.body as UpdateVoucher;
        const voucher = await voucherAdminService.updateVoucher(
            voucherId,
            payload
        );
        res.json(
            ApiResponse.success('Cập nhật voucher thành công!', { voucher })
        );
    };

    /**
     * Delete voucher
     */
    deleteVoucher = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const result = await voucherAdminService.deleteVoucher(voucherId);
        res.json(ApiResponse.success(result.message, {}));
    };

    /**
     * Grant voucher to users
     */
    grantVoucher = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const { userIds } = req.body;
        const grantedBy = (req as any).staff?.id || 'admin'; // Admin ID from auth

        const result = await voucherAdminService.grantVoucherToUsers(
            voucherId,
            userIds,
            grantedBy
        );
        res.json(
            ApiResponse.success(
                `Đã cấp voucher ${result.voucherCode} cho ${result.grantedCount} users`,
                result
            )
        );
    };

    /**
     * Revoke voucher from users
     */
    revokeVoucher = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const { userIds } = req.body;

        const result = await voucherAdminService.revokeVoucherFromUsers(
            voucherId,
            userIds
        );
        res.json(
            ApiResponse.success(
                `Đã thu hồi voucher ${result.voucherCode} từ ${result.revokedCount} users`,
                result
            )
        );
    };

    /**
     * Get users who have voucher
     */
    getVoucherUsers = async (req: Request, res: Response) => {
        const voucherId = req.params.id as string;
        const result = await voucherAdminService.getVoucherUsers(voucherId);
        res.json(
            ApiResponse.success('Lấy danh sách users thành công!', result)
        );
    };

    /**
     * Get user's vouchers
     */
    getUserVouchers = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const result = await voucherAdminService.getUserVouchers(userId);
        res.json(
            ApiResponse.success(
                'Lấy danh sách vouchers của user thành công!',
                result
            )
        );
    };

    /**
     * Get statistics
     */
    getStatistics = async (req: Request, res: Response) => {
        const stats = await voucherAdminService.getStatistics();
        res.json(ApiResponse.success('Lấy thống kê thành công!', stats));
    };
}

export default new VoucherAdminController();
