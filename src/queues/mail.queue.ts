import { Queue, DefaultJobOptions } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';

export interface MailJobData {
    to: string;
    subject: string;
    html: string;
}

export const defaultJobOptions: DefaultJobOptions = {
    attempts: 3, // Retry 3 times on failure
    backoff: {
        type: 'exponential',
        delay: 5000, // Wait 5s before first retry
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for manual inspection
};

export const mailQueue = new Queue<MailJobData>('mail-queue', {
    connection: bullMqConnection,
    defaultJobOptions,
});

/**
 * Add an email job to the queue
 * @param data Email details (to, subject, html)
 */
export const addMailToQueue = async (data: MailJobData) => {
    await mailQueue.add('send-email', data);
    console.log(`[MailQueue] Added email job for: ${data.to}`);
};
