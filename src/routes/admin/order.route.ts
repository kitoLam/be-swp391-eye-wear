import { Router } from "express";

const router = Router();

// api lấy danh sách order
router.get('/');
// api giao việc
router.patch('/:id/assign-staff');


export default router;