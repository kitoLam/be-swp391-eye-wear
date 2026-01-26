import { FilterQuery } from 'mongoose';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { InvoiceListQuery } from '../../types/invoice/invoice.query';
import { IInvoiceDocument } from '../../models/invoice/invoice.model.mongo';
import { AuthAdminContext } from '../../types/context/context';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import {
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { orderRepository } from '../../repositories/order/order.repository';
import { productRepository } from '../../repositories/product/product.repository';

class InvoiceService {
    /**
     * Hàm trả danh sách hóa đơn
     * @param query
     * @returns
     */
    getInvoiceList = async (query: InvoiceListQuery) => {
        const filter: FilterQuery<IInvoiceDocument> = {};
        if (query.search) {
            const regex = new RegExp(query.search, 'gi');
            filter.$or = [{ invoiceCode: regex }, { fullName: regex }];
        }
        if (query.status) {
            filter.status = query.status;
        }
        const result = await invoiceRepository.find(filter, {
            limit: query.limit,
            page: query.page,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        return {
            invoiceList: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    };
    verifyInvoice = async (
        id: string,
        status: InvoiceStatus.APPROVED | InvoiceStatus.REJECTED,
        adminContext: AuthAdminContext
    ) => {
        const invoiceDetail = await invoiceRepository.findById(id);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }
        // Đơn bị hủy rồi thì ko cho approve
        if (invoiceDetail.status == InvoiceStatus.CANCELED) {
            throw new ConflictRequestError(
                'Invoice is canceled by customer, you can not change status anymore'
            );
        }
        // để tránh đg là reject mà gửi lên reject cái nữa thì cũng trừ kho
        if (status == invoiceDetail.status) {
            throw new ConflictRequestError(
                'New status are conflict with current status'
            );
        }
        // Muốn approve thì khách hiện tại phải đã cọc xong rồi
        if (
            status == InvoiceStatus.APPROVED &&
            !(invoiceDetail.status == InvoiceStatus.DEPOSITED)
        ) {
            throw new ConflictRequestError(
                'You can not approve invoice until deposit is done'
            );
        }
        if (status == InvoiceStatus.REJECTED) {
            // Cập nhật lại stock của từng order trong đơn về lại kho
            for (const orderId of invoiceDetail.orders) {
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
                                        'variants.$.stock':
                                            orderProduct.quantity,
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
        const updatedInvoice = await invoiceRepository.update(id, {
            status: status,
            staffVerified: adminContext.id,
        });
        return updatedInvoice;
    };
}

export default new InvoiceService();
