import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import orderController from '../../controllers/admin/order.controller';

const router = Router();

router.use(authenticateMiddleware);

// api lấy danh sách order theo staffId và admin đang đăng nhập
router.get('/', orderController.getOrdersByStaff);

export default router;
