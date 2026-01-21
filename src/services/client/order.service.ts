import { orderRepository } from '../../repositories/order/order.repository';
import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';
import { productRepository } from '../../repositories/product/product.repository';
import { ClientCreateOrder, UpdateOrder } from '../../types/order/order';
import {
    BadRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';

class OrderClientService {
    /**
     * Create new order (Checkout)
     */
    createOrder = async (customerId: string, payload: ClientCreateOrder) => {
        const { products, voucher: voucherCodes } = payload;

        // 1. Calculate Product Price
        let totalPrice = 0;

        for (const item of products) {
            const product = await productRepository.findById(item.product_id);
            if (!product) {
                throw new NotFoundRequestError(
                    `Product not found: ${item.product_id}`
                );
            }

            // Find variant by SKU
            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) {
                throw new BadRequestError(
                    `Variant with SKU ${item.sku} not found for product ${product.nameBase}`
                );
            }

            // Check stock
            if (variant.stock < item.quantity) {
                throw new BadRequestError(
                    `Product ${product.nameBase} (SKU: ${item.sku}) is out of stock`
                );
            }

            // Use finalPrice from variant
            totalPrice += variant.finalPrice * item.quantity;

            // Handle Lens Price if exists
            if (item.lens) {
                const lensProduct = await productRepository.findById(
                    item.lens.lens_id
                );
                if (!lensProduct) {
                    throw new NotFoundRequestError(
                        `Lens product not found: ${item.lens.lens_id}`
                    );
                }

                // Lens usually has variants too (e.g. refractive index).
                // Since we don't have SKU for lens in payload, we assume the first variant or a specific logic.
                // For safety, we'll use the first variant's price.
                if (lensProduct.variants && lensProduct.variants.length > 0) {
                    const lensVariant = lensProduct.variants[0];
                    const lensQty = item.lens.quantity || 1;
                    totalPrice += lensVariant.finalPrice * lensQty;
                }
            }
        }

        // 2. Determine Order Type & Validate Lens
        let orderType = 'NORMAL';
        for (const item of products) {
            if (item.lens) {
                orderType = 'MANUFACTURING';
                if (!item.lens.lens_id) {
                    throw new BadRequestError(
                        'Lens ID is required for lens product'
                    );
                }
            }
        }

        // 3. Apply Voucher
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

        // 4. Prepare Order Data
        const finalPrice = totalPrice - totalDiscount;

        const orderData: any = {
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

        // 5. Add Manufacturing Specific Fields
        if (orderType === 'MANUFACTURING') {
            orderData.isVerified = { status: 'PENDING' };
            orderData.assignment = { status: 'PENDING' };
        } else {
            // Normal orders might auto-approve or stay pending
            orderData.isVerified = { status: 'APPROVE' };
        }

        // 6. Create Order
        const newOrder = await orderRepository.create(orderData);
        return newOrder;
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
    getOrderDetail = async (customerId: string, orderId: string) => {
        const order = await orderRepository.findById(orderId);

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        if (order.owner !== customerId) {
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
        orderId: string,
        payload: UpdateOrder
    ) => {
        const order = await orderRepository.findById(orderId);

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        if (order.owner !== customerId) {
            throw new NotFoundRequestError('Order not found');
        }

        // Prevent update if order is already processed/shipping etc.
        // This logic depends on business rules.

        const updated = await orderRepository.update(orderId, payload);
        return updated;
    };
}

export default new OrderClientService();
