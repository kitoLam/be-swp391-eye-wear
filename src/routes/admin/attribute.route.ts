import { Router } from "express";
import { validateBody, validateParams } from "../../middlewares/share/validator.middleware";
import { authenticateMiddleware, verifyRefreshTokenMiddleware } from "../../middlewares/admin/auth.middleware";
import { AttributeCreateSchema } from "../../types/attribute/attribute";
import attributeController from "../../controllers/admin/attribute.controller";
import { ObjectIdSchema } from "../common/objectId";

const router = Router();
router.get('/', authenticateMiddleware, attributeController.getAttributeList);
router.get('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, attributeController.getAttributeDetail);
router.patch('/:id', validateParams(ObjectIdSchema), validateBody(AttributeCreateSchema), authenticateMiddleware, attributeController.updateAttribute);
router.delete('/:id', validateParams(ObjectIdSchema), validateBody(AttributeCreateSchema), authenticateMiddleware, attributeController.deleteAttribute);
export default router;
