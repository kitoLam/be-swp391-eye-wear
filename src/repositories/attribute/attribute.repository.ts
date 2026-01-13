import {
    AttributeModel,
    IAttributeDocument,
} from '../../models/attribute/attribute.model';
import { BaseRepository } from '../base.repository';

export class AttributeRepository extends BaseRepository<IAttributeDocument> {
    constructor() {
        super(AttributeModel);
    }
}

export const attributeRepository = new AttributeRepository();
