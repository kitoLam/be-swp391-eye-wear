import { Router } from "express";

const router = Router();

// api lấy danh sách hóa đơn
router.get('/');
//api thay đổi phần verify status của đơn (nếu đã reject rồi thì không đổi lại thành cái khác đc)
// phần quyền chỉ sale làm đc
router.patch('/:id/verify-status/:status');


export default router;