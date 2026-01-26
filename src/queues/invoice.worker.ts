import { Worker, Job } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';
import { invoiceRepository } from '../repositories/invoice/invoice.repository';
import redisService from '../services/redis.service';
import { redisPrefix } from '../config/constants/redis.constant';
import { InvoiceStatus } from '../config/enums/invoice.enum';

interface InvoiceProduct {
    productId: string;
    sku: string;
    qty: number;
    type: 'frame' | 'lens';
}

export const invoiceWorker = new Worker(
    'invoice-timeout',
    async (job: Job) => {
        const { invoiceId } = job.data;
        console.log(`[Worker] Processing timeout for invoice: ${invoiceId}`);

        try {
            // 1. Get products from Redis
            const productsKey = `${redisPrefix.invoiceProducts}:${invoiceId}`;
            const productsData =
                await redisService.getDataByKey<InvoiceProduct[]>(productsKey);

            if (!productsData || productsData.length === 0) {
                console.log(
                    `[Worker] No products found in Redis for invoice: ${invoiceId}`
                );
                return;
            }

            // 2. Release all stock locks
            for (const product of productsData) {
                const lockKey = `${redisPrefix.productLockOnline}:${product.productId}:${product.sku}`;
                const currentLock =
                    await redisService.getDataByKey<number>(lockKey);

                if (currentLock !== null && currentLock > 0) {
                    const remaining = currentLock - product.qty;

                    if (remaining <= 0) {
                        await redisService.deleteDataByKey(lockKey);
                        console.log(`[Worker] Deleted lock: ${lockKey}`);
                    } else {
                        await redisService.setDataWithExpiredTime(
                            lockKey,
                            remaining,
                            15 * 60
                        );
                        console.log(
                            `[Worker] Updated lock: ${lockKey}, remaining: ${remaining}`
                        );
                    }
                }
            }

            // 3. Update Invoice status to CANCELLED
            await invoiceRepository.updateByFilter({
                _id: invoiceId,
            }, {
                status: InvoiceStatus.CANCELED,
            });

            // 5. Clean up Redis invoice-products mapping
            await redisService.deleteDataByKey(productsKey);
            console.log(
                `[Worker] Cleaned up Redis data for invoice: ${invoiceId}`
            );
        } catch (error) {
            console.error(
                `[Worker] Error processing timeout for invoice ${invoiceId}:`,
                error
            );
            throw error; // BullMQ will retry based on attempts config
        }
    },
    { 
        connection: bullMqConnection,
        concurrency: 1,  
        skipStalledCheck: true, 
        drainDelay: 3000,
    }
);