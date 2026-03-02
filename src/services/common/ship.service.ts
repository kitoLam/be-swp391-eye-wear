import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { shipRepository } from '../../repositories/ship/ship.repository';

class ShipService {
    getShipCodeByInvoiceId = async (invoiceId: string) => {
        const ship = await shipRepository.findByInvoiceId(invoiceId);

        if (!ship) {
            throw new NotFoundRequestError('Ship not found for this invoice');
        }

        return {
            shipCode: ship._id,
        };
    };
}

export default new ShipService();
