import { Router } from 'express';
import customerController from '../../controllers/client/customer.controller';
import { authenticateMiddlewareClient as authMiddleware } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { AddCustomerAddressSchema, AddCustomerPrescriptionSchema } from '../../types/customer/customer.request';

const router = Router();

router.get('/', authMiddleware, customerController.getCustomerProfile);
router.patch('/profile', authMiddleware, customerController.updateCustomerProfile);
router.post('/profile/address', authMiddleware, validateBody(AddCustomerAddressSchema), customerController.addCustomerAddress);
router.get('/profile/address', authMiddleware, customerController.getCustomerAddresses);
router.get('/profile/address/default', authMiddleware, customerController.getCustomerAddressDefault);
router.patch('/profile/address/change-default/:id', authMiddleware, customerController.resetAddressDefault);

router.post('/profile/prescription', authMiddleware, validateBody(AddCustomerPrescriptionSchema), customerController.addCustomerPrescription);
// router.patch('/profile/address/:id', customerController.updateCustomerPrescription);
// router.patch('/profile/prescription/:id', customerController.updateCustomerPrescription);
export default router;
