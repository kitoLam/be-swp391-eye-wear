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
import { config } from '../../config/env.config';
import axios from 'axios';
import {
    InvoiceAssignHandleDeliveryRequest,
    RejectInvoiceRequest,
} from '../../types/invoice/invoice.request';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { RoleType } from '../../config/enums/admin-account';
import { ProductVariantMode } from '../../config/enums/product.enum';
import { PreOrderImportModel } from '../../models/pre-order-import/pre-order-import.model.mongo';

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
        if (query.invoiceCode) {
            filter.invoiceCode = new RegExp(query.invoiceCode, 'gi');
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

    getInvoiceListWithOrders = async (
        query: InvoiceListQuery,
        staffHandleDelivery?: string
    ) => {
        const result = await invoiceRepository.getInvoiceListWithOrderTypes({
            page: query.page,
            limit: query.limit,
            search: query.search,
            status: query.status,
            statuses: query.statuses,
            staffHandleDelivery,
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
        // Muốn approve thì khách hiện tại phải đã cọc xong rồi
        if (!(invoiceDetail.status == InvoiceStatus.DEPOSITED)) {
            throw new ConflictRequestError(
                'You can not approve invoice if current status is not DEPOSITED'
            );
        }
        // Tương thích cả dữ liệu cũ lưu invoiceId dạng string và dữ liệu mới dạng ObjectId
        const invoiceOrderFilter = {
            $or: [
                { invoiceId: invoiceDetail._id },
                { invoiceId: invoiceDetail._id.toString() },
            ],
        };

        // tất cả Order phải được approve rồi
        const totalAllOrders = await orderRepository.count(invoiceOrderFilter);
        const totalApprovedOrders = await orderRepository.count({
            ...invoiceOrderFilter,
            status: OrderStatus.APPROVED,
        });
        if (totalAllOrders != totalApprovedOrders) {
            throw new ConflictRequestError(
                'You can not approve invoice if not all orders are approved'
            );
        }
        // Cập nhật các order trong invoice này thành waiting assign
        await orderRepository.updateMany(invoiceOrderFilter, {
            status: OrderStatus.WAITING_ASSIGN,
        });
        // Cập nhật trạng thái approve
        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.APPROVED,
            staffVerified: adminContext.id,
            verifiedAt: new Date(),
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
        adminContext: AuthAdminContext,
        requestBody: RejectInvoiceRequest
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
        // Nếu 1 invoice bị reject => all trạng thái order là cancelled
        await orderRepository.updateMany(
            {
                invoiceId: invoiceDetail._id,
            },
            {
                status: OrderStatus.CANCELED,
                verifiedBy: adminContext.id,
                verifiedAt: new Date()
            }
        );
        // Cập nhật trạng thái rejected
        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.REJECTED,
            staffVerified: adminContext.id,
            verifiedAt: new Date(),
            rejectedNote: requestBody.note,
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
        const foundInvoice = await invoiceRepository.findById(invoiceId);
        if (!foundInvoice) {
            throw new NotFoundRequestError('Invoice not found');
        }
        if (foundInvoice.status !== InvoiceStatus.APPROVED) {
            throw new ConflictRequestError(
                'Invoice need to be approved before onboard'
            );
        }
        await orderRepository.updateByFilter(
            {
                invoiceId: invoiceId,
            },
            {
                status: OrderStatus.WAITING_ASSIGN,
            }
        );
        await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.ONBOARD,
            managerOnboard: adminContext.id,
            onboardedAt: new Date(),
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
        if (invoiceDetail.status !== InvoiceStatus.ONBOARD) {
            throw new ConflictRequestError(
                'Invoice need to be onboarding before being complete'
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
     * Mark invoice as READY_TO_SHIP
     * @param invoiceId - ID of the invoice
     * @param adminContext - Context of the admin user
     */
    readyToShipInvoice = async (
        invoiceId: string,
        adminContext: AuthAdminContext
    ) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // Logic check: Chỉ cho phép từ COMPLETED sang READY_TO_SHIP
        if (invoiceDetail.status !== InvoiceStatus.COMPLETED) {
            throw new ConflictRequestError(
                'Invoice status must be COMPLETED to update to READY_TO_SHIP'
            );
        }

        // Logic check: userId trong token phải trùng với staffHandleDelivery
        if (invoiceDetail.staffHandleDelivery !== adminContext.id) {
            throw new ConflictRequestError(
                'Only the assigned delivery staff can update this invoice to READY_TO_SHIP'
            );
        }

        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.READY_TO_SHIP,
        });
        // ============ Test call api shipment =============
        const api = config.shipment.createApi;
        const bodyData = {
            invoiceId: invoiceDetail._id.toString(),
            shipAddress:
                invoiceDetail.address.street +
                ', ' +
                invoiceDetail.address.ward +
                ', ' +
                invoiceDetail.address.city,
        };
        try {
            const response = await axios.post<{
                data: { shipCode: string; estimatedShipDate: string };
            }>(api, bodyData);
            return {
                updatedInvoice,
                shipmentData: response.data.data,
            };
        } catch (error) {
            throw new Error('Failed to call api shipment');
        }
    };

    /**
     * Mark invoice as DELIVERING
     * @param invoiceId - ID of the invoice
     * @param adminContext - Context of the admin user
     */
    deliveringInvoice = async (invoiceId: string) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }

        if (
            invoiceDetail.status === InvoiceStatus.CANCELED ||
            invoiceDetail.status === InvoiceStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot update status of a canceled or rejected invoice'
            );
        }

        await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.DELIVERING,
        });
    };

    /**
     * Mark invoice as DELIVERED
     * NO AUTHENTICATION REQUIRED - Public endpoint
     * @param invoiceId - ID of the invoice
     */
    deliveredInvoice = async (invoiceId: string) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }

        if (
            invoiceDetail.status === InvoiceStatus.CANCELED ||
            invoiceDetail.status === InvoiceStatus.REJECTED
        ) {
            throw new ConflictRequestError(
                'Cannot update status of a canceled or rejected invoice'
            );
        }

        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            status: InvoiceStatus.DELIVERED,
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

    assignInvoiceToHandleDelivery = async (
        adminContext: AuthAdminContext,
        invoiceId: string,
        payload: InvoiceAssignHandleDeliveryRequest
    ) => {
        // check invoice exist
        const foundInvoice = await invoiceRepository.findById(invoiceId);
        if (!foundInvoice) {
            throw new NotFoundRequestError('Invoice not found');
        }

        // check invoice status
        if (foundInvoice.status !== InvoiceStatus.COMPLETED) {
            throw new ConflictRequestError(
                'Invoice status must be COMPLETED to assign'
            );
        }

        // check all orders are completed
        const countAllOrders = await orderRepository.count({
            invoiceId: foundInvoice._id,
        });
        const countCompletedOrders = await orderRepository.count({
            invoiceId: foundInvoice._id,
            status: OrderStatus.COMPLETED,
        });

        if (countAllOrders !== countCompletedOrders) {
            throw new ConflictRequestError(
                'Cannot assign invoice because not all orders are completed'
            );
        }

        // check if invoice already assigned to a staff
        if (foundInvoice.staffHandleDelivery) {
            throw new ConflictRequestError(
                'Invoice has already been assigned to a delivery staff'
            );
        }
        // Enforce all orders must be completed
        const totalAllOrders = await orderRepository.count({
            invoiceId: foundInvoice._id,
        });
        const totalCompletedOrders = await orderRepository.count({
            invoiceId: foundInvoice._id,
            status: OrderStatus.COMPLETED,
        });

        if (totalAllOrders !== totalCompletedOrders) {
            throw new ConflictRequestError(
                'Cannot complete invoice because not all orders are completed'
            );
        }
        // check admin onboard is the same with cur admin
        if (foundInvoice.managerOnboard != adminContext.id) {
            throw new ConflictRequestError('Only manager onboard can assign');
        }

        // check delivery staff exist
        const foundDeliveryStaff = await adminAccountRepository.findById(
            payload.assignedStaff
        );
        if (!foundDeliveryStaff) {
            throw new NotFoundRequestError('Delivery staff not found');
        }

        // check delivery staff role
        if (foundDeliveryStaff.role != RoleType.OPERATION_STAFF) {
            throw new ConflictRequestError(
                'Delivery staff role must be OPERATION_STAFF'
            );
        }

        const updatedInvoice = await invoiceRepository.update(invoiceId, {
            staffHandleDelivery: payload.assignedStaff,
            assignStaffHandleDeliveryAt: new Date(),
        });
        return updatedInvoice;
    };

    getInvoiceDetail = async (invoiceId: string) => {
        const invoiceDetail = await invoiceRepository.findById(invoiceId);
        if (!invoiceDetail) {
            throw new NotFoundRequestError('Invoice not found');
        }
        return invoiceDetail;
    };
}

export default new InvoiceService();
