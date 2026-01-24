import { Worker, Job } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';
import { invoiceRepository } from '../repositories/invoice/invoice.repository';
import { orderRepository } from '../repositories/order/order.repository';
import redisService from '../services/redis.service';
import { redisPrefix } from '../config/constants/redis.constant';
import { InvoiceStatus } from '../config/enums/invoice.enum';
import { OrderStatus } from '../config/enums/order.enum';

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
                const lockKey = `${redisPrefix.orderLockOnline}:${product.productId}:${product.sku}`;
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
            const invoice = await invoiceRepository.findById(invoiceId);
            if (invoice && invoice.status === InvoiceStatus.PENDING) {
                await invoiceRepository.update(invoiceId, {
                    status: InvoiceStatus.PENDING, // Keep as PENDING but mark as timeout
                });
                console.log(`[Worker] Invoice ${invoiceId} timeout processed`);

                // 4. Update all Orders status to CANCEL
                for (const orderId of invoice.orders) {
                    await orderRepository.update(orderId, {
                        status: OrderStatus.CANCEL,
                    });
                }
                console.log(
                    `[Worker] Updated ${invoice.orders.length} orders to CANCEL`
                );
            }

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
    { connection: bullMqConnection }
);

invoiceWorker.on('completed', (job: Job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
});

invoiceWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
});
