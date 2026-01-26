import { orderRepository } from '../../repositories/order/order.repository';
import {  ClientUpdateOrder } from '../../types/order/order';
import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
class OrderClientService {
    

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
