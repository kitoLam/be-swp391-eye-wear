import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';
import { productRepository } from '../../repositories/product/product.repository';
import { CreateInvoice, UpdateInvoice } from '../../types/invoice/invoice';
import { OrderProduct } from '../../types/order/order-product';
import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import {
    OrderType,
    OrderStatus,
    AssignmentOrderStatus,
} from '../../config/enums/order.enum';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { PaymentMethodType } from '../../config/enums/payment.enum';
import redisService from '../redis.service';
import { redisPrefix } from '../../config/constants/redis.constant';
import { addInvoiceToTimeoutQueue } from '../../queues/invoice.queue';

interface InvoiceProduct {
    productId: string;
    sku: string;
    qty: number;
    type: 'frame' | 'lens';
}

interface CreateInvoicePayload {
    products: OrderProduct[];
    voucher?: string[];
    address: {
        street: string;
        ward: string;
        city: string;
    };
    fullName: string;
    phone: string;
    paymentMethod: PaymentMethodType;
    note?: string;
}

class InvoiceClientService {
    /**
     * Helper: Acquire product lock in Redis
     */
    private acquireProductLock = async (
        key: string,
        qty: number,
        type: 'race' | 'online' = 'race'
    ) => {
        const seconds = type === 'race' ? 10 : 15 * 60;
        const currentLock = await redisService.getDataByKey<number>(key);

        if (currentLock !== null) {
            await redisService.setDataWithExpiredTime(
                key,
                currentLock + qty,
                seconds
            );
        } else {
            await redisService.setDataWithExpiredTime(key, qty, seconds);
        }
    };

    /**
     * Helper: Release product lock in Redis
     */
    private releaseProductLock = async (
        locks: { key: string; qty: number }[],
        type: 'race' | 'online' = 'race'
    ) => {
        const seconds = type === 'race' ? 10 : 15 * 60;

        for (const lock of locks) {
            const currentLock = await redisService.getDataByKey<number>(
                lock.key
            );

            if (currentLock !== null) {
                const remaining = currentLock - lock.qty;

                if (remaining <= 0) {
                    await redisService.deleteDataByKey(lock.key);
                } else {
                    await redisService.setDataWithExpiredTime(
                        lock.key,
                        remaining,
                        seconds
                    );
                }
            }
        }
    };

