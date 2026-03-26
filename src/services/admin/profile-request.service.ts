import { ProfileRequestStatus } from '../../config/enums/profile-request.enum';
import {
    ConflictRequestError,
    ForbiddenRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import profileRequestRepository from '../../repositories/profile-request/profile-request.repository';
import { AuthAdminContext } from '../../types/context/context';
import { GetProfileRequestListQuery } from '../../types/profile-request/profile-request.query';
import { SendProfileRequestDTO } from '../../types/profile-request/profile-request.request';

class ProfileRequestService {
    private ensureProfileDataAbleToUpdate = async (data: {
        staffId: string;
        email: string;
        phone: string;
    }) => {
        const { staffId, phone, email } = data;
        const foundStaffWithSamePhone = await adminAccountRepository.findOne({
            _id: {
                $ne: staffId,
            },
            phone: phone,
        });
        const foundStaffWithSameEmail = await adminAccountRepository.findOne({
            _id: {
                $ne: staffId,
            },
            email: email,
        });
        if (foundStaffWithSamePhone) {
            throw new ConflictRequestError(
                'Other staff has already use this phone number'
            );
        }
        if (foundStaffWithSameEmail) {
            throw new ConflictRequestError(
                'Other staff has already use this email'
            );
        }
    };

    createProfileRequest = async (
        adminContext: AuthAdminContext,
        payload: SendProfileRequestDTO
    ) => {
        await this.ensureProfileDataAbleToUpdate({
            email: payload.email,
            phone: payload.phone,
            staffId: adminContext.id,
        });
        const foundRequestStaff = (await profileRequestRepository.findOne(
            {
                staffId: adminContext.id,
                status: ProfileRequestStatus.PENDING,
            }
        ));
        if(foundRequestStaff){
            foundRequestStaff.name = payload.name;
            foundRequestStaff.phone = payload.phone;
            foundRequestStaff.email = payload.email;
            await foundRequestStaff.save();
        }
        else {
            // check mail exist
            await profileRequestRepository.create({
                staffId: adminContext.id,
                ...payload,
            });
        }
    };

    getProfileRequestList = async (query: GetProfileRequestListQuery) => {
        const pageData = await profileRequestRepository.findAll({
            limit: query.limit,
            page: query.page,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        const pagination = {
            page: pageData.page,
            limit: pageData.limit,
            total: pageData.total,
            totalPages: pageData.totalPages,
        };
        return {
            profileRequestList: pageData.data,
            pagination,
        };
    };

    approveProfileRequest = async (
        adminContext: AuthAdminContext,
        id: string
    ) => {
        const foundRequest = await profileRequestRepository.findOne({
            _id: id,
            status: ProfileRequestStatus.PENDING,
            deletedAt: null,
        });
        if (!foundRequest) {
            throw new NotFoundRequestError('Request not found');
        }
        // ensure status is still pending
        if (foundRequest.status != ProfileRequestStatus.PENDING) {
            throw new ConflictRequestError(
                'Request status must be in pending status'
            );
        }

        // re-confirm updated info is valid
        await this.ensureProfileDataAbleToUpdate({
            email: foundRequest.email,
            phone: foundRequest.phone,
            staffId: foundRequest.staffId.toString(),
        });
        // mutate admin account info in db
        await adminAccountRepository.update(foundRequest.staffId, {
          name: foundRequest.name,
          email: foundRequest.email,
          phone: foundRequest.phone
        });
        foundRequest.status = ProfileRequestStatus.APPROVED;
        foundRequest.processedAt = new Date();
        foundRequest.processedBy = adminContext.id;
        await foundRequest.save();

        // Return updated data
        return foundRequest;
    };
    rejectProfileRequest = async (
        adminContext: AuthAdminContext,
        id: string
    ) => {
        const foundRequest = await profileRequestRepository.findOne({
            _id: id,
            status: ProfileRequestStatus.PENDING,
            deletedAt: null,
        });
        if (!foundRequest) {
            throw new NotFoundRequestError('Request not found');
        }
        foundRequest.status = ProfileRequestStatus.REJECTED;
        foundRequest.processedAt = new Date();
        foundRequest.processedBy = adminContext.id;
        await foundRequest.save();

        // Return updated data
        return foundRequest;
    };

    cancelProfileRequest = async (
        adminContext: AuthAdminContext
    ) => {
        // chỉ cho cancel request đg pending và đúng staff hiên tại
        const foundRequest = await profileRequestRepository.findOne({
            staffId: adminContext.id,
            status: ProfileRequestStatus.PENDING,
            deletedAt: null,
        });
        if (!foundRequest) {
            throw new NotFoundRequestError('You have not sent any request');
        }
        foundRequest.status = ProfileRequestStatus.CANCELLED;
        await foundRequest.save();

        // Return updated data
        return foundRequest;
    };

    getRequestDetail = async (id: string) => {
      const foundRequest = await profileRequestRepository.findById(id);
      if(!foundRequest){
        throw new NotFoundRequestError("Profile request not found");
      }
      return foundRequest;
    }
}

export default new ProfileRequestService();
