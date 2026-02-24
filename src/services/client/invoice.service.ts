import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { supabase } from '../../config/supabase.config';
import { productRepository } from '../../repositories/product/product.repository';
import { OrderProduct } from '../../types/order/order-product';
import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { OrderType, OrderStatus } from '../../config/enums/order.enum';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import {
    PaymentMethodType,
    PaymentStatus,
} from '../../config/enums/payment.enum';
import redisService from '../redis.service';
import { redisPrefix } from '../../config/constants/redis.constant';
// import { addInvoiceToTimeoutQueue } from '../../queues/invoice.queue';
import { paymentRepository } from '../../repositories/payment/payment.repository';
import {
    ClientCreateInvoice,
    ClientUpdateInvoice,
} from '../../types/invoice/client-invoice';
import {
    generateInvoiceCode,
    generateOrderCode,
} from '../../utils/generate.util';
import { AuthCustomerContext } from '../../types/context/context';
import productService from './product.service';
import { ProductVariantMode } from '../../config/enums/product.enum';
import { PreOrderImportModel } from '../../models/pre-order-import/pre-order-import.model.mongo';

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
        const seconds = type === 'race' ? 30 : 15 * 60;

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
     * Helper: Calculate voucher discount and validate ownership
     */
    private validateAndCalculateVoucher = async (
        voucherCodes: string[] | undefined,
        totalPrice: number,
        customerId: string
    ): Promise<{ discount: number; voucherId?: string; voucherDoc?: any }> => {
        if (!voucherCodes || voucherCodes.length === 0) {
            return { discount: 0 };
        }

        const voucherCode = voucherCodes[0];
        // 1. Check if voucher exists in MongoDB by CODE
        const voucher = await voucherRepository.findOne({
            code: voucherCode.toUpperCase(),
            deletedAt: null,
        });

        if (!voucher) {
            throw new NotFoundRequestError(
                `Voucher code "${voucherCode}" không tồn tại`
            );
        }

        // 2. Check voucher ownership in Supabase (since IDs are same)
        // Even for ALL scope, we might want to check if it's assigned if the system requires it,
        // but typically SPECIFIC is the one that needs strict ownership check.
        if (voucher.applyScope === 'SPECIFIC') {
            const { data, error } = await supabase
                .from('voucher_user')
                .select('id')
                .eq('customer_id', customerId)
                .eq('voucher_id', voucher._id.toString())
                .is('deleted_at', null)
                .single();

            if (error || !data) {
                throw new BadRequestError(
                    'Bạn không có quyền sử dụng voucher này hoặc voucher không thuộc về bạn'
                );
            }
        }

        // 3. Validate voucher conditions (Date, Status, Usage, MinOrder)
        const now = new Date();
        if (voucher.status !== 'ACTIVE') {
            throw new BadRequestError('Voucher hiện không khả dụng');
        }
        if (now < voucher.startedDate || now > voucher.endedDate) {
            throw new BadRequestError(
                'Voucher đã hết hạn hoặc chưa đến thời gian sử dụng'
            );
        }
        if (voucher.usageCount >= voucher.usageLimit) {
            throw new BadRequestError('Voucher đã hết lượt sử dụng tổng thể');
        }
        if (totalPrice < voucher.minOrderValue) {
            throw new BadRequestError(
                `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để áp dụng voucher này`
            );
        }

        // 4. Calculate discount
        let discount = 0;
        if (voucher.typeDiscount === 'FIXED') {
            discount = voucher.value;
        } else if (voucher.typeDiscount === 'PERCENTAGE') {
            discount = (totalPrice * voucher.value) / 100;
        }

        discount = Math.min(discount, voucher.maxDiscountValue);
        discount = Math.min(discount, totalPrice);

        return {
            discount,
            voucherId: voucher._id.toString(),
            voucherDoc: voucher,
        };
    };

    /**
     * Helper: Mark voucher as used in both DBs
     */
    private markVoucherAsUsed = async (
        voucherId: string,
        customerId: string,
        invoiceId: string
    ) => {
        // 1. Increment usage in MongoDB
        await voucherRepository.incrementUsage(voucherId);

        // 2. Update status in Supabase voucher_user if SPECIFIC
        // (Or always update metadata if you want to track usage per user)
        const { data: currentRecord } = await supabase
            .from('voucher_user')
            .select('metadata')
            .eq('customer_id', customerId)
            .eq('voucher_id', voucherId)
            .is('deleted_at', null)
            .single();

        if (currentRecord) {
            const newMetadata = {
                ...(currentRecord.metadata || {}),
                invoice_id: invoiceId,
                used_at: new Date().toISOString(),
            };

            await supabase
                .from('voucher_user')
                .update({
                    metadata: newMetadata,
                    updated_at: new Date().toISOString(),
                    // Optionally mark as deleted_at if it's one-time use
                    deleted_at: new Date().toISOString(),
                })
                .eq('customer_id', customerId)
                .eq('voucher_id', voucherId);
        }
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
            mode: ProductVariantMode;
        }[] = [];
        const invoiceProducts: InvoiceProduct[] = [];

        try {
            // Separate products by type
            const normalProducts: OrderProduct[] = [];
            const manufacturingProducts: OrderProduct[] = [];
            const preOrderProducts: OrderProduct[] = [];
            const preOrderProductModeSkuSet = new Set();
            let totalPrice = 0;

            for (const item of payload.products) {
                let itemPrice = 0;
                const ensureProductResult =
                    await productService.ensureBoughtProductIsValidToBuy(
                        {
                            productId: item.product.product_id,
                            productSku: item.product.sku,
                            buyAmount: item.quantity,
                        },
                        item.lens
                            ? {
                                  lensId: item.lens.lens_id,
                                  lensSku: item.lens.sku,
                                  buyAmount: item.quantity,
                              }
                            : undefined
                    );
                // ==== Process Product ====
                const productDetail = ensureProductResult.product.productDetail;
                const productVariant =
                    ensureProductResult.product.productVariant;
                // === Check stock ===
                const keyRace = `${redisPrefix.productLockRace}:${item.product.product_id}:${item.product.sku}`;
                // === End check stock ===

                // ==== Acquire race lock ====
                await this.acquireProductLock(keyRace, item.quantity, 'race');
                acquiredLocks.push({ key: keyRace, qty: item.quantity });
                // ==== End acquire race lock ====
                // If COD, decrease stock immediately
                if (payload.paymentMethod === PaymentMethodType.COD) {
                    alreadyDecreasedItems.push({
                        _id: item.product!.product_id,
                        sku: item.product!.sku,
                        qty: item.quantity,
                        mode: productVariant.mode,
                    });
                }

                itemPrice = productVariant.finalPrice * item.quantity;
                invoiceProducts.push({
                    productId: item.product!.product_id,
                    sku: item.product!.sku,
                    qty: item.quantity,
                    type: productDetail.type,
                });
                // Nếu đây là hàng pre-order thì add vào set
                if (productVariant.mode == ProductVariantMode.PRE_ORDER) {
                    preOrderProductModeSkuSet.add(productVariant.sku);
                }
                // ==== End process product ====

                // Process Lens
                if (item.lens) {
                    const lensProduct = ensureProductResult.lens!.lensDetail;
                    const lensVariant = ensureProductResult.lens!.lensVariant;
                    // Check stock
                    const keyRace = `${redisPrefix.productLockRace}:${item.lens.lens_id}:${item.lens.sku}`;

                    // Acquire race lock
                    await this.acquireProductLock(
                        keyRace,
                        item.quantity,
                        'race'
                    );
                    acquiredLocks.push({ key: keyRace, qty: item.quantity });

                    // If COD, decrease stock immediately
                    if (payload.paymentMethod === PaymentMethodType.COD) {
                        alreadyDecreasedItems.push({
                            _id: item.lens.lens_id,
                            sku: item.lens.sku,
                            qty: item.quantity,
                            mode: lensVariant.mode,
                        });
                    }

                    itemPrice += lensVariant.finalPrice * item.quantity;
                    invoiceProducts.push({
                        productId: item.lens.lens_id,
                        sku: item.lens.sku,
                        qty: item.quantity,
                        type: 'lens',
                    });
                    if (lensVariant.mode == ProductVariantMode.PRE_ORDER) {
                        preOrderProductModeSkuSet.add(lensVariant.sku);
                    }
                    // Nếu có lens và check đầy đủ hết, push vào loại đơn hàng MANUFACTURING
                    manufacturingProducts.push({
                        product: {
                            ...item.product,
                            pricePerUnit: productVariant.finalPrice,
                        },
                        lens: {
                            ...item.lens,
                            pricePerUnit: lensVariant.finalPrice,
                        },
                        quantity: item.quantity,
                    });
                } else {
                    // Nếu không có lens thì đây là đơn Normal hoặc pre-order
                    if (productVariant.mode == ProductVariantMode.PRE_ORDER) {
                        preOrderProducts.push({
                            product: {
                                ...item.product,
                                pricePerUnit: productVariant.finalPrice,
                            },
                            quantity: item.quantity,
                        });
                    } else {
                        normalProducts.push({
                            product: {
                                ...item.product,
                                pricePerUnit: productVariant.finalPrice,
                            },
                            quantity: item.quantity,
                        });
                    }
                }

                totalPrice += itemPrice;
            }

            // Apply Voucher
            const { discount: totalDiscount, voucherId } =
                await this.validateAndCalculateVoucher(
                    payload.voucher,
                    totalPrice,
                    customerId
                );

            // Create Invoice
            const invoiceData = {
                owner: customerId,
                totalPrice,
                totalDiscount,
                voucher: voucherId ? [voucherId] : [],
                address: payload.address,
                status:
                    payload.paymentMethod == PaymentMethodType.COD
                        ? manufacturingProducts.length == 0
                            ? InvoiceStatus.APPROVED
                            : InvoiceStatus.DEPOSITED
                        : InvoiceStatus.PENDING,
                fullName: payload.fullName,
                phone: payload.phone,
                invoiceCode: generateInvoiceCode(),
                note: payload.note,
            };

            const newInvoice = await invoiceRepository.create(invoiceData);

            // Mark voucher as used after invoice is successfully created
            if (voucherId) {
                await this.markVoucherAsUsed(
                    voucherId,
                    customerId,
                    newInvoice._id.toString()
                );
            }
            const insertedOrders = [];
            // Create Orders with proper grouping
            // 1. Create separate orders for each unique SKU in NORMAL products
            if (normalProducts.length > 0) {
                const normalGroupedBySku = new Map<string, OrderProduct[]>();
                for (const item of normalProducts) {
                    const sku = item.product.sku;
                    if (!normalGroupedBySku.has(sku)) {
                        normalGroupedBySku.set(sku, []);
                    }
                    normalGroupedBySku.get(sku)!.push(item);
                }

                for (const [sku, skuProducts] of normalGroupedBySku) {
                    let normalOrderPrice = 0;
                    for (const item of skuProducts) {
                        normalOrderPrice +=
                            item.product.pricePerUnit * item.quantity;
                    }

                    insertedOrders.push({
                        invoiceId: newInvoice._id,
                        orderCode: generateOrderCode(),
                        type: [OrderType.NORMAL],
                        products: skuProducts,
                        status:
                            manufacturingProducts.length == 0
                                ? OrderStatus.WAITING_ASSIGN
                                : OrderStatus.APPROVED,
                        price: normalOrderPrice,
                    });
                }
            }

            // 2. Create separate MANUFACTURING order for each product with lens (quantity = 2 ~ 2 orders)
            for (const item of manufacturingProducts) {
                for (let i = 0; i < item.quantity; i++) {
                    const orderType = [OrderType.MANUFACTURING];
                    if (
                        preOrderProductModeSkuSet.has(item.product.sku) ||
                        preOrderProductModeSkuSet.has(item.lens!.sku)
                    ) {
                        orderType.push(OrderType.PRE_ORDER);
                    }
                    let mfgOrderPrice =
                        item.product.pricePerUnit + item.lens!.pricePerUnit;
                    insertedOrders.push({
                        invoiceId: newInvoice._id,
                        orderCode: generateOrderCode(),
                        type: orderType,
                        products: [
                            {
                                ...item,
                                quantity: 1,
                            },
                        ],
                        status: OrderStatus.PENDING,
                        price: mfgOrderPrice,
                    });
                }
            }

            // 3. Create separate PRE-ORDER order for each product
            for (const item of preOrderProducts) {
                insertedOrders.push({
                    invoiceId: newInvoice._id,
                    orderCode: generateOrderCode(),
                    type: [OrderType.PRE_ORDER],
                    products: [
                        {
                            ...item,
                        },
                    ],
                    status:
                        manufacturingProducts.length == 0
                            ? OrderStatus.WAITING_ASSIGN
                            : OrderStatus.APPROVED,
                    price: item.product.pricePerUnit * item.quantity,
                });
            }
            await orderRepository.insertMany(insertedOrders);
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
                // await addInvoiceToTimeoutQueue({
                //     invoiceId: newInvoice._id.toString(),
                // });
            }
            // Create new payment
            const newPayment = await paymentRepository.create({
                ownerId: customerId,
                invoiceId: newInvoice._id.toString(),
                paymentMethod: payload.paymentMethod as PaymentMethodType,
                status: PaymentStatus.UNPAID,
                price: totalPrice - totalDiscount,
            });
            for (const item of alreadyDecreasedItems) {
                if (item.mode == ProductVariantMode.AVAILABLE) {
                    await productRepository.updateByFilter(
                        {
                            _id: item._id,
                            'variants.sku': item.sku,
                        },
                        { $inc: { 'variants.$.stock': -item.qty } }
                    );
                } else {
                    await PreOrderImportModel.updateOne(
                        {
                            sku: item.sku,
                        },
                        {
                            $inc: {
                                preOrderedQuantity: item.qty,
                            },
                        }
                    );
                }
            }
            return {
                invoice: newInvoice,
                payment: newPayment,
            };
        } catch (error) {
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
        console.log(invoiceId);
        const invoice = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customerId,
        });

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Get all orders of invoiceId
        const orderList = await orderRepository.findAllNoPagination({
            invoiceId: invoiceId,
        });
        const products: any = [];
        for (const order of orderList) {
            for (const curItem of order.products) {
                const item: any = {
                    type: order.type,
                };
                if (curItem.lens) {
                    const lensProduct = await productRepository.findOne({
                        _id: curItem.lens.lens_id,
                    });
                    const lensVariant: any = lensProduct!.variants.find(
                        variant => variant.sku === curItem.lens!.sku
                    );
                    item.lens = curItem.lens;
                    item.lens.detail = lensVariant;
                    item.lens = {
                        product_id: curItem.lens.lens_id,
                        sku: curItem.lens.sku,
                        pricePerUnit: curItem.lens.pricePerUnit,
                        detail: lensVariant,
                    };
                }
                const product = await productRepository.findOne({
                    _id: curItem.product.product_id,
                });
                const productVariant = product!.variants.find(
                    variant => variant.sku === curItem.product.sku
                );
                item.product = {
                    product_id: curItem.product.product_id,
                    sku: curItem.product.sku,
                    pricePerUnit: curItem.product.pricePerUnit,
                    detail: productVariant,
                };
                products.push(item);
            }
        }
        let invoiceStatus;
        if (
            invoice.status === InvoiceStatus.PENDING ||
            invoice.status === InvoiceStatus.DEPOSITED
        ) {
            invoiceStatus = 'PENDING';
        } else if (invoice.status === InvoiceStatus.REJECTED) {
            invoiceStatus = 'REJECTED';
        } else if (invoice.status === InvoiceStatus.CANCELED) {
            invoiceStatus = 'CANCELED';
        } else if (invoice.status === InvoiceStatus.APPROVED) {
            invoiceStatus = 'APPROVED';
        } else if (invoice.status == InvoiceStatus.DELIVERING) {
            invoiceStatus = 'DELIVERING';
        } else if (invoice.status == InvoiceStatus.DELIVERED) {
            invoiceStatus = 'DELIVERED';
        } else invoiceStatus = 'PROCESSING';
        return {
            invoiceStatus: invoiceStatus,
            invoice,
            productList: products,
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
        const orderList = await orderRepository.findAllNoPagination({
            invoiceId: invoiceId,
        });
        for (const orderDetail of orderList) {
            if (orderDetail) {
                for (const orderProduct of orderDetail.products) {
                    if (orderProduct.product) {
                        const productDetail = await productRepository.findOne({
                            _id: orderProduct.product.product_id,
                            'variants.sku': orderProduct.product.sku,
                        });
                        if (!productDetail) {
                            throw new NotFoundRequestError('Product not found');
                        }
                        const productVariant = productDetail.variants.find(
                            v => v.sku === orderProduct.product.sku
                        );
                        if (!productVariant) {
                            throw new NotFoundRequestError(
                                `Product with sku ${orderProduct.product.sku} not found`
                            );
                        }
                        if (
                            productVariant.mode == ProductVariantMode.PRE_ORDER
                        ) {
                            await PreOrderImportModel.updateOne(
                                {
                                    sku: orderProduct.product.sku,
                                },
                                {
                                    $inc: {
                                        preOrderedQuantity:
                                            -orderProduct.quantity,
                                    },
                                }
                            );
                        } else {
                            await productRepository.updateByFilter(
                                {
                                    _id: orderProduct.product.product_id,
                                    'variants.sku': orderProduct.product.sku,
                                },
                                {
                                    $inc: {
                                        'variants.$.stock':
                                            orderProduct.quantity,
                                    },
                                }
                            );
                        }
                    }
                    if (orderProduct.lens) {
                        const lensDetail = await productRepository.findOne({
                            _id: orderProduct.lens.lens_id,
                            'variants.sku': orderProduct.lens.sku,
                        });
                        if (!lensDetail) {
                            throw new NotFoundRequestError('Product not found');
                        }
                        const lensVariant = lensDetail.variants.find(
                            v => v.sku === orderProduct.lens!.sku
                        );
                        if (!lensVariant) {
                            throw new NotFoundRequestError(
                                `Product with sku ${orderProduct.lens.sku} not found`
                            );
                        }
                        if (lensVariant.mode == ProductVariantMode.PRE_ORDER) {
                            await PreOrderImportModel.updateOne(
                                {
                                    sku: orderProduct.lens.sku,
                                },
                                {
                                    $inc: {
                                        preOrderedQuantity:
                                            -orderProduct.quantity,
                                    },
                                }
                            );
                        } else {
                            await productRepository.updateByFilter(
                                {
                                    _id: orderProduct.lens.lens_id,
                                    'variants.sku': orderProduct.lens.sku,
                                },
                                {
                                    $inc: {
                                        'variants.$.stock':
                                            orderProduct.quantity,
                                    },
                                }
                            );
                        }
                    }
                }
            }
        }
        // Nếu 1 invoice bị hủy => tất cả order trong invoice đó đều trở thành cancelled
        await orderRepository.updateMany(
            {
                _id: { $in: orderList.map(order => order._id) },
            },
            {
                status: OrderStatus.CANCELED,
            }
        );
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
