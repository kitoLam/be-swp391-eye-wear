import { Router } from "express";
import authController from "../../controllers/client/auth.controller";
import { RegisterCustomerSchema } from "../../types/auth/client/auth";
import { validateBody } from "../../middlewares/share/validator.middleware";

const router = Router();
router.post('/register', validateBody(RegisterCustomerSchema), authController.registerCustomerAccount);
export default router;
