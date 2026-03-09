import { Queue, DefaultJobOptions } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';
import moment from 'moment-timezone';
// Định nghĩa interface cho dữ liệu của Job
export interface ActiveVoucherJobData {
    voucherId: string;
}

export const defaultJobOptions: DefaultJobOptions = {
    attempts: 1,

    removeOnComplete: true,

    removeOnFail: true,
};
export const voucherTimeoutQueue = new Queue<ActiveVoucherJobData>(
    'voucher-active',
    {
        connection: bullMqConnection,
        defaultJobOptions,
    }
);
export const addVoucherToTimeoutQueue = async (
    data: ActiveVoucherJobData,
    targetedDate: Date
) => {
    const targetTime = moment
        .tz(targetedDate, 'Asia/Ho_Chi_Minh')
        .startOf('day');
    const now = moment();
    const delay = targetTime.diff(now);
    await voucherTimeoutQueue.add('voucher-active' as any, data, {
        delay: delay,
        jobId: data.voucherId,
    });
    console.log(`[Voucher] Đã thêm job timeout cho voucher: ${data.voucherId}`);
};

export const removeVoucherJobFromQueue = async (data: ActiveVoucherJobData) => {
    const job = await voucherTimeoutQueue.getJob(data.voucherId);
    if (job) {
        await job.remove();
        console.log(
            `[Queue] Đã xóa job timeout cho hóa đơn: ${data.voucherId}`
        );
    }
};