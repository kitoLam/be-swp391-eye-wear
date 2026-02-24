import { supabase } from '../../config/supabase.config';
import { BadRequestError } from '../../errors/apiError/api-error';

class VoucherSupabaseRepository {
    /**
     * Get vouchers assigned to a customer via voucher_user table
     */
    async getVouchersByCustomerId(customerId: string) {
        const { data, error } = await supabase
            .from('voucher_user')
            .select(
                `
                id,
                customer_id,
                voucher_id,
                metadata,
                voucher:voucher_id (
                    id,
                    code,
                    created_at
                )
            `
            )
            .eq('customer_id', customerId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            throw new BadRequestError(error.message);
        }

        // Return the nested voucher data
        const vouchers = (data || [])
            .map((row: any) => row.voucher)
            .filter(Boolean);

        return vouchers;
    }
}

export const voucherSupabaseRepository = new VoucherSupabaseRepository();
