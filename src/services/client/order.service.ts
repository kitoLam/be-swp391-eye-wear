import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';
import { productRepository } from '../../repositories/product/product.repository';
import { ClientCreateOrder, ClientUpdateOrder } from '../../types/order/order';
import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { generateOrderCode } from '../../utils/generate.util';
import { OrderType } from '../../config/enums/order.enum';
import {
    PaymentMethodType,
    PaymentStatus,
} from '../../config/enums/payment.enum';
import { paymentRepository } from '../../repositories/payment/payment.repository';
import redisService from '../redis.service';
import { redisPrefix } from '../../config/constants/redis.constant';
import { addOrderToTimeoutQueue } from '../../queues/order.queue';
class OrderClientService {
    releaseProductOrderLock = async (
        payload: { key: string; qty: number }[],
        type: 'race' | 'online' = 'race'
    ) => {
        const seconds = type == 'race' ? 10 : 15 * 60;
        for (const item of payload) {
            const stockIsAcquiring = await redisService.getDataByKey<number>(
                item.key
            );
            if (stockIsAcquiring != null) {
                const remain = stockIsAcquiring - item.qty;
                if (remain <= 0) {
                    await redisService.deleteDataByKey(item.key);
                } else {
                    await redisService.setDataWithExpiredTime(
                        item.key,
                        stockIsAcquiring - item.qty,
                        seconds
                    );
                }
            }
        }
    };
    acquireProductOrderLock = async (
        key: string,
        qty: number,
        type: 'race' | 'online' = 'race'
    ) => {
        const seconds = type == 'race' ? 10 : 15 * 60;
        const stockIsAcquiring = await redisService.getDataByKey<number>(key);
        if (stockIsAcquiring != null) {
            const updateStockAcquiring = stockIsAcquiring + qty;
            await redisService.setDataWithExpiredTime(
                key,
                updateStockAcquiring,
                seconds
            );
        } else {
            await redisService.setDataWithExpiredTime(key, qty, seconds);
        }
    };
    /**
     * Create new order (Checkout)
     */
    createOrder = async (customerId: string, payload: ClientCreateOrder) => {
        const acquiredLocks: {
            key: string;
            qty: number;
        }[] = [];
        const alreadyDescItems: {
            _id: string;
            sku: string;
            qty: number;
        }[] = [];
        const { products, voucher: voucherCodes } = payload;
        try {
            // tính tổng tiền
            let totalPrice = 0;
            // sản phẩm cho mặc định dạng NORMAL (tạm vậy chưa tính trường hợp PRE-ORDER), nếu có lens thì auto manu
            let orderType = OrderType.NORMAL;
            for (const item of products) {
                // Mỗi sản phẩm phải chứa lens hoặc product
                if (!item.product && !item.lens) {
                    throw new BadRequestError('Product is required');
                }
                // product này phải có type != lens
                if (item.product) {
                    const product = await productRepository.findOne({
                        _id: item.product.product_id,
                        type: {
                            $ne: 'lens',
                        },
                    });
                    if (!product) {
                        throw new NotFoundRequestError(
                            `Product not found: ${item.product.product_id}`
                        );
                    }
                    // Find variant by SKU
                    const variant = product.variants.find(
                        v => v.sku === item.product?.sku
                    );
                    if (!variant) {
                        throw new BadRequestError(
                            `Variant with SKU ${item.product.sku} not found for product ${product.nameBase}`
                        );
                    }
                    // console.log(">>product ", item);
                    // check xem thg này có đủ kho hay khong mới cho xuống tiếp
                    const keyRace = `${redisPrefix.orderLockRace}-${item.product.product_id}-${item.product.sku}`;
                    const keyOnline = `${redisPrefix.orderLockOnline}-${item.product.product_id}-${item.product.sku}`;
                    const stockIsAcquiring =
                        (await redisService.getDataByKey<number>(keyRace)) || 0;
                    const stockIsAcquiringOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;
                    if (
                        variant.stock -
                            (stockIsAcquiring + stockIsAcquiringOnline) <
                        item.quantity
                    ) {
                        throw new ConflictRequestError(
                            `Product out of stock: ${product.nameBase}`
                        );
                    }
                    // acquire stock trong dưới Redis
                    await this.acquireProductOrderLock(keyRace, item.quantity);
                    // add key, qty vào acquiredLocks
                    acquiredLocks.push({ key: keyRace, qty: item.quantity });
                    // nếu là COD mới sẽ trừ stock thật dưới mongo
                    if (payload.paymentMethod == PaymentMethodType.COD) {
                        await productRepository.updateByFilter(
                            {
                                _id: product._id,
                                'variants.sku': item.product.sku,
                                'variants.stock': { $gte: item.quantity },
                            },
                            { $inc: { 'variants.$.stock': -item.quantity } }
                        );
                        alreadyDescItems.push({
                            _id: item.product.product_id,
                            sku: item.product.sku,
                            qty: item.quantity,
                        });
                    }
                    // Use finalPrice from variant
                    totalPrice += variant.finalPrice * item.quantity;
                }

                // Handle Lens Price if exists
                if (item.lens) {
                    orderType = OrderType.MANUFACTURING;
                    const lensProduct = await productRepository.findOne({
                        _id: item.lens.lens_id,
                        type: 'lens',
                        deletedAt: null,
                    });
                    if (!lensProduct) {
                        throw new NotFoundRequestError(
                            `Lens product not found: ${item.lens.lens_id}`
                        );
                    }
                    // check sku:
                    const variant = lensProduct.variants.find(
                        v => v.sku === item.lens?.sku
                    );
                    if (!variant) {
                        throw new BadRequestError(
                            `Variant with SKU ${item.lens.sku} not found for product ${lensProduct.nameBase}`
                        );
                    }
                    //  check xem thg này có đủ kho hay khong mới cho xuống tiếp
                    const keyRace = `${redisPrefix.orderLockRace}-${item.lens.lens_id}-${item.lens.sku}`;
                    const keyOnline = `${redisPrefix.orderLockOnline}-${item.lens.lens_id}-${item.lens.sku}`;
                    const stockIsAcquiringRace =
                        (await redisService.getDataByKey<number>(keyRace)) || 0;
                    const stockIsAcquiringOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;
                    if (
                        variant.stock -
                            (stockIsAcquiringRace + stockIsAcquiringOnline) <
                        item.quantity
                    ) {
                        throw new ConflictRequestError(
                            `Lens out of stock: ${lensProduct.nameBase}`
                        );
                    }
                    // acquire stock trong dưới Redis
                    await this.acquireProductOrderLock(keyRace, item.quantity);
                    // add key, qty vào acquiredLocks
                    acquiredLocks.push({ key: keyRace, qty: item.quantity });
                    if (payload.paymentMethod == PaymentMethodType.COD) {
                        await productRepository.updateByFilter(
                            {
                                _id: item.lens.lens_id,
                                'variants.sku': item.lens.sku,
                                'variants.stock': { $gte: item.quantity },
                            },
                            { $inc: { 'variants.$.stock': -item.quantity } }
                        );
                        alreadyDescItems.push({
                            _id: item.lens.lens_id,
                            sku: item.lens.sku,
                            qty: item.quantity,
                        });
                    }
                    totalPrice += variant.finalPrice * item.quantity;
                }
            }

            // Apply Voucher
            let totalDiscount = 0;
            if (voucherCodes && voucherCodes.length > 0) {
                const voucherCode = voucherCodes[0]; // Support single voucher for now

                // Get voucher from DB
                const voucher = await voucherRepository.findOne({
                    code: voucherCode.toUpperCase(),
                    deletedAt: null,
                });

                if (!voucher) {
                    throw new NotFoundRequestError('Voucher không tồn tại');
                }

                // Check if user has access (for SPECIFIC vouchers)
                if (voucher.applyScope === 'SPECIFIC') {
                    const hasAccess =
                        await neo4jVoucherRepository.userHasVoucher(
                            customerId,
                            voucher._id.toString()
                        );
                    if (!hasAccess) {
                        throw new BadRequestError(
                            'Bạn không có quyền sử dụng voucher này'
                        );
                    }
                }

                // Validate voucher
                const now = new Date();
                if (voucher.status !== 'ACTIVE') {
                    throw new BadRequestError('Voucher chưa được kích hoạt');
                }
                if (now < voucher.startedDate || now > voucher.endedDate) {
                    throw new BadRequestError(
                        'Voucher không trong thời gian sử dụng'
                    );
                }
                if (voucher.usageCount >= voucher.usageLimit) {
                    throw new BadRequestError('Voucher đã hết lượt sử dụng');
                }
                if (totalPrice < voucher.minOrderValue) {
                    throw new BadRequestError(
                        `Giá trị đơn hàng tối thiểu là ${voucher.minOrderValue.toLocaleString()}đ`
                    );
                }

                // Calculate discount
                let discount = 0;
                if (voucher.typeDiscount === 'FIXED') {
                    discount = voucher.value;
                } else if (voucher.typeDiscount === 'PERCENTAGE') {
                    discount = (totalPrice * voucher.value) / 100;
                }

                // Apply max discount limit
                discount = Math.min(discount, voucher.maxDiscountValue);
                discount = Math.min(discount, totalPrice);

                totalDiscount = discount;

                // Mark voucher as used in Neo4j (if SPECIFIC)
                if (voucher.applyScope === 'SPECIFIC') {
                    await neo4jVoucherRepository.markVoucherAsUsed(
                        customerId,
                        voucher._id.toString()
                    );
                }

                // Increment usage count in MongoDB
                await voucherRepository.incrementUsage(voucher._id.toString());
            }

            // Tạo order data
            const finalPrice = totalPrice - totalDiscount;
            const orderData: any = {
                orderCode: generateOrderCode(),
                owner: customerId,
                type: orderType,
                products: products,
                shippingAddress: payload.shippingAddress,
                customerInfo: payload.customerInfo,
                payment: {
                    totalPrice,
                    totalDiscount,
                    finalPrice,
                    voucher: voucherCodes || [],
                },
                note: payload.note,
            };

            // Tạo đơn hàng
            const newOrder = await orderRepository.create(orderData);

            // Tạo payment, ban đầu all payment method đều có trạng thái là UNPAID
            const newPayment = await paymentRepository.create({
                ownerId: customerId,
                orderId: newOrder._id.toString(),
                paymentMethod: payload.paymentMethod as PaymentMethodType,
                status: PaymentStatus.UNPAID,
                price: finalPrice,
            });
            // nếu cái paymentMethod != các phương thức tt ONLINE thì add thêm key vào redis lock lại 15'
            if (payload.paymentMethod != PaymentMethodType.COD) {
                for (const item of payload.products) {
                    if (item.lens) {
                        const key = `${redisPrefix.orderLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                        await this.acquireProductOrderLock(
                            key,
                            item.quantity,
                            'online'
                        );
                    }
                    if (item.product) {
                        const key = `${redisPrefix.orderLockOnline}:${item.product.product_id}:${item.product.sku}`;
                        await this.acquireProductOrderLock(
                            key,
                            item.quantity,
                            'online'
                        );
                    }
                }
                // TODO: Fix - orderCode property doesn't exist on Order model
                // await addOrderToTimeoutQueue({ orderId: newOrder.orderCode });
            }
            return {
                order: newOrder,
                payment: newPayment,
            };
        } catch (error) {
            // Rollback phần đã trừ dưới mongo
            for (const item of alreadyDescItems) {
                await productRepository.updateByFilter(
                    {
                        _id: item._id,
                        'variants.sku': item.sku,
                    },
                    { $inc: { 'variants.$.stock': item.qty } }
                );
            }
            throw error;
        } finally {
            // release lock race hiện tại
            await this.releaseProductOrderLock(acquiredLocks);
        }
    };

    /**
     * Get customer's orders
     */
    getOrders = async (
        customerId: string,
        page: number = 1,
        limit: number = 10,
        status?: string
    ) => {
        const filter: any = {
            owner: customerId,
            deletedAt: null,
        };

        if (status) {
            filter['payment.status'] = status;
        }

        const items = await orderRepository.find(filter, {
            limit,
            skip: (page - 1) * limit,
            sort: { createdAt: -1 },
        } as any);

        const total = await orderRepository.count(filter);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    };

    /**
     * Get order detail
     */
    getOrderDetail = async (customerId: string, orderCode: string) => {
        const order = await orderRepository.findOne({
            orderCode: orderCode,
            owner: customerId,
            deletedAt: null,
        });

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        return order;
    };

    /**
     * Update order (e.g. cancel, or update status)
     * Client usually can only cancel or update shipping info if not processed.
     * For now, generic update with validation.
     */
    updateOrder = async (
        customerId: string,
        orderCode: string,
        payload: ClientUpdateOrder
    ) => {
        const order = await orderRepository.findOne({
            orderCode,
            owner: customerId,
            deletedAt: null,
        });

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        // TODO: Fix - isVerified property doesn't exist on Order model
        // if (order.isVerified.status !== VerifyOrderStatus.PENDING) {
        //     throw new ConflictRequestError(
        //         'This order is processed, so you can not update it'
        //     );
        // }
        const updatedProduct: any = [];
        order.products.forEach(item => {
            if (item.lens) {
                const foundLensInPayload = payload.products?.find(
                    itemInPayload => {
                        if (
                            item.lens &&
                            item.lens.lens_id === itemInPayload.lens?.lens_id &&
                            item.lens.sku === itemInPayload.lens.sku
                        ) {
                            if (item.product) {
                                if (
                                    item.product.product_id ===
                                        itemInPayload.product?.product_id &&
                                    item.product.sku ===
                                        itemInPayload.product.sku
                                ) {
                                    return true;
                                } else return false;
                            } else {
                                return true;
                            }
                        }
                    }
                );
                if (foundLensInPayload) {
                    item.lens = {
                        ...item.lens,
                        parameters: foundLensInPayload.lens!.parameters,
                    };
                }
            }
            // vẫn đẩy thông tin sản phẩm cũ vào updatedProduct nếu cái item product chứa lens của người dùng gửi lên bị sai
            updatedProduct.push(item);
            return item;
        });
        const updatedOrder = await orderRepository.update(order._id, {
            ...payload,
            products: updatedProduct,
        });
        return updatedOrder;
    };
}

export default new OrderClientService();
