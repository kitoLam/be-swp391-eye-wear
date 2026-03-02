import { BaseRepository } from '../base.repository';
import { IShipDocument, ShipModel } from '../../models/ship/ship.model.mongo';

export class ShipRepository extends BaseRepository<IShipDocument> {
    constructor() {
        super(ShipModel);
    }

    async findByInvoiceId(invoiceId: string): Promise<IShipDocument | null> {
        return await this.findOne({ invoiceId });
    }
}

export const shipRepository = new ShipRepository();
