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
import { OrderStatus } from '../../config/enums/order.enum';

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
        if (query.statuses?.length) {
            filter.status = { $in: query.statuses };
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

    getInvoiceListWithOrders = async (query: InvoiceListQuery) => {
        const result = await invoiceRepository.getInvoiceListWithOrderTypes({
            page: query.page,
            limit: query.limit,
            search: query.search,
            status: query.status,
            statuses: query.statuses,
        });
        return {
            invoiceList: result.data,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / query.limit),
            },
        };
    };
    /**
     * Hàm xử lí nghiệp vụ duyệt đơn cùa sale staff
     * @param invoiceId
     * @param adminContext
     * @returns
     */
    approveInvoice = async (
        invoiceId: string,
        adminContext: AuthAdminContext
    ) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }
        // Đơn bị hủy rồi thì ko cho approve
        if (
            invoiceDetail.status == InvoiceStatus.CANCELED ||
            invoiceDetail.status == InvoiceStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Invoice is canceled or rejected , you can not change status anymore'
            );
        }
        // Muốn approve thì khách hiện tại phải đã cọc xong rồi
        if (!(invoiceDetail.status == InvoiceStatus.DEPOSITED)) {
            throw new ConflictRequestError(
                'You can not approve invoice if current status is not DEPOSITED'
            );
        }
        // tất cả Order phải được approve rồi
        const totalAllOrders = await orderRepository.count({
            invoiceId: invoiceDetail._id,
        });
        const totalApprovedOrders = await orderRepository.count({
            invoiceId: invoiceDetail._id,
            status: OrderStatus.APPROVED,
        });
        if (totalAllOrders != totalApprovedOrders) {
            throw new ConflictRequestError(
                'You can not approve invoice if not all orders are approved'
            );
        }
        // Cập nhật các order trong invoice này thành waiting assign
        await orderRepository.updateMany(
            {
                invoiceId: invoiceDetail._id,
            },
            {
                status: OrderStatus.WAITING_ASSIGN,
            }
        );
        // Cập nhật trạng thái approve
        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.APPROVED,
            staffVerified: adminContext.id,
        });
        return updatedInvoice;
    };
    /**
     * Hàm xử lí nghiệp vụ từ chối đơn của sale staff
     * @param invoiceId
     * @param adminContext
     * @returns
     */
    rejectInvoice = async (
        invoiceId: string,
        adminContext: AuthAdminContext
    ) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }
        // Đơn bị hủy rồi thì ko cho reject nữa
        if (
            invoiceDetail.status == InvoiceStatus.CANCELED ||
            invoiceDetail.status == InvoiceStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Invoice is canceled or rejected , you can not change status anymore'
            );
        }
        // cập nhật lại kho
        // Cập nhật lại stock của từng order trong đơn về lại kho
        const orderList = await orderRepository.findAllNoPagination({
            invoiceId: invoiceDetail._id,
        });
        for (const orderDetail of orderList) {
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
        // Nếu 1 invoice bị reject => all trạng thái order là cancelled
        await orderRepository.updateMany(
            {
                invoiceId: invoiceDetail._id,
            },
            {
                status: OrderStatus.CANCELED,
            }
        );
        // Cập nhật trạng thái rejected
        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.REJECTED,
            staffVerified: adminContext.id,
        });
        return updatedInvoice;
    };

    /**
     * Assign a manager to an invoice
     * @param invoiceId - ID of the invoice
     * @param adminContext - Context of the admin user
     */

    onboardInvoice = async (
        invoiceId: string,
        adminContext: AuthAdminContext
    ) => {
        await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.ONBOARD,
            managerOnboard: adminContext.id,
        });
    };

    /**
     * Complete an invoice
     * @param invoiceId - ID of the invoice
     * @param adminContext - Context of the admin user
     */
    completeInvoice = async (
        invoiceId: string,
        adminContext: AuthAdminContext
    ) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Check if invoice is already canceled or rejected
        if (
            invoiceDetail.status === InvoiceStatus.CANCELED ||
            invoiceDetail.status === InvoiceStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot complete a canceled or rejected invoice'
            );
        }

        // Enforce all orders must be completed
        const totalAllOrders = await orderRepository.count({
            invoiceId: invoiceDetail._id,
        });
        const totalCompletedOrders = await orderRepository.count({
            invoiceId: invoiceDetail._id,
            status: OrderStatus.COMPLETED,
        });

        if (totalAllOrders !== totalCompletedOrders) {
            throw new ConflictRequestError(
                'Cannot complete invoice because not all orders are completed'
            );
        }

        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.COMPLETED,
        });

        return updatedInvoice;
    };

    /**
     * Lấy danh sách invoices có status DEPOSITED với thông tin order types
     * Sử dụng aggregation pipeline để tối ưu performance
     * @returns Danh sách invoices với orders được map theo format {id, type}
     */
    getDepositedInvoicesWithOrderTypes = async () => {
        const result =
            await invoiceRepository.getDepositedInvoicesWithOrderTypes();
        return result;
    };
}

export default new InvoiceService();
