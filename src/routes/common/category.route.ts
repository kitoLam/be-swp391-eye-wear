import { Router } from "express";
import categoryController from "../../controllers/client/category.controller";

const router = Router();

router.get('/tree',  categoryController.getTreeCategories);
router.get('/tree/:id',  categoryController.getTreeCategories);
export default router;