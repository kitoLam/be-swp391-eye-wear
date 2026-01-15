import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { authenticateMiddleware, verifyRefreshTokenMiddleware } from "../../middlewares/admin/auth.middleware";
import { AttributeCreateSchema } from "../../types/attribute/attribute";
import attributeController from "../../controllers/admin/attribute.controller";
import { ObjectIdSchema } from "../common/objectId";
import { AttributeListQuerySchema } from "../../types/attribute/attribute.query";

const router = Router();
router.get('/', validateQuery(AttributeListQuerySchema), authenticateMiddleware, attributeController.getAttributeList);
router.get('/:id', validateParams(ObjectIdSchema), authenticateMiddleware, attributeController.getAttributeDetail);
router.patch('/:id', validateParams(ObjectIdSchema), validateBody(AttributeCreateSchema), authenticateMiddleware, attributeController.updateAttribute);
router.delete('/:id', validateParams(ObjectIdSchema), validateBody(AttributeCreateSchema), authenticateMiddleware, attributeController.deleteAttribute);
export default router;
