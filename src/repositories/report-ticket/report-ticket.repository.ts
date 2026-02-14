import { IReportTicketDocument, ReportTicketModel } from '../../models/report-tickets/report-tickets.model';
import { BaseRepository } from '../base.repository';

export class ReportTicketRepository extends BaseRepository<IReportTicketDocument> {
    constructor() {
        super(ReportTicketModel);
    }
}

export default new ReportTicketRepository();
