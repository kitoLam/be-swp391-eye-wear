import { FilterQuery } from "mongoose";
import { IReportTicketDocument, ReportTicketModel } from "../../models/report-tickets/report-tickets.model";
import { AuthAdminContext } from "../../types/context/context";
import { ReportTicketListQuery } from "../../types/report-ticket/report-ticket.query";
import { CreateReportTicketRequest } from "../../types/report-ticket/report-ticket.request";
import reportTicketRepository from "../../repositories/report-ticket/report-ticket.repository";
import { ConflictRequestError, NotFoundRequestError } from "../../errors/apiError/api-error";
import { ReportTicketStatus } from "../../config/enums/report-ticket.enum";

class ReportTicketService {
  createReportTicket = async (adminContext: AuthAdminContext, requestBody: CreateReportTicketRequest) => {
    const reportTicket = new ReportTicketModel({
      title: requestBody.title,
      description: requestBody.description,
      priorityLevel: requestBody.priorityLevel,
      imageUrl: requestBody.imageUrl,
      processedBy: null,
      createdBy: adminContext.id,
    });
    return reportTicket.save();
  }
  
  getReportTicketList = async (query: ReportTicketListQuery, adminContext?: AuthAdminContext) => {
    const filter: FilterQuery<IReportTicketDocument> = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'gi');
      filter.$or = [{ title: regex }, { description: regex }];
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priorityLevel) {
      filter.priorityLevel = query.priorityLevel;
    }
    if(query.processedBy){
      filter.processedBy = query.processedBy
    }
    if (adminContext) {
      filter.createdBy = adminContext.id;
    }
    const result = await reportTicketRepository.find(filter, {
      limit: query.limit,
      page: query.page,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return {
      reportTicketList: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  processReportTicket = async (id: string, adminContext: AuthAdminContext) => {
    const reportTicket = await ReportTicketModel.findById(id);
    if(!reportTicket) throw new NotFoundRequestError('Report ticket not found');
    if(reportTicket.status == ReportTicketStatus.PENDING){
      throw new ConflictRequestError("Only process report ticket in PENDING status");
    }
    reportTicket.status = ReportTicketStatus.PROCESSING;
    reportTicket.processedBy = adminContext.id;
    return reportTicket.save();
  }

  rejectReportTicket = async (id: string, adminContext: AuthAdminContext) => {
    const reportTicket = await ReportTicketModel.findById(id);
    if(!reportTicket) throw new NotFoundRequestError('Report ticket not found');
    if(reportTicket.status == ReportTicketStatus.PENDING){
      throw new ConflictRequestError("Only reject report ticket in PENDING status");
    }
    reportTicket.processedBy = adminContext.id;
    reportTicket.status = ReportTicketStatus.REJECTED;
    return reportTicket.save();
  }

  resolveReportTicket = async (id: string, adminContext: AuthAdminContext) => {
    const reportTicket = await ReportTicketModel.findById(id);
    if(!reportTicket) throw new NotFoundRequestError('Report ticket not found');
    if(reportTicket.status == ReportTicketStatus.PENDING){
      throw new ConflictRequestError("Only resolve report ticket in PENDING status");
    }
    if(reportTicket.processedBy != adminContext.id){
      throw new ConflictRequestError("Only manager is processing this report ticket can resolve it");
    }
    reportTicket.status = ReportTicketStatus.RESOLVED;
    return reportTicket.save();
  }

  getTicketDetail = async (id: string) => {
    const reportTicket = await ReportTicketModel.findById(id);
    if(!reportTicket) throw new NotFoundRequestError('Report ticket not found');
    return reportTicket;
  }
}

export default new ReportTicketService();