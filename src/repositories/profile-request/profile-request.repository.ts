import { Types } from 'mongoose';
import { BaseRepository } from '../base.repository';
import { IProfileRequestDocument, ProfileRequestModel } from '../../models/profile-request/profile-request.model';

export class ProfileRequestRepository extends BaseRepository<IProfileRequestDocument> {
    constructor() {
        super(ProfileRequestModel);
    }
}

export default new ProfileRequestRepository();
