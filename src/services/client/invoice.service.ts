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
import { addInvoiceToTimeoutQueue } from '../../queues/invoice.queue';
import { PreOrderImportModel } from '../../models/pre-order-import/pre-order-import.model.mongo';
import {
    VoucherType,
    VoucherStatus,
    VoucherApplyScope,
    VoucherClaimStatus,
} from '../../config/enums/voucher.enum';
import { notificationHandler } from '../../socket/handlers/notification.handler';
import { mailAdminService } from '../admin/mail.service';
import { ShipFeeModel } from '../../models/ship/ship-fee.model.mongo';

interface InvoiceProduct {
    productId: string;
    sku: string;
    qty: number;
    type: 'frame' | 'lens' | 'sunglass';
}

class InvoiceClientService {
    private getShipFeeFromDatabase = async () => {
        const globalFeeConfig = await ShipFeeModel.findOne({
            province: 'GLOBAL',
            district: null,
            ward: null,
            isActive: true,
        });

        if (!globalFeeConfig || typeof globalFeeConfig.fee !== 'number') {
            throw new BadRequestError(
                'Không tìm thấy cấu hình phí ship GLOBAL trong DB'
            );
        }

        return globalFeeConfig.fee;
    };

    /**
     * Helper: Acquire product lock in Redis
     */
    public acquireProductLock = async (
        key: string,
        qty: number,
        stockAvailable: number,
        type: 'race' | 'online' = 'race'
    ) => {
        const seconds = type === 'race' ? 10 : 15 * 60;
        // Lệnh này trả về giá trị SAU KHI TĂNG (ví dụ: đang 0 tăng lên 1 thì trả về 1)
        const currentLockCount = await redisService.incrKeyBy(key, qty);

        // KIỂM TRA NGAY TẠI ĐÂY:
        // Nếu giá trị sau khi tăng vượt quá tồn kho thực tế (DB + cache online)
        if (currentLockCount > stockAvailable) {
            // Trả lại chỗ ngay lập tức để không làm hỏng số liệu lock
            await redisService.incrKeyBy(key, -qty);

            // Ném lỗi ngay lập tức - User này sẽ nhận lỗi 400 và dừng lại
            throw new BadRequestError('Sản phẩm đã hết hàng!');
        }

        // Nếu chạy xuống đến đây nghĩa là User đã "giữ chỗ" thành công
        // Chỉ có người có currentLockCount hợp lệ mới đi tiếp được
        await redisService.setExpire(key, seconds);
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
                    await redisService.descKeyBy(lock.key, lock.qty);
                    await redisService.setExpire(lock.key, seconds);
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
        customerId: string,
        currentFeeShip: number
    ): Promise<{
        discount: number;
        voucherId?: string;
        voucherDoc?: any;
        finalFeeShip: number;
        voucherRecordCreated?: boolean;
    }> => {
        if (!voucherCodes || voucherCodes.length === 0) {
            return { discount: 0, finalFeeShip: currentFeeShip };
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

        // 2. Global guard: nếu đã có bản ghi metadata.status = USED thì không cho dùng lại
        const { data: voucherUserRecords, error: voucherUserRecordsError } =
            await supabase
                .from('voucher_user')
                .select('metadata')
                .eq('customer_id', customerId)
                .eq('voucher_id', voucher._id.toString());

        if (voucherUserRecordsError) {
            throw new BadRequestError(
                'Không thể kiểm tra lịch sử sử dụng voucher: ' +
                    voucherUserRecordsError.message
            );
        }

        const hasUsedRecord = (voucherUserRecords || []).some(
            (record: any) =>
                record?.metadata?.status === VoucherClaimStatus.USED
        );

        if (hasUsedRecord) {
            throw new BadRequestError('Voucher này đã được sử dụng');
        }

        // 3. Check voucher ownership/update voucher_user status in Supabase
        let voucherRecordCreated = false;
        if (voucher.applyScope === VoucherApplyScope.SPECIFIC) {
            // SPECIFIC: must belong to customer and must be CLAIMED before use
            const { data: voucherUser, error: fetchError } = await supabase
                .from('voucher_user')
                .select('*')
                .eq('customer_id', customerId)
                .eq('voucher_id', voucher._id.toString())
                .is('deleted_at', null)
                .single();

            if (fetchError || !voucherUser) {
                throw new BadRequestError(
                    'Bạn không có quyền sử dụng voucher này hoặc voucher không thuộc về bạn'
                );
            }

            const currentStatus = voucherUser.metadata?.status;
            if (currentStatus === VoucherClaimStatus.USED) {
                throw new BadRequestError('Voucher này đã được sử dụng');
            }
            if (currentStatus !== VoucherClaimStatus.CLAIMED) {
                throw new BadRequestError(
                    'Voucher chưa được claim. Vui lòng claim voucher trước khi sử dụng'
                );
            }

            const updatedMetadata = {
                ...(voucherUser.metadata || {}),
                status: VoucherClaimStatus.USED,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('voucher_user')
                .update({
                    metadata: updatedMetadata,
                    updated_at: new Date().toISOString(),
                })
                .eq('customer_id', customerId)
                .eq('voucher_id', voucher._id.toString())
                .is('deleted_at', null);

            if (updateError) {
                throw new BadRequestError(
                    'Không thể áp dụng voucher: ' + updateError.message
                );
            }
        }

        if (voucher.applyScope === VoucherApplyScope.ALL) {
            // ALL: không cần check ownership, nhưng cần tạo voucher_user record như grant và đánh dấu USED luôn
            const { data: existingVoucherUser, error: existingError } =
                await supabase
                    .from('voucher_user')
                    .select('*')
                    .eq('customer_id', customerId)
                    .eq('voucher_id', voucher._id.toString())
                    .is('deleted_at', null)
                    .maybeSingle();

            if (existingError) {
                throw new BadRequestError(
                    'Không thể kiểm tra trạng thái voucher: ' +
                        existingError.message
                );
            }

            if (existingVoucherUser) {
                const currentStatus = existingVoucherUser.metadata?.status;
                if (currentStatus === VoucherClaimStatus.USED) {
                    throw new BadRequestError('Voucher này đã được sử dụng');
                }

                const updatedMetadata = {
                    ...(existingVoucherUser.metadata || {}),
                    status: VoucherClaimStatus.USED,
                    updated_at: new Date().toISOString(),
                };

                const { error: updateError } = await supabase
                    .from('voucher_user')
                    .update({
                        metadata: updatedMetadata,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('customer_id', customerId)
                    .eq('voucher_id', voucher._id.toString())
                    .is('deleted_at', null);

                if (updateError) {
                    throw new BadRequestError(
                        'Không thể áp dụng voucher: ' + updateError.message
                    );
                }
            } else {
                // Ensure FK customer_id tồn tại trong bảng customer của Supabase
                const { data: supabaseCustomer, error: customerFetchError } =
                    await supabase
                        .from('customer')
                        .select('id')
                        .eq('id', customerId)
                        .maybeSingle();

                if (customerFetchError) {
                    throw new BadRequestError(
                        'Không thể kiểm tra customer trong Supabase: ' +
                            customerFetchError.message
                    );
                }

                if (!supabaseCustomer) {
                    const { error: customerInsertError } = await supabase
                        .from('customer')
                        .insert([{ id: customerId }]);

                    if (customerInsertError) {
                        throw new BadRequestError(
                            'Không thể đồng bộ customer sang Supabase: ' +
                                customerInsertError.message
                        );
                    }
                }

                const { error: insertError } = await supabase
                    .from('voucher_user')
                    .insert([
                        {
                            id: crypto.randomUUID(),
                            customer_id: customerId,
                            voucher_id: voucher._id.toString(),
                            metadata: {
                                status: VoucherClaimStatus.USED,
                                granted_by: 'SYSTEM_ALL_SCOPE',
                                updated_at: new Date().toISOString(),
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                if (insertError) {
                    throw new BadRequestError(
                        'Không thể áp dụng voucher: ' + insertError.message
                    );
                }
                voucherRecordCreated = true;
            }
        }

        // 3. Validate voucher conditions (Date, Status, Usage, MinOrder)
        const now = new Date();
        if (voucher.status !== VoucherStatus.ACTIVE) {
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
        let finalFeeShip = currentFeeShip;
        if (voucher.typeDiscount === VoucherType.FIXED) {
            discount = voucher.value;
        } else if (voucher.typeDiscount === VoucherType.PERCENTAGE) {
            discount = (totalPrice * voucher.value) / 100;
        } else if (voucher.typeDiscount === VoucherType.FREE_SHIP) {
            // If FREE_SHIP, feeShip becomes 0
            finalFeeShip = 0;
            discount = 0; // The discount is reflected in feeShip being 0
        }

        if (voucher.typeDiscount !== VoucherType.FREE_SHIP) {
            if (voucher.typeDiscount === VoucherType.PERCENTAGE) {
                discount = Math.min(discount, voucher.maxDiscountValue);
            }
            discount = Math.min(discount, totalPrice);
        }

        return {
            discount,
            voucherId: voucher._id.toString(),
            voucherDoc: voucher,
            finalFeeShip,
            voucherRecordCreated,
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

        // 2. Update metadata in Supabase voucher_user if SPECIFIC
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
     * Helper: Revert voucher status to CLAIMED in case of failure
     */
    private revertVoucherStatus = async (
        voucherId: string,
        customerId: string,
        voucherRecordCreated: boolean = false
    ) => {
        if (voucherRecordCreated) {
            await supabase
                .from('voucher_user')
                .delete()
                .eq('customer_id', customerId)
                .eq('voucher_id', voucherId);
            return;
        }

        const { data: currentRecord } = await supabase
            .from('voucher_user')
            .select('metadata')
            .eq('customer_id', customerId)
            .eq('voucher_id', voucherId)
            .is('deleted_at', null)
            .single();

        if (
            currentRecord &&
            currentRecord.metadata?.status === VoucherClaimStatus.USED
        ) {
            const newMetadata = {
                ...currentRecord.metadata,
                status: VoucherClaimStatus.CLAIMED,
                reverted_at: new Date().toISOString(),
            };
            delete newMetadata.used_at;
            delete newMetadata.invoice_id;

            await supabase
                .from('voucher_user')
                .update({
                    metadata: newMetadata,
                    updated_at: new Date().toISOString(),
                })
                .eq('customer_id', customerId)
                .eq('voucher_id', voucherId)
                .is('deleted_at', null);
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
        const feeShip = await this.getShipFeeFromDatabase();
        const acquiredLocks: { key: string; qty: number }[] = [];
        const alreadyDecreasedItems: {
            _id: string;
            sku: string;
            qty: number;
            mode: ProductVariantMode;
        }[] = [];
        const invoiceProducts: InvoiceProduct[] = [];
        let appliedVoucherId: string | undefined;
        let appliedVoucherRecordCreated = false;

        try {
            // Separate products by type
            const normalProducts: OrderProduct[] = [];
            const manufacturingProducts: OrderProduct[] = [];
            const preOrderProducts: OrderProduct[] = [];
            const preOrderProductModeSkuSet = new Set();
            let totalPrice = 0;
            let hasManufacturingProduct = false;

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
                const keyOnline = `${redisPrefix.productLockOnline}:${item.product.product_id}:${item.product.sku}`;
                // === End check stock ===
                const realProductVariantStock =
                    await productService.getVariantStock(
                        item.product.product_id,
                        item.product.sku
                    );
                const realProductVariantStockOnline =
                    (await redisService.getDataByKey<number>(keyOnline)) || 0;
                const currentProductVariantStock =
                    realProductVariantStock - realProductVariantStockOnline;
                // ==== Acquire race lock ====
                await this.acquireProductLock(
                    keyRace,
                    item.quantity,
                    currentProductVariantStock,
                    'race'
                );
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
                    const keyOnline = `${redisPrefix.productLockOnline}:${item.lens.lens_id}:${item.lens.sku}`;
                    // === End check stock ===
                    const realLensVariantStock =
                        await productService.getVariantStock(
                            item.lens.lens_id,
                            item.lens.sku
                        );
                    const realLensVariantStockOnline =
                        (await redisService.getDataByKey<number>(keyOnline)) ||
                        0;
                    const currentLensVariantStock =
                        realLensVariantStock - realLensVariantStockOnline;
                    // Acquire race lock
                    await this.acquireProductLock(
                        keyRace,
                        item.quantity,
                        currentLensVariantStock,
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
                    hasManufacturingProduct = true;
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

            // Check if there's any manufacturing product and payment method is COD
            if (
                hasManufacturingProduct &&
                payload.paymentMethod === PaymentMethodType.COD
            ) {
                throw new BadRequestError(
                    'MANUFACTURING products must be paid online, please choose another payment method instead of COD'
                );
            }

            // Apply Voucher
            const {
                discount: totalDiscount,
                voucherId,
                finalFeeShip,
                voucherRecordCreated,
            } = await this.validateAndCalculateVoucher(
                payload.voucher,
                totalPrice,
                customerId,
                feeShip
            );

            appliedVoucherId = voucherId;
            appliedVoucherRecordCreated = Boolean(voucherRecordCreated);

            // Create Invoice
            // Determine invoice status based on payment method and product types
            let invoiceStatus = InvoiceStatus.PENDING;
            if (payload.paymentMethod == PaymentMethodType.COD) {
                // If COD and no manufacturing products, set to APPROVED
                // Manufacturing products need deposit, so they should be DEPOSITED
                if (manufacturingProducts.length == 0) {
                    invoiceStatus = InvoiceStatus.APPROVED;
                } else {
                    invoiceStatus = InvoiceStatus.DEPOSITED;
                }
            }

            const invoiceData = {
                owner: customerId,
                totalPrice: totalPrice,
                totalDiscount,
                voucher: voucherId ? [voucherId] : [],
                address: payload.address,
                status: invoiceStatus,
                fullName: payload.fullName,
                phone: payload.phone,
                invoiceCode: generateInvoiceCode(),
                note: payload.note,
                feeShip: finalFeeShip,
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
                    await redisService.incrKeyBy(key, product.qty);
                    await redisService.setExpire(key, 15 * 60);
                }

                // Save invoice-products mapping to Redis
                const invoiceProductsKey = `${
                    redisPrefix.invoiceProducts
                }:${newInvoice._id.toString()}`;
                await redisService.setDataWithExpiredTime(
                    invoiceProductsKey,
                    invoiceProducts,
                    15 * 60
                );

                // Add to timeout queue
                await addInvoiceToTimeoutQueue({
                    invoiceId: newInvoice._id.toString(),
                });
            } else {
                await mailAdminService.sendInvoiceConfirmation(
                    newInvoice as any
                );
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
            // add notification
            await notificationHandler.onInvoiceCreate({
                invoiceId: newInvoice._id.toString(),
            });
            return {
                invoice: newInvoice,
                payment: newPayment,
            };
        } catch (error) {
            // Revert voucher status if it was marked as USED
            if (appliedVoucherId) {
                await this.revertVoucherStatus(
                    appliedVoucherId,
                    customerId,
                    appliedVoucherRecordCreated
                ).catch(err =>
                    console.error('Failed to revert voucher status:', err)
                );
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
            if(status == "PROCESSING"){
                filter.status = { $in: [InvoiceStatus.ONBOARD, InvoiceStatus.COMPLETED, InvoiceStatus.READY_TO_SHIP] }
            }
            else 
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
            invoice.status === InvoiceStatus.PENDING
        ) {
            invoiceStatus = 'PENDING';
        } else if(invoice.status === InvoiceStatus.DEPOSITED){
            invoiceStatus = 'DEPOSITED';
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
        // Nếu đơn đã qua bước được manager onboard rồi thì không cho hủy nữa
        if (
            existInvoice.status != InvoiceStatus.PENDING &&
            existInvoice.status != InvoiceStatus.DEPOSITED &&
            existInvoice.status != InvoiceStatus.REJECTED &&
            existInvoice.status != InvoiceStatus.APPROVED
        ) {
            throw new ConflictRequestError(
                'Invoice has been onboard, so you can not cancel it anymore'
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