    /**
     * Create Invoice (Checkout)
     */
    createInvoice = async (
        customerId: string,
        payload: CreateInvoicePayload
    ) => {
        const acquiredLocks: { key: string; qty: number }[] = [];
        const alreadyDecreasedItems: {
            _id: string;
            sku: string;
            qty: number;
        }[] = [];
        const invoiceProducts: InvoiceProduct[] = [];
        const createdOrders: string[] = [];

        try {
            let totalPrice = 0;

            // 1. Process each product and create orders
            for (const item of payload.products) {
                if (!item.product && !item.lens) {
                    throw new BadRequestError('Product or lens is required');
                }

                let orderType = OrderType.NORMAL;
                let orderPrice = 0;

                // Process Frame Product
                if (item.product) {
                    const product = await productRepository.findOne({
                        _id: item.product.product_id,
                        type: { $ne: 'lens' },
                    });

                    if (!product) {
                        throw new NotFoundRequestError(
                            `Product not found: ${item.product.product_id}`
                        );
                    }

                    const variant = product.variants.find(
                        v => v.sku === item.product?.sku
                    );
                    if (!variant) {
                        throw new BadRequestError(
                            `Variant with SKU ${item.product.sku} not found`
                        );
                    }

                    // Check stock
                    const keyRace = `${redisPrefix.orderLockRace}:${item.product.product_id}:${item.product.sku}`;
                    const keyOnline = `${redisPrefix.orderLockOnline}:${item.product.product_id}:${item.product.sku}`;
                    const stockRace =
                        (await redisService.getDataByKey<number>(keyRace)) || 0;
                    const stockOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;

                    if (
                        variant.stock - (stockRace + stockOnline) <
                        item.quantity
                    ) {
                        throw new ConflictRequestError(
                            `Product out of stock: ${product.nameBase}`
                        );
                    }

                    // Acquire race lock
                    await this.acquireProductLock(
                        keyRace,
                        item.quantity,
                        'race'
                    );
                    acquiredLocks.push({ key: keyRace, qty: item.quantity });

                    // If COD, decrease stock immediately
                    if (payload.paymentMethod === PaymentMethodType.COD) {
                        await productRepository.updateByFilter(
                            {
                                _id: product._id,
                                'variants.sku': item.product.sku,
                                'variants.stock': { $gte: item.quantity },
                            },
                            { $inc: { 'variants.$.stock': -item.quantity } }
                        );
                        alreadyDecreasedItems.push({
                            _id: item.product.product_id,
                            sku: item.product.sku,
                            qty: item.quantity,
                        });
                    }

                    orderPrice += variant.finalPrice * item.quantity;
                    invoiceProducts.push({
                        productId: item.product.product_id,
                        sku: item.product.sku,
                        qty: item.quantity,
                        type: 'frame',
                    });
                }

                // Process Lens
                if (item.lens) {
                    orderType = OrderType.MANUFACTURING;

                    const lensProduct = await productRepository.findOne({
                        _id: item.lens.lens_id,
                        type: 'lens',
                        deletedAt: null,
                    });

                    if (!lensProduct) {
                        throw new NotFoundRequestError(
                            `Lens not found: ${item.lens.lens_id}`
                        );
                    }

                    const variant = lensProduct.variants.find(
                        v => v.sku === item.lens?.sku
                    );
                    if (!variant) {
                        throw new BadRequestError(
                            `Lens variant with SKU ${item.lens.sku} not found`
                        );
                    }

                    // Check stock
                    const keyRace = `${redisPrefix.orderLockRace}:${item.lens.lens_id}:${item.lens.sku}`;
                    const keyOnline = `${redisPrefix.orderLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                    const stockRace =
                        (await redisService.getDataByKey<number>(keyRace)) || 0;
                    const stockOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;

                    if (
                        variant.stock - (stockRace + stockOnline) <
                        item.quantity
                    ) {
                        throw new ConflictRequestError(
                            `Lens out of stock: ${lensProduct.nameBase}`
                        );
                    }

                    // Acquire race lock
                    await this.acquireProductLock(
                        keyRace,
                        item.quantity,
                        'race'
                    );
                    acquiredLocks.push({ key: keyRace, qty: item.quantity });

                    // If COD, decrease stock immediately
                    if (payload.paymentMethod === PaymentMethodType.COD) {
                        await productRepository.updateByFilter(
                            {
                                _id: item.lens.lens_id,
                                'variants.sku': item.lens.sku,
                                'variants.stock': { $gte: item.quantity },
                            },
                            { $inc: { 'variants.$.stock': -item.quantity } }
                        );
                        alreadyDecreasedItems.push({
                            _id: item.lens.lens_id,
                            sku: item.lens.sku,
                            qty: item.quantity,
                        });
                    }

                    orderPrice += variant.finalPrice * item.quantity;
                    invoiceProducts.push({
                        productId: item.lens.lens_id,
                        sku: item.lens.sku,
                        qty: item.quantity,
                        type: 'lens',
                    });
                }

                // Create Order
                const newOrder = await orderRepository.create({
                    type: orderType,
                    products: [item],
                    status: OrderStatus.PENDING,
                    price: orderPrice,
                    assignmentStatus: AssignmentOrderStatus.PENDING,
                });

                createdOrders.push(newOrder._id.toString());
                totalPrice += orderPrice;
            }

            // 2. Apply Voucher
            let totalDiscount = 0;
            if (payload.voucher && payload.voucher.length > 0) {
                const voucherCode = payload.voucher[0];
                const voucher = await voucherRepository.findOne({
                    code: voucherCode.toUpperCase(),
                    deletedAt: null,
                });

                if (!voucher) {
                    throw new NotFoundRequestError('Voucher không tồn tại');
                }

                // Check voucher access for SPECIFIC vouchers
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

                discount = Math.min(discount, voucher.maxDiscountValue);
                discount = Math.min(discount, totalPrice);
                totalDiscount = discount;

                // Mark voucher as used
                if (voucher.applyScope === 'SPECIFIC') {
                    await neo4jVoucherRepository.markVoucherAsUsed(
                        customerId,
                        voucher._id.toString()
                    );
                }
                await voucherRepository.incrementUsage(voucher._id.toString());
            }

            // 3. Create Invoice
            const invoiceData: any = {
                orders: createdOrders,
                owner: customerId,
                totalPrice,
                totalDiscount,
                voucher: payload.voucher || [],
                address: payload.address,
                status: InvoiceStatus.PENDING,
                fullName: payload.fullName,
                phone: payload.phone,
            };

            const newInvoice = await invoiceRepository.create(invoiceData);

            // 4. If ONLINE payment, acquire online locks and add to timeout queue
            if (payload.paymentMethod !== PaymentMethodType.COD) {
                // Acquire online locks
                for (const product of invoiceProducts) {
                    const key = `${redisPrefix.orderLockOnline}:${product.productId}:${product.sku}`;
                    await this.acquireProductLock(key, product.qty, 'online');
                }

                // Save invoice-products mapping to Redis
                const invoiceProductsKey = `${redisPrefix.invoiceProducts}:${newInvoice._id.toString()}`;
                await redisService.setDataWithExpiredTime(
                    invoiceProductsKey,
                    invoiceProducts,
                    15 * 60
                );

                // Add to timeout queue
                await addInvoiceToTimeoutQueue({
                    invoiceId: newInvoice._id.toString(),
                });
            }

            return {
                invoice: newInvoice,
                finalPrice: totalPrice - totalDiscount,
            };
        } catch (error) {
            // Rollback: Restore decreased stock
            for (const item of alreadyDecreasedItems) {
                await productRepository.updateByFilter(
                    {
                        _id: item._id,
                        'variants.sku': item.sku,
                    },
                    { $inc: { 'variants.$.stock': item.qty } }
                );
            }

            // Rollback: Delete created orders
            for (const orderId of createdOrders) {
                await orderRepository.hardDelete(orderId);
            }

            throw error;
        } finally {
            // Release race locks
            await this.releaseProductLock(acquiredLocks, 'race');
        }
    };

    /**
     * Get customer's invoices
     */
    getInvoices = async (
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
            filter.status = status;
        }

        const result = await invoiceRepository.find(filter, {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        return result;
    };

    /**
     * Get invoice detail
     */
    getInvoiceDetail = async (customerId: string, invoiceId: string) => {
        const invoice = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customerId,
            deletedAt: null,
        });

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Populate orders - fetch all and filter
        const allOrders = await orderRepository.findAll({
            page: 1,
            limit: 100,
        });
        const ordersDetail = allOrders.data.filter(order =>
            invoice.orders.includes(order._id.toString())
        );

        return {
            ...invoice,
            ordersDetail,
        };
    };

    /**
     * Update invoice status
     */
    updateInvoiceStatus = async (
        invoiceId: string,
        status: InvoiceStatus,
        managerId?: string
    ) => {
        const invoice = await invoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        const updateData: any = { status };

        // If status is ONBOARD, set manager
        if (status === InvoiceStatus.ONBOARD && managerId) {
            updateData.manager_onboard = managerId;
        }

        const updatedInvoice = await invoiceRepository.update(
            invoiceId,
            updateData
        );
        return updatedInvoice;
    };
}

export default new InvoiceClientService();
