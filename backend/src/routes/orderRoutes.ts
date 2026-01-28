import { Router } from 'express';
import { 
    createOrder, 
    getOrders, 
    getOrderById, 
    updateOrderStatus 
} from '../controllers/orderController';

const router = Router();

// สร้างออเดอร์
router.post('/', createOrder);

// ดูประวัติทั้งหมด
router.get('/', getOrders);

// (ใหม่) ดูออเดอร์ตาม ID
router.get('/:id', getOrderById);

// (ใหม่) แก้ไขสถานะออเดอร์
router.put('/:id/status', updateOrderStatus);

export default router;