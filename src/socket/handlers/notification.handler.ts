import { Socket } from 'socket.io';
import { BaseSocketHandler } from './base-socket-handler';
import {
    emittedEvent,
} from '../../config/constants/socket-event.constant';
import {
    AssignInvoice,
    AssignOrder,
    CompleteInvoice,
    CreateInvoiceSuccess,
} from '../schemas/notification.schema';
import { RoleType } from '../../config/enums/admin-account';
import { NotificationModel } from '../../models/notification/notification.model';
import { invoiceRepository } from '../../repositories/invoice/invoice.repository';
import { NotificationType } from '../../config/enums/notification.enum';
import { AdminAccountModel } from '../../models/admin-account/admin-account.model.mongo';
import { orderRepository } from '../../repositories/order/order.repository';
import { MySocketServer } from '../index.socket';

class NotificationHandler extends BaseSocketHandler {
    registerHandler = async (socket: Socket) => {
        this.initHandler(socket);

    };
    initHandler(socket: Socket): void {
        const { id, userType, role } = socket.user!;
        if (userType == 'STAFF') {
            socket.join(`NOTIFICATION:PUBLIC:ALL`);
            socket.join(`NOTIFICATION:PUBLIC:${role}`);
            socket.join(`NOTIFICATION:PRIVATE:${id}`);
        }
    }
    endHandler(socket: Socket): void {}

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
            title: `New Order Is Created`,
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
        MySocketServer.getIO()
            .to(`NOTIFICATION:PUBLIC:${RoleType.SALE_STAFF}`)
            .emit(
                emittedEvent.notification.RECEIVE_INVOICE_CREATE,
                dataResponse
            );
    };

    onAssignOrder = async (payload: AssignOrder) => {
        // chỉ gửi cho oper nhận task
        const foundOrder = await orderRepository.findOne({
            _id: payload.orderId,
        });
        if (!foundOrder) return;
        const newNotification = new NotificationModel({
            title: `New Order Is Assigned`,
            type: NotificationType.ASSIGN_ORDER,
            message: `You has been assigned to order ${foundOrder.orderCode}, click to see more detail`,
            allowedStaffs: [foundOrder.assignedStaff],
            metadata: {
                orderId: payload.orderId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        };
        MySocketServer.getIO()
            .to(`NOTIFICATION:PRIVATE:${foundOrder.assignedStaff}`)
            .emit(emittedEvent.notification.RECEIVE_ASSIGN_ORDER, dataResponse);
    };

    onAssignInvoice = async (payload: AssignInvoice) => {
        const foundInvoice = await invoiceRepository.findOne({
            _id: payload.invoiceId,
        });
        if (!foundInvoice) return;
        const newNotification = new NotificationModel({
            title: `New Delivery Invoice Is Assigned`,
            type: NotificationType.ASSIGN_INVOICE,
            message: `You has been assigned to invoice ${foundInvoice.invoiceCode} to handle delivery, click to see more detail`,
            allowedStaffs: [foundInvoice.staffHandleDelivery],
            metadata: {
                invoiceId: payload.invoiceId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        };
        MySocketServer.getIO()
            .to(`NOTIFICATION:PRIVATE:${foundInvoice.staffHandleDelivery}`)
            .emit(
                emittedEvent.notification.RECEIVE_ASSIGN_INVOICE,
                dataResponse
            );
    };

    onCompleteInvoice = async (payload: CompleteInvoice) => {
        const foundInvoice = await invoiceRepository.findOne({
            _id: payload.invoiceId,
        });
        if (!foundInvoice) return;
        if (!foundInvoice.managerOnboard) return;
        const newNotification = new NotificationModel({
            title: `New Invoice Is Completed`,
            type: NotificationType.COMPLETE_INVOICE,
            message: `Invoice ${foundInvoice.invoiceCode} has been completed and ready to assign to handle delivery, click to see more detail`,
            allowedStaffs: [foundInvoice.managerOnboard],
            metadata: {
                invoiceId: payload.invoiceId,
            },
        });
        await newNotification.save();
        const dataResponse = {
            newNotification: newNotification,
        };
        MySocketServer.getIO()
            .to(`NOTIFICATION:PRIVATE:${foundInvoice.managerOnboard}`)
            .emit(
                emittedEvent.notification.RECEIVE_COMPLETE_INVOICE,
                dataResponse
            );
    };
}
export const notificationHandler = new NotificationHandler();
