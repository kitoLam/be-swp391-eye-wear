import {
    ImportProductModel,
    IImportProductDocument,
} from '../../models/import-product/import-product.model.mongo';
import { BaseRepository } from '../base.repository';

export class ImportProductRepository extends BaseRepository<IImportProductDocument> {
    constructor() {
        super(ImportProductModel);
    }
}

export const importProductRepository = new ImportProductRepository();
