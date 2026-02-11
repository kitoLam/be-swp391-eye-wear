import { Request, Response } from 'express';
import { SendProfileRequestDTO } from '../../types/profile-request/profile-request.request';
import profileRequestService from '../../services/admin/profile-request.service';
import { ApiResponse } from '../../utils/api-response';
import { GetProfileRequestListQuery } from '../../types/profile-request/profile-request.query';
import { formatDateToString } from '../../utils/formatter';
class ProfileRequestController {
    sendProfileUpdateRequest = async (req: Request, res: Response) => {
        const body = req.body as SendProfileRequestDTO;
        await profileRequestService.createProfileRequest(
            req.adminAccount!,
            body
        );
        res.json(ApiResponse.success('Send request success', null));
    };

    getProfileRequestList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as GetProfileRequestListQuery;
        const data = await profileRequestService.getProfileRequestList(query);
        const profileListFinal = data.profileRequestList.map(item => {
            return {
                staffId: item.staffId,
                name: item.name,
                email: item.email,
                phone: item.phone,
                status: item.status,
                createdAt: formatDateToString(item.createdAt),
                processedAt: item.processedAt
                    ? formatDateToString(item.processedAt)
                    : null,
                processedBy: item.processedBy,
            };
        });
        res.json(
            ApiResponse.success('Get profile request list success', {
                profileRequestList: profileListFinal,
                pagination: data.pagination,
            })
        );
    };

    getRequestDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const data = await profileRequestService.getRequestDetail(id);
        const dataFinal = {
            staffId: data.staffId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: data.status,
            createdAt: formatDateToString(data.createdAt),
            processedAt: data.processedAt
                ? formatDateToString(data.processedAt)
                : null,
            processedBy: data.processedBy,
        };
        res.json(
            ApiResponse.success('Get request detail success', {
                profileRequestDetail: dataFinal,
            })
        );
    };

    approveProfileRequest = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await profileRequestService.approveProfileRequest(
            req.adminAccount!,
            id
        );
        res.json(ApiResponse.success('Approve request success', null));
    };
    rejectProfileRequest = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await profileRequestService.rejectProfileRequest(req.adminAccount!, id);
        res.json(ApiResponse.success('Reject request success', null));
    };
    cancelProfileRequest = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await profileRequestService.cancelProfileRequest(req.adminAccount!, id);
        res.json(ApiResponse.success('Cancel request success', null));
    };
}

export default new ProfileRequestController();
