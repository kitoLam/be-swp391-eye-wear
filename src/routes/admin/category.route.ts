import { Router } from "express";
import categoryController from "../../controllers/admin/category.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams } from "../../middlewares/share/validator.middleware";
import { CreateCategorySchema, UpdateCategorySchema } from "../../types/categories/categories";
import { ObjectIdSchema } from "../../types/common/objectId";
const router = Router();

router.post('/', validateBody(CreateCategorySchema), authenticateMiddleware, categoryController.createCategory);
router.patch('/:id', validateParams(ObjectIdSchema), validateBody(UpdateCategorySchema), authenticateMiddleware, categoryController.updateCategory);
router.delete('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, categoryController.deleteCategory);
export default router;
