import { Router } from "express";
import categoryController from "../../controllers/admin/category.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams } from "../../middlewares/share/validator.middleware";
import { CreateCategorySchema, UpdateCategorySchema } from "../../types/category/category.dto";
import { ObjectIdSchema } from "../../types/common/objectId";
import { getUploadMiddleware } from "../../utils/upload.util";
const upload = getUploadMiddleware();
const router = Router();

router.post('/', upload.single('thumbnail'), validateBody(CreateCategorySchema), authenticateMiddleware, categoryController.createCategory);
router.patch('/:id', upload.single('thumbnail'), validateParams(ObjectIdSchema), validateBody(UpdateCategorySchema), authenticateMiddleware, categoryController.updateCategory);
router.delete('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, categoryController.deleteCategory);
export default router;
