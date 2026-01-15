import { Router } from "express";
import categoryController from "../../controllers/admin/category.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody } from "../../middlewares/share/validator.middleware";
import { CreateCategorySchema } from "../../types/categories/categories";
const router = Router();

router.post('/', validateBody(CreateCategorySchema), authenticateMiddleware, categoryController.createCategory);

export default router;
