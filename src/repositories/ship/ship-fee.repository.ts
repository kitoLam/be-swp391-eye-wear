import { BaseRepository } from '../base.repository';
import {
    IShipFeeDocument,
    ShipFeeModel,
} from '../../models/ship/ship-fee.model.mongo';

export class ShipFeeRepository extends BaseRepository<IShipFeeDocument> {
    constructor() {
        super(ShipFeeModel);
    }

    async getGlobalActiveFee(): Promise<number | null> {
        const doc = await this.model.findOne({
            province: 'GLOBAL',
            district: null,
            ward: null,
            isActive: true,
        });

        if (!doc) return null;
        return doc.fee;
    }
}

export const shipFeeRepository = new ShipFeeRepository();
