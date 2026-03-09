import { orderRepository } from '../../repositories/order/order.repository';
import { ClientUpdateOrder } from '../../types/order/order.request';
import {
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { AuthCustomerContext } from '../../types/context/context';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { OrderType } from '../../config/enums/order.enum';
class OrderClientService {

    /**
     * Get order by invoice ID
     */
    getOrderByInvoiceId = async (customerId: string, invoiceId: string) => {
        const invoice = await invoiceRepository.findOne({
            _id: invoiceId,
            owner: customerId,
        });

        if (!invoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        const orders = await orderRepository.find({
            invoiceId: invoice._id.toString(),
        });

        return {
            orderList: orders.data,
            pagination: {
                page: orders.page,
                limit: orders.limit,
                total: orders.total,
                totalPages: orders.totalPages,
            }
        };
    };

    /**
     * Get order detail
     */
    getOrderDetail = async (customerId: string, orderId: string) => {
        const order = await orderRepository.findOne({
            _id: orderId,
            owner: customerId,
        });

        if (!order) {
            throw new NotFoundRequestError('Order not found');
        }

        return order;
    };
    /**
     * Hàm giúp cập nhật thông số gia công trong order đơn thuốc (chỉ cho đơn loại MANUFACTURING vào sửa thông số đo)
     * @param customer 
     * @param orderId 
     * @param payload 
     */
    updateOrderPrescription = async (
        customer: AuthCustomerContext,
        orderId: string,
        payload: ClientUpdateOrder
    ) => {
        const invoiceContainOrderDetail = await invoiceRepository.findOne({
            _id: payload.invoiceId,
            owner: customer.id,
            orders: orderId,
        });
        const orderDetail = await orderRepository.findOne({
            _id: orderId,
            type: OrderType.MANUFACTURING
        });
        if (!invoiceContainOrderDetail || !orderDetail) {
            throw new NotFoundRequestError(
                'Invoice not found or order not exist in invoice!'
            );
        }
        // chỉ được sửa khi trc bước sale confirm
        if (
            !(invoiceContainOrderDetail.status == InvoiceStatus.PENDING) &&
            !(invoiceContainOrderDetail.status == InvoiceStatus.DEPOSITED)
        ) {
            throw new ConflictRequestError("Order can't be updated!");
        }
        await orderRepository.updateByFilter(
            {
                _id: orderId,
                'products.lens': { $exists: true },
            },
            {
                $set: {
                    'products.$.lens.parameters': payload.lensParameter,
                },
            }
        );
    };
}

export default new OrderClientService();
