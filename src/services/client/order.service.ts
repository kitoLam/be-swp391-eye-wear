import { orderRepository } from '../../repositories/order/order.repository';
import { ClientCreateOrder } from '../../types/order/order';
import { BadRequestError } from '../../errors/apiError/api-error';

class OrderClientService {
    /**
     * Create new order
     * Auto-detect type: NORMAL vs MANUFACTURING
     */
    createOrder = async (payload: ClientCreateOrder) => {
        const { products } = payload;

        let orderType = 'NORMAL';
        let hasLens = false;

        // 1. Determine Order Type
        for (const item of products) {
            if (item.lens) {
                hasLens = true;
                // If any item has lens, it's a manufacturing order
                orderType = 'MANUFACTURING';

                // Validate Lens Parameters (Basic check)
                if (!item.lens.lens_id) {
                    throw new BadRequestError(
                        'Lens ID is required for lens product'
                    );
                }
                // More extensive validation can be added here
            }
        }

        // 2. Prepare Order Data
        const orderData: any = {
            ...payload,
            type: orderType,
            products: products,
            price: payload.price, // Should ideally be re-calculated from DB prices
        };

        // 3. Add Manufacturing Specific Fields
        if (orderType === 'MANUFACTURING') {
            orderData.isVerified = {
                status: 'PENDING',
            };
            orderData.assignment = {
                status: 'PENDING',
            };
        } else {
            // NORMAL Order
            // Can be auto-verified/completed or just left as basic order
            // For now, consistent structure is good.
            orderData.isVerified = {
                status: 'APPROVE', // Auto approve normal orders? Or leave pending?
                // User said: "nếu đơn hàng tồn tại cùng lúc gọng kính và tròng kính thì nó là đơn MANUFACTURING"
                // Normal orders usually don't need "verification" of medical parameters.
            };
        }

        // 4. Create Order
        const newOrder = await orderRepository.create(orderData);
        return newOrder;
    };
}

export default new OrderClientService();
