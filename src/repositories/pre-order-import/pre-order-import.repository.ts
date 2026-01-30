import {
    PreOrderImportModel,
    IPreOrderImportDocument,
} from '../../models/pre-order-import/pre-order-import.model.mongo';
import { BaseRepository } from '../base.repository';

export class PreOrderImportRepository extends BaseRepository<IPreOrderImportDocument> {
    constructor() {
        super(PreOrderImportModel);
    }
}

export const preOrderImportRepository = new PreOrderImportRepository();
