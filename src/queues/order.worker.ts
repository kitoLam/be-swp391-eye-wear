import { Worker, Job } from 'bullmq';
import { bullMqConnection } from '../config/bullmq-connection';
import { orderRepository } from '../repositories/order/order.repository';
import orderService from '../services/client/order.service';
import { redisPrefix } from '../config/constants/redis.constant';
import { OrderStatus } from '../config/enums/order.enum';
export const orderWorker = new Worker(
    'order-timeout',
    async (job: Job) => {
        const { orderId } = job.data;
        console.log('>>>orderId timeout', orderId);
        // chỗ xử lí trường hợp khách không thanh toán sau 15p timeout
        const orderDetail = await orderRepository.findOne({
            orderCode: orderId,
            deletedAt: null,
        });
        if (orderDetail) {
            const items: { key: string; qty: number }[] = [];
            for (const item of orderDetail.products) {
                if (item.lens) {
                    const key = `${redisPrefix.orderLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                    items.push({
                        key,
                        qty: item.quantity,
                    });
                }
                if (item.product) {
                    const key = `${redisPrefix.orderLockOnline}:${item.product.product_id}:${item.product.sku}`;
                    items.push({
                        key,
                        qty: item.quantity,
                    });
                }
            }
            await orderService.releaseProductOrderLock(items, 'online');
            await orderRepository.updateByFilter(
                { orderCode: orderId },
                {
                    status: OrderStatus.CANCEL,
                }
            );
        }
    },
    { connection: bullMqConnection }
);
