import { NextFunction, Request, Response } from 'express';
import { ForbiddenRequestError } from '../../errors/apiError/api-error';
import { RoleType } from '../../config/enums/admin-account';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';

export const requireAdminRoles = (allowedRoles: RoleType[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const context = req.adminAccount;
            if (!context?.id) {
                throw new ForbiddenRequestError();
            }

            const adminAccount = await adminAccountRepository.findById(
                context.id
            );
            if (!adminAccount || adminAccount.deletedAt) {
                throw new ForbiddenRequestError();
            }

            if (!allowedRoles.includes(adminAccount.role as RoleType)) {
                throw new ForbiddenRequestError();
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
