import { Router } from "express";
import categoryController from "../../controllers/admin/category.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { CreateCategorySchema, UpdateCategorySchema } from "../../types/category/category.dto";
import { ObjectIdSchema } from "../../types/common/objectId";
import { CategoryListQuerySchema } from "../../types/category/category.query";
const router = Router();

router.get('/', authenticateMiddleware, validateQuery(CategoryListQuerySchema), categoryController.getCategories);
router.get('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, categoryController.getCategoryDetail);
router.post('/', validateBody(CreateCategorySchema), authenticateMiddleware, categoryController.createCategory);
router.patch('/:id', validateParams(ObjectIdSchema), validateBody(UpdateCategorySchema), authenticateMiddleware, categoryController.updateCategory);
router.delete('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, categoryController.deleteCategory);
export default router;
