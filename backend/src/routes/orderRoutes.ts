// backend/src/routes/orderRoutes.ts

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    createOrder, 
    getOrders, 
    getOrderById, 
    updateOrderStatus,
    syncTransactions,
    uploadSlip // 👈 เพิ่ม function นี้
} from '../controllers/orderController';

const router = Router();

// --- 🛠️ ตั้งค่า Multer สำหรับสลิป ---
const slipUploadDir = path.join(__dirname, '../../Asset/uploads/slips');

// สร้างโฟลเดอร์ slips ถ้ายังไม่มี
if (!fs.existsSync(slipUploadDir)){
    fs.mkdirSync(slipUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, slipUploadDir);
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์: slip-{orderID}-{เวลา}.jpg (ป้องกันซ้ำ)
        // หมายเหตุ: req.params.id อาจจะยังไม่มาในขั้นตอนนี้ ถ้าใช้ router.post('/:id/slip')
        // ดังนั้นใช้ Date.now() + random ก็พอ
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 🛣️ Routes ---

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/sync-transactions', syncTransactions);

// 🟢 (ใหม่) Route อัปโหลดสลิป
// URL: POST /api/orders/:id/upload-slip
router.post('/:id/upload-slip', upload.single('slip'), uploadSlip);

export default router;