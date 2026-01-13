import {
    CategoryModel,
    ICategoryDocument,
} from '../../models/categories/categories.model.mongo';
import { BaseRepository } from '../base.repository';

export class CategoryRepository extends BaseRepository<ICategoryDocument> {
    constructor() {
        super(CategoryModel);
    }
}

export const categoryRepository = new CategoryRepository();
