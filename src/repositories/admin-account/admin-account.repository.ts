import {
    AttributeModel,
    IAdminAccountDocument,
} from '../../models/admin-account/admin-account.model.mongo';
import { BaseRepository } from '../base.repository';

export class AdminAccountRepository extends BaseRepository<IAdminAccountDocument> {
    constructor() {
        super(AttributeModel);
    }
}

export const adminAccountRepository = new AdminAccountRepository();
