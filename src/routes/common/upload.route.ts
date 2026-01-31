import { Router } from "express";
import uploadController from "../../controllers/common/upload.controller";
import { getUploadMiddleware } from "../../utils/upload.util";
const upload = getUploadMiddleware();
const router = Router();
router.post('/single', upload.single('file'), uploadController.uploadSingle);
router.post('/many', upload.array('files', 50), uploadController.uploadMany);
export default router;