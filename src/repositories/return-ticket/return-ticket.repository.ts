import {
    IReturnTicketDocument,
    ReturnTicketModel,
} from '../../models/return-ticket/return-ticket.model';
import { BaseRepository } from '../base.repository';

export class ReturnTicketRepository extends BaseRepository<IReturnTicketDocument> {
    constructor() {
        super(ReturnTicketModel);
    }

    /**
     * Find return tickets by order ID
     */
    async findByOrderId(orderId: string): Promise<IReturnTicketDocument[]> {
        return await this.model.find({
            orderId,
            deletedAt: null,
        });
    }

    /**
     * Find return tickets by customer ID
     */
    async findByCustomerId(
        customerId: string
    ): Promise<IReturnTicketDocument[]> {
        return await this.model.find({
            customerId,
            deletedAt: null,
        });
    }
}

export default new ReturnTicketRepository();
