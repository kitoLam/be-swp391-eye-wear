import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import shipService from '../../services/common/ship.service';

class ShipController {
    getShipCodeByInvoiceId = async (req: Request, res: Response) => {
        const invoiceId = req.params.invoiceId as string;
        const data = await shipService.getShipCodeByInvoiceId(invoiceId);

        res.json(ApiResponse.success('Get ship code successfully', data));
    };
}

export default new ShipController();
