import { Server, Socket } from 'socket.io';
import { BaseSocketHandler } from './base-socket-handler';
import {
    emittedEvent,
    listenedEvent,
} from '../../config/constants/socket-event.constant';
import { withValidation } from '../middlewares/validator.middleware';
import {
  AssignInvoice,
  AssignInvoiceSchema,
  AssignOrder,
    AssignOrderSchema,
    CreateInvoiceSuccess,
    CreateInvoiceSuccessSchema,
} from '../schemas/notification.schema';
import { RoleType } from '../../config/enums/admin-account';
import { NotificationModel } from '../../models/notification/notification.model';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { NotificationType } from '../../config/enums/notification.enum';
import { AdminAccountModel } from '../../models/admin-account/admin-account.model.mongo';
import { orderRepository } from '../../repositories/order/order.repository';

export class NotificationHandler extends BaseSocketHandler {
    private socket: Socket;
    constructor(socket: Socket) {
        super();
        this.socket = socket;
    }
    registerHandler = async () => {
        this.initHandler();
        this.socket.on(
            listenedEvent.notification.INVOICE_CREATE,
            withValidation(CreateInvoiceSuccessSchema, this.onInvoiceCreate)
        );
        this.socket.on(
            listenedEvent.notification.ASSIGN_INVOICE,
            withValidation(AssignInvoiceSchema, this.onAssignInvoice)
        );
        this.socket.on(
            listenedEvent.notification.ASSIGN_ORDER,
            withValidation(AssignOrderSchema, this.onAssignOrder)
        );
    };
    initHandler(): void {
        const { id, userType, role } = this.socket.user!;
        if (userType == 'STAFF') {
            this.socket.join(`NOTIFICATION:PUBLIC:ALL`);
            this.socket.join(`NOTIFICATION:PUBLIC:${role}`);
            this.socket.join(`NOTIFICATION:PRIVATE:${id}`);
        }
    }
    endHandler(): void {}

    onInvoiceCreate = async (payload: CreateInvoiceSuccess) => {
        // chỉ gửi cho sale
        const foundInvoice = await invoiceRepository.findOne({
            _id: payload.invoiceId,
        });
        if (!foundInvoice) return;
        const allSaleAdmin = await AdminAccountModel.find({
            role: RoleType.SALE_STAFF,
        });
        const newNotification = new NotificationModel({
            title: `New Created Order`,
            type: NotificationType.INVOICE_CREATE,
            message: `${foundInvoice.fullName} has create an invoice ${foundInvoice.invoiceCode}, click to see more detail`,
            allowedStaffs: allSaleAdmin.map(item => `${item._id}`),
            metadata: {
                invoiceId: payload.invoiceId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        };
        this.socket
            .to(`NOTIFICATION:PUBLIC:${RoleType.SALE_STAFF}`)
            .emit(
                emittedEvent.notification.RECEIVE_INVOICE_CREATE,
                JSON.stringify(dataResponse)
            );
    };

    onAssignOrder = async (payload: AssignOrder) => {
      // chỉ gửi cho oper nhận task
        const foundOrder = await orderRepository.findOne({
            _id: payload.orderId,
        });
        if (!foundOrder) return;
        const newNotification = new NotificationModel({
            title: `New Order Assigned`,
            type: NotificationType.INVOICE_CREATE,
            message: `You has been assigned to order ${foundOrder.orderCode}, click to see more detail`,
            allowedStaffs: [foundOrder.assignedStaff],
            metadata: {
                orderId: payload.orderId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        }
        this.socket
            .to(`NOTIFICATION:PRIVATE:${foundOrder.assignedStaff}`)
            .emit(
                emittedEvent.notification.RECEIVE_ASSIGN_ORDER,
                JSON.stringify(dataResponse)
            );
    };

    onAssignInvoice = async (payload: AssignInvoice) => {
      const foundInvoice = await invoiceRepository.findOne({
            _id: payload.invoiceId,
        });
        if (!foundInvoice) return;
        const newNotification = new NotificationModel({
            title: `New Delivery Invoice Assigned`,
            type: NotificationType.INVOICE_CREATE,
            message: `You has been assigned to invoice ${foundInvoice.invoiceCode} to handle delivery, click to see more detail`,
            allowedStaffs: [foundInvoice.staffHandleDelivery],
            metadata: {
                invoiceId: payload.invoiceId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        }
        this.socket
            .to(`NOTIFICATION:PRIVATE:${foundInvoice.staffHandleDelivery}`)
            .emit(
                emittedEvent.notification.RECEIVE_ASSIGN_INVOICE,
                JSON.stringify(dataResponse)
            );
    };
}
