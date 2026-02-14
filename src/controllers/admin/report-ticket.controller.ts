import { Request, Response } from 'express';
import { CreateReportTicketRequest } from '../../types/report-ticket/report-ticket.request';
import reportTicketService from '../../services/admin/report-ticket.service';
import { ApiResponse } from '../../utils/api-response';
import { formatDateToString } from '../../utils/formatter';
import { ReportTicketListQuery } from '../../types/report-ticket/report-ticket.query';
class ReportTicketController {
    createReportTicket = async (req: Request, res: Response) => {
        const body = req.body as CreateReportTicketRequest;
        const newReport = await reportTicketService.createReportTicket(
            req.adminAccount!,
            body
        );
        res.json(
            ApiResponse.success('Create report ticket successfully', {
                reportTicket: {
                    id: newReport.id,
                    title: newReport.title,
                    description: newReport.description,
                    priorityLevel: newReport.priorityLevel,
                    imageUrl: newReport.imageUrl,
                    status: newReport.status,
                    processedBy: newReport.processedBy,
                    createdBy: newReport.createdBy,
                    createdAt: formatDateToString(newReport.createdAt),
                },
            })
        );
    };

    getReportTicketList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReportTicketListQuery;
        const result = await reportTicketService.getReportTicketList(query);
        res.json(
            ApiResponse.success('Get report ticket list successfully', {
                pagination: result.pagination,
                reportTicketList: result.reportTicketList.map(item => {
                    return {
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        priorityLevel: item.priorityLevel,
                        imageUrl: item.imageUrl,
                        status: item.status,
                        processedBy: item.processedBy,
                        createdBy: item.createdBy,
                        createdAt: formatDateToString(item.createdAt),
                    };
                }),
            })
        );
    };

    getReportTicketHistoryListOfStaff = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ReportTicketListQuery;
        const result = await reportTicketService.getReportTicketList(
            query,
            req.adminAccount!
        );
        res.json(
            ApiResponse.success('Get report ticket history list successfully', {
                pagination: result.pagination,
                reportTicketList: result.reportTicketList.map(item => {
                    return {
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        priorityLevel: item.priorityLevel,
                        imageUrl: item.imageUrl,
                        status: item.status,
                        processedBy: item.processedBy,
                        createdBy: item.createdBy,
                        createdAt: formatDateToString(item.createdAt),
                    };
                }),
            })
        );
    };

    rejectReportTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedReportTicket =
            await reportTicketService.rejectReportTicket(id, req.adminAccount!);
        res.json(
            ApiResponse.success('Reject report ticket successfully', {
                updatedReportTicket: {
                    id: updatedReportTicket.id,
                    title: updatedReportTicket.title,
                    description: updatedReportTicket.description,
                    priorityLevel: updatedReportTicket.priorityLevel,
                    imageUrl: updatedReportTicket.imageUrl,
                    status: updatedReportTicket.status,
                    processedBy: updatedReportTicket.processedBy,
                    createdBy: updatedReportTicket.createdBy,
                    createdAt: formatDateToString(
                        updatedReportTicket.createdAt
                    ),
                },
            })
        );
    };

    processReportTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedReportTicket =
            await reportTicketService.processReportTicket(
                id,
                req.adminAccount!
            );
        res.json(
            ApiResponse.success('Process report ticket successfully', {
                updatedReportTicket: {
                    id: updatedReportTicket.id,
                    title: updatedReportTicket.title,
                    description: updatedReportTicket.description,
                    priorityLevel: updatedReportTicket.priorityLevel,
                    imageUrl: updatedReportTicket.imageUrl,
                    status: updatedReportTicket.status,
                    processedBy: updatedReportTicket.processedBy,
                    createdBy: updatedReportTicket.createdBy,
                    createdAt: formatDateToString(
                        updatedReportTicket.createdAt
                    ),
                },
            })
        );
    };

    resolveReportTicket = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedReportTicket =
            await reportTicketService.resolveReportTicket(
                id,
                req.adminAccount!
            );
        res.json(
            ApiResponse.success('Resolve report ticket successfully', {
                updatedReportTicket: {
                    id: updatedReportTicket.id,
                    title: updatedReportTicket.title,
                    description: updatedReportTicket.description,
                    priorityLevel: updatedReportTicket.priorityLevel,
                    imageUrl: updatedReportTicket.imageUrl,
                    status: updatedReportTicket.status,
                    processedBy: updatedReportTicket.processedBy,
                    createdBy: updatedReportTicket.createdBy,
                    createdAt: formatDateToString(
                        updatedReportTicket.createdAt
                    ),
                },
            })
        );
    };

    getReportTicketDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const reportTicketDetail =
            await reportTicketService.getTicketDetail(id);
        res.json(
            ApiResponse.success('Get report ticket detail successfully', {
                reportTicketDetail: {
                    id: reportTicketDetail.id,
                    title: reportTicketDetail.title,
                    description: reportTicketDetail.description,
                    priorityLevel: reportTicketDetail.priorityLevel,
                    imageUrl: reportTicketDetail.imageUrl,
                    status: reportTicketDetail.status,
                    processedBy: reportTicketDetail.processedBy,
                    createdBy: reportTicketDetail.createdBy,
                    createdAt: formatDateToString(reportTicketDetail.createdAt),
                },
            })
        );
    }
}
export default new ReportTicketController();
