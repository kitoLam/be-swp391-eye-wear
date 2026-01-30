import { Model, Document, FilterQuery, SortOrder, UpdateQuery, Types } from 'mongoose';

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class BaseRepository<T extends Document> {
    constructor(protected model: Model<T>) {}

    /**
     * Reusable pagination helper for all find operations
     */
    protected async findWithPagination(
        filter: FilterQuery<T>,
        options: PaginationOptions = {}
    ): Promise<PaginatedResult<T>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const sortObj = { [sortBy]: sortOrder };

        // Add deletedAt filter by default
        const finalFilter = { ...filter, deletedAt: null } as FilterQuery<T>;

        const [data, total] = await Promise.all([
            this.model.find(finalFilter).skip(skip).limit(limit).sort(sortObj),
            this.model.countDocuments(finalFilter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * Find by ID
     */
    async findById(id: string): Promise<T | null> {
        return await this.model.findById(id);
    }

    /**
     * Find one by filter
     */
    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        return await this.model.findOne({
            ...filter,
            deletedAt: null,
        } as FilterQuery<T>);
    }

    /**
     * Generic find with Partial filter and pagination
     * Usage: find({ email: 'test@example.com' }, { page: 1, limit: 10 })
     */
    async find(
        filter: FilterQuery<T>,
        options: PaginationOptions = {}
    ): Promise<PaginatedResult<T>> {
        return await this.findWithPagination(filter as FilterQuery<T>, options);
    }

    /**
     * Find all with pagination
     */
    async findAll(
        options: PaginationOptions = {}
    ): Promise<PaginatedResult<T>> {
        return await this.findWithPagination({} as FilterQuery<T>, options);
    }

    /**
     * Find all with pagination
     */
    async findAllNoPagination(
        filter: FilterQuery<T>,
    ): Promise<T[]> {
        return await this.model.find(filter);
    }

    /**
     * Create
     */
    async create(data: Partial<T>): Promise<T> {
        return await this.model.create(data);
    }

    /**
     * Update by ID
     */
    async update(id: string | Types.ObjectId, data: Partial<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    async updateMany(filter: FilterQuery<T>, data: Partial<T>) {
        await this.model.updateMany(filter, data);
    }
    /**
     * Update by ID
     */
    async updateByFilter(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
        return await this.model.findOneAndUpdate(filter, data, {
            new: true,
            runValidators: true,
        });
    }

    /**
     * Soft delete
     */
    async delete(id: string): Promise<T | null> {
        return await this.model.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );
    }

    /**
     * Hard delete
     */
    async hardDelete(id: string): Promise<T | null> {
        return await this.model.findByIdAndDelete(id);
    }

    /**
     * Count documents
     */
    async count(filter: FilterQuery<T> = {}): Promise<number> {
        return await this.model.countDocuments({
            ...filter,
            deletedAt: null,
        } as FilterQuery<T>);
    }

    /**
     * Check if exists
     */
    async exists(filter: FilterQuery<T>): Promise<boolean> {
        const count = await this.model.countDocuments({
            ...filter,
            deletedAt: null,
        } as FilterQuery<T>);
        return count > 0;
    }

    async insertMany(data: Partial<T>[]) {
        return await this.model.insertMany(data);
    }
}
