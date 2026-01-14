import { Router } from "express";
import { validateBody } from "../../middlewares/share/validator.middleware";
import LoginBodySchema from "../../types/auth/admin/auth";
import authController from "../../controllers/admin/auth.controller";

const router = Router();

router.post('/login', validateBody(LoginBodySchema), authController.login);
// router.post('/refresh-token');
export default router;
