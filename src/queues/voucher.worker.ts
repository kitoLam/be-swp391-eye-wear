import { Worker, Job } from 'bullmq';
import { ActiveVoucherJobData } from './voucher.queue';
import { bullMqConnection } from '../config/bullmq-connection';
import { VoucherModel } from '../models/voucher/voucher.model.mongo';

export const invoiceWorker = new Worker(
    'voucher-active',
    async (job: Job<ActiveVoucherJobData>) => {
        const { voucherId } = job.data;
        await VoucherModel.updateOne({
          _id: voucherId,
        }, {
          status: 'ACTIVE',
        });
        console.log(`[VoucherWorker] Processing voucher: ${voucherId}`);
    },
    {
        connection: bullMqConnection,
        concurrency: 1,
    }
);
