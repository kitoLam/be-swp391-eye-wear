import { Request, Response } from 'express';
import returnTicketService from '../../services/return-ticket/return-ticket.service';
import { ApiResponse } from '../../utils/api-response';
import { formatDateToString } from '../../utils/formatter';
import {
    CreateReturnTicketRequest,
    ReturnTicketListQuery,
} from '../../types/return-ticket/return-ticket.request';
import { ReturnTicketStatus } from '../../config/enums/return-ticket.enum';

class ReturnTicketController {
    /**
     * Client: Create return ticket
     */
    createReturnTicket = async (req: Request, res: Response) => {
        const body = req.body as CreateReturnTicketRequest;
        const newTicket = await returnTicketService.createReturnTicket(
            req.customer!,
            body
        );
        res.json(
            ApiResponse.success(
                'Create return ticket successfully',
                this.mapResponse(newTicket)
            )
        );
    };

    /**
     * Client: Get list of own return tickets
     */
    getClientReturnTicketList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReturnTicketListQuery;
        const result = await returnTicketService.getReturnTicketList(
            query,
            req.customer!
        );
        res.json(
            ApiResponse.success('Get return ticket list successfully', {
                pagination: result.pagination,
                returnTicketList: result.returnTicketList.map(item =>
                    this.mapResponse(item)
                ),
            })
        );
    };

    /**
     * Staff: Get all return tickets
     */
    getStaffReturnTicketList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReturnTicketListQuery;
        const result = await returnTicketService.getReturnTicketList(query);
        res.json(
            ApiResponse.success('Get staff return ticket list successfully', {
                pagination: result.pagination,
                returnTicketList: result.returnTicketList.map(item =>
                    this.mapResponse(item)
                ),
            })
        );
    };

    /**
     * Staff: Get list of return tickets verified by themselves
     */
    getReturnTicketsByStaff = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReturnTicketListQuery;
        query.staffVerify = req.adminAccount!.id;
        const result = await returnTicketService.getReturnTicketList(query);
        res.json(
            ApiResponse.success('Get return tickets by staff successfully', {
                pagination: result.pagination,
                returnTicketList: result.returnTicketList.map(item =>
                    this.mapResponse(item)
                ),
            })
        );
    };

    getReturnedOrders = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReturnTicketListQuery;
        const result = await returnTicketService.getReturnedOrders(query);

        res.json(
            ApiResponse.success('Get returned orders successfully', {
                pagination: result.pagination,
                returnedOrders: result.returnedOrders.map(item => ({
                    returnTicket: this.mapResponse(item.returnTicket),
                    order: item.order,
                })),
            })
        );
    };

    approveReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.APPROVED,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Approve return ticket successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    rejectReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.REJECTED,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Reject return ticket successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    processReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.IN_PROGRESS,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Process return ticket successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    cancelReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.CANCEL,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Cancel return ticket successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    deliveringReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.DELIVERING,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Update status to delivering successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    returnedReturnTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStatus(
            id,
            ReturnTicketStatus.RETURNED,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Update status to returned successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    updateStaffVerify = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedTicket = await returnTicketService.updateStaffVerify(
            id,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success(
                'Update staff verify successfully',
                this.mapResponse(updatedTicket)
            )
        );
    };

    private mapResponse = (item: any) => {
        return {
            id: item.id,
            orderId: item.orderId,
            customerId: item.customerId,
            reason: item.reason,
            description: item.description,
            media: item.media,
            skus: item.skus ?? null,
            money: item.money,
            staffVerify: item.staffVerify,
            status: item.status,
            createdAt: formatDateToString(item.createdAt),
            updatedAt: formatDateToString(item.updatedAt),
        };
    };
}

export default new ReturnTicketController();
