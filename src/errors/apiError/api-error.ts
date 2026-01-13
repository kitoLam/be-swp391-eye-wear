import { AppError } from '../../middlewares/error.middleware';

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(400, message);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(401, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found') {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(409, message);
    }
}
