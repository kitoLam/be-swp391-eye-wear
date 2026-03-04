import { Worker, Job } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';
import { sendMail } from '../utils/mail.util';
import { MailJobData } from './mail.queue';

export const mailWorker = new Worker(
    'mail-queue',
    async (job: Job<MailJobData>) => {
        const { to, subject, html } = job.data;
        console.log(`[MailWorker] Processing email for: ${to}`);

        try {
            await sendMail(to, subject, html);
            console.log(`[MailWorker] Successfully sent email to: ${to}`);
        } catch (error) {
            console.error(`[MailWorker] Failed to send email to ${to}:`, error);
            throw error; // Let BullMQ handle retry based on queue config
        }
    },
    {
        connection: bullMqConnection,
        concurrency: 5, // Process up to 5 emails in parallel
    }
);

// Listen for completed/failed events if needed
mailWorker.on('completed', job => {
    console.log(`[MailWorker] Job ${job.id} has completed!`);
});

mailWorker.on('failed', (job, err) => {
    console.error(`[MailWorker] Job ${job?.id} has failed with ${err.message}`);
});
