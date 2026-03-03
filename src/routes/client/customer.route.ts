import { Router } from 'express';
import customerController from '../../controllers/client/customer.controller';
import { authenticateMiddlewareClient as authMiddleware } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { AddCustomerAddressSchema, AddCustomerPrescriptionSchema, UpdateCustomerAddressSchema, UpdateCustomerPrescriptionSchema } from '../../types/customer/customer.request';

const router = Router();

router.get('/', authMiddleware, customerController.getCustomerProfile);
router.patch('/profile', authMiddleware, customerController.updateCustomerProfile);

// Address routes
router.post('/profile/address', authMiddleware, validateBody(AddCustomerAddressSchema), customerController.addCustomerAddress);
router.get('/profile/address', authMiddleware, customerController.getCustomerAddresses);
router.get('/profile/address/default', authMiddleware, customerController.getCustomerAddressDefault);
router.patch('/profile/address/:id', authMiddleware, validateBody(UpdateCustomerAddressSchema), customerController.updateCustomerAddress);
router.patch('/profile/address/change-default/:id', authMiddleware, customerController.resetAddressDefault);
router.delete('/profile/address/:id', authMiddleware, customerController.removeCustomerAddress);

// Prescription routes
router.post('/profile/prescription', authMiddleware, validateBody(AddCustomerPrescriptionSchema), customerController.addCustomerPrescription);
router.get('/profile/prescription', authMiddleware, customerController.getCustomerPrescriptions);
router.get('/profile/prescription/default', authMiddleware, customerController.getCustomerPrescriptionDefault);
router.patch('/profile/prescription/:id', authMiddleware, validateBody(UpdateCustomerPrescriptionSchema), customerController.updateCustomerPrescription);
router.patch('/profile/prescription/change-default/:id', authMiddleware, customerController.resetPrescriptionDefault);
router.delete('/profile/prescription/:id', authMiddleware, customerController.removeCustomerPrescription);

export default router;
