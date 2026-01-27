import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';
import { productRepository } from '../../repositories/product/product.repository';
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
import {
    PaymentMethodType,
    PaymentStatus,
} from '../../config/enums/payment.enum';
import redisService from '../redis.service';
import { redisPrefix } from '../../config/constants/redis.constant';
import { addInvoiceToTimeoutQueue } from '../../queues/invoice.queue';
import { paymentRepository } from '../../repositories/payment/payment.repository';
import {
    ClientCreateInvoice,
    ClientUpdateInvoice,
} from '../../types/invoice/client-invoice';
import { generateInvoiceCode } from '../../utils/generate.util';
import { AuthCustomerContext } from '../../types/context/context';

interface InvoiceProduct {
    productId: string;
    sku: string;
    qty: number;
    type: 'frame' | 'lens' | 'sunglass';
}

class InvoiceClientService {
    /**
     * Helper: Acquire product lock in Redis
     */
    public acquireProductLock = async (
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
    public releaseProductLock = async (
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
     * Helper: Calculate voucher discount
     */
    private calculateVoucherDiscount = async (
        voucherCodes: string[] | undefined,
        totalPrice: number,
        customerId: string
    ): Promise<{ discount: number; voucherId?: string }> => {
        if (!voucherCodes || voucherCodes.length === 0) {
            return { discount: 0 };
        }

        const voucherCode = voucherCodes[0];
        const voucher = await voucherRepository.findOne({
            code: voucherCode.toUpperCase(),
            deletedAt: null,
        });

        if (!voucher) {
            throw new NotFoundRequestError('Voucher không tồn tại');
        }

        // Check voucher access for SPECIFIC vouchers
        if (voucher.applyScope === 'SPECIFIC') {
            const hasAccess = await neo4jVoucherRepository.userHasVoucher(
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
            throw new BadRequestError('Voucher không trong thời gian sử dụng');
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

        // Mark voucher as used
        if (voucher.applyScope === 'SPECIFIC') {
            await neo4jVoucherRepository.markVoucherAsUsed(
                customerId,
                voucher._id.toString()
            );
        }
        await voucherRepository.incrementUsage(voucher._id.toString());

        return { discount, voucherId: voucher._id.toString() };
    };

    /**
     * 
     * @param customerId 
     * @param payload 
     * @returns 
     */
    createInvoice = async (
        customerId: string,
        payload: ClientCreateInvoice
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
            // Separate products by type
            const normalProducts: (OrderProduct & {pricePerUnit: number})[] = [];
            const manufacturingProducts: (OrderProduct & { pricePerUnit: number })[] = [];

            let totalPrice = 0;

            // Process and validate all products first
            const processedProducts: Array<{
                item: OrderProduct;
                product: any;
                variant: any;
                price: number;
            }> = [];

            for (const item of payload.products) {
                if (!item.product) {
                    throw new BadRequestError('Product is required');
                }

                // let productDoc: any;
                let productVariant: any;
                let itemPrice = 0;

                // Process Product
                const productDoc = await productRepository.findOne({
                    _id: item.product.product_id
                });

                if (!productDoc) {
                    throw new NotFoundRequestError(
                        `Product not found: ${item.product.product_id}`
                    );
                }

                productVariant = productDoc.variants.find(
                    (v: any) => v.sku === item.product?.sku
                );
                if (!productVariant) {
                    throw new BadRequestError(
                        `Variant with SKU ${item.product.sku} not found`
                    );
                }

                // Check stock
                const keyRace = `${redisPrefix.productLockRace}:${item.product.product_id}:${item.product.sku}`;
                const keyOnline = `${redisPrefix.productLockOnline}:${item.product.product_id}:${item.product.sku}`;
                const stockRace =
                    (await redisService.getDataByKey<number>(keyRace)) || 0;
                const stockOnline =
                    (await redisService.getDataByKey<number>(keyOnline)) || 0;

                if (productVariant.stock - (stockRace + stockOnline) < item.quantity) {
                    throw new ConflictRequestError(
                        `Product out of stock: ${productDoc.nameBase}`
                    );
                }

                // Acquire race lock
                await this.acquireProductLock(keyRace, item.quantity, 'race');
                acquiredLocks.push({ key: keyRace, qty: item.quantity });

                // If COD, decrease stock immediately
                if (payload.paymentMethod === PaymentMethodType.COD) {
                    await productRepository.updateByFilter(
                        {
                            _id: productDoc._id,
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

                itemPrice = productVariant.finalPrice * item.quantity;
                invoiceProducts.push({
                    productId: item.product.product_id,
                    sku: item.product.sku,
                    qty: item.quantity,
                    type: productDoc.type,
                });
                item.product.pricePerUnit = productVariant.finalPrice;
                // End process product
                
                // Process Lens
                if (item.lens) {
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

                    const lensVariant = lensProduct.variants.find(
                        (v: any) => v.sku === item.lens?.sku
                    );
                    if (!lensVariant) {
                        throw new BadRequestError(
                            `Lens variant with SKU ${item.lens.sku} not found`
                        );
                    }

                    // Check stock
                    const keyRace = `${redisPrefix.productLockRace}:${item.lens.lens_id}:${item.lens.sku}`;
                    const keyOnline = `${redisPrefix.productLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                    const stockRace =
                        (await redisService.getDataByKey<number>(keyRace)) || 0;
                    const stockOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;

                    if (
                        lensVariant.stock - (stockRace + stockOnline) <
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

                    itemPrice += lensVariant.finalPrice * item.quantity;
                    invoiceProducts.push({
                        productId: item.lens.lens_id,
                        sku: item.lens.sku,
                        qty: item.quantity,
                        type: 'lens',
                    });
                    item.lens.pricePerUnit = lensVariant.finalPrice;
                    // Nếu có lens và check đầy đủ hết, push vào loại đơn hàng MANUFACTURING
                    manufacturingProducts.push({
                        ...item,
                        pricePerUnit: lensVariant.finalPrice + productVariant.finalPrice,
                    });
                }
                else {
                    // Nếu không đây là đơn NORMAL
                    normalProducts.push({
                        ...item,
                        pricePerUnit: productVariant.finalPrice,
                    });
                }

                totalPrice += itemPrice;
            }

            // Create Orders with proper grouping
            // 1. Create ONE order for all NORMAL products
            if (normalProducts.length > 0) {
                let normalOrderPrice = 0;
                for (const item of normalProducts) {
                    normalOrderPrice += item.pricePerUnit * item.quantity;
                }

                const normalOrder = await orderRepository.create({
                    type: OrderType.NORMAL,
                    products: normalProducts,
                    status: OrderStatus.PENDING,
                    price: normalOrderPrice,
                    assignmentStatus: AssignmentOrderStatus.PENDING,
                });

                createdOrders.push(normalOrder._id.toString());
            }

            // 2. Create separate MANUFACTURING order for each product with lens
            for (const item of manufacturingProducts) {
                let mfgOrderPrice = item.pricePerUnit * item.quantity;

                const mfgOrder = await orderRepository.create({
                    type: OrderType.MANUFACTURING,
                    products: [item],
                    status: OrderStatus.PENDING,
                    price: mfgOrderPrice,
                    assignmentStatus: AssignmentOrderStatus.PENDING,
                });

                createdOrders.push(mfgOrder._id.toString());
            }
            // SAU NÀY CÓ LẠI CÁI MONGO VOUCHER SẼ SỬA LẠI LOGIC VOUCHER

            // Apply Voucher
            // const { discount: totalDiscount, voucherId } =
            //     await this.calculateVoucherDiscount(
            //         payload.voucher,
            //         totalPrice,
            //         customerId
            //     );
            const { discount: totalDiscount, voucherId } = {discount: 0, voucherId: null};

            // END SAU NÀY CÓ LẠI CÁI MONGO VOUCHER SẼ SỬA LẠI 

            // Create Invoice
            const invoiceData: any = {
                orders: createdOrders,
                owner: customerId,
                totalPrice,
                totalDiscount,
                voucher: [], // NÀO LÀM VOUCHER RỒI THÌ ADD VÀO, voucherId ? [voucherId] : [],
                address: payload.address,
                status: payload.paymentMethod == PaymentMethodType.COD ? InvoiceStatus.DEPOSITED : InvoiceStatus.PENDING,
                fullName: payload.fullName,
                phone: payload.phone,
                invoiceCode: generateInvoiceCode(),
            };

            const newInvoice = await invoiceRepository.create(invoiceData);

            // If ONLINE payment, acquire online locks and add to timeout queue
            if (payload.paymentMethod !== PaymentMethodType.COD) {
                // Acquire online locks
                for (const product of invoiceProducts) {
                    const key = `${redisPrefix.productLockOnline}:${product.productId}:${product.sku}`;
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
            // Create new payment
            const newPayment = await paymentRepository.create({
                ownerId: customerId,
                invoiceId: newInvoice._id.toString(),
                paymentMethod: payload.paymentMethod as PaymentMethodType,
                status: PaymentStatus.UNPAID,
                price: totalPrice - totalDiscount,
            });
            return {
                invoice: newInvoice,
                payment: newPayment,
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
            invoice,
            ordersDetail,
        };
    };

    /**
     * Update invoice status
     */
    cancelInvoice = async (
        invoiceId: string,
        customer: AuthCustomerContext
    ) => {
        const existInvoice = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customer.id,
            status: {
                $nin: [InvoiceStatus.CANCELED, InvoiceStatus.REJECTED],
            },
        });
        // check invoice exist
        if (!existInvoice) {
            throw new NotFoundRequestError('Invoice not found');
        }
        // Nếu đơn đã qua bước được staff approve rồi thì không cho hủy nữa
        if (
            existInvoice.status != InvoiceStatus.PENDING &&
            existInvoice.status != InvoiceStatus.DEPOSITED
        ) {
            throw new ConflictRequestError(
                'Invoice has been approved, so you can not cancel it'
            );
        }
        // Cập nhật lại stock của từng order trong đơn về lại kho
        for (const orderId of existInvoice.orders) {
            const orderDetail = await orderRepository.findById(orderId);
            if (orderDetail) {
                for (const orderProduct of orderDetail.products) {
                    if (orderProduct.product) {
                        await productRepository.updateByFilter(
                            {
                                _id: orderProduct.product.product_id,
                                'variants.sku': orderProduct.product.sku,
                            },
                            {
                                $inc: {
                                    'variants.$.stock': orderProduct.quantity,
                                },
                            }
                        );
                    }
                    if (orderProduct.lens) {
                        await productRepository.updateByFilter(
                            {
                                _id: orderProduct.lens.lens_id,
                                'variants.sku': orderProduct.lens.sku,
                            },
                            {
                                $inc: {
                                    'variants.$.stock': orderProduct.quantity,
                                },
                            }
                        );
                    }
                }
            }
        }
        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.CANCELED,
        });
        return updatedInvoice;
    };

    /**
     * Hàm xử lí logic sửa hóa đơn của khách (chỉ sửa thông tin giao ở service này)
     * @param customer
     * @param invoiceId
     * @param payload
     */
    updateInvoice = async (
        customer: AuthCustomerContext,
        invoiceId: string,
        payload: ClientUpdateInvoice
    ) => {
        const invoiceDetail = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customer.id,
        });
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found ');
        }
        // chỉ được sửa khi trc bước sale confirm
        if (
            !(invoiceDetail.status == InvoiceStatus.PENDING) &&
            !(invoiceDetail.status == InvoiceStatus.DEPOSITED)
        ) {
            throw new ConflictRequestError(
                "Invoice is confirm by our staff, you can't update it"
            );
        }
        await invoiceRepository.update(invoiceId, payload);
    };
}

export default new InvoiceClientService();
