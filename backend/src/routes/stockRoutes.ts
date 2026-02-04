import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    getStocks, 
    createStockInit, 
    deleteStock,
    restockItem,     
    useStockItem,    
    getStockHistory  
} from '../controllers/stockController';



const router = Router();

/// ==========================================
// 🛠️ ตั้งค่า Multer
// ==========================================
// ใช้โฟลเดอร์เดียวกับ Order/Transaction เพื่อให้เป็นระเบียบ
const slipUploadDir = path.join(__dirname, '../../uploads/slips');

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(slipUploadDir)){
    fs.mkdirSync(slipUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, slipUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 🟢 1. ดูภาพรวมสต็อก (GET)
// URL: http://localhost:4000/api/stocks
router.get('/', getStocks);

// 🟢 2. เพิ่มสินค้าใหม่ (POST) - ใช้ฟังก์ชัน createStockInit เพื่อคำนวณต้นทุนแรกเข้า
// URL: http://localhost:4000/api/stocks
router.post('/', upload.single('slip'), createStockInit);
router.post('/restock-init', upload.single('slip'), createStockInit);

// 🟢 2.1 Route สำรองสำหรับ Script หรือ Curl (POST) - ทำงานเหมือนข้างบน
// URL: http://localhost:4000/api/stocks/restock-init
router.post('/restock-init', createStockInit);

// 🟢 3. ลบรายการสต็อก (DELETE)
// URL: http://localhost:4000/api/stocks/:id
router.delete('/:id', deleteStock);

// 🔵 4. เติมของเพิ่ม (Restock) (POST)
// URL: http://localhost:4000/api/stocks/:id/restock
router.post('/:id/restock', restockItem);

// 🟠 5. ตัดสต็อก / เบิกใช้ (Cut Stock) (POST)
// URL: http://localhost:4000/api/stocks/:id/use
router.post('/:id/use', useStockItem);

// 🟣 6. ดูประวัติ Log (History) (GET)
// URL: http://localhost:4000/api/stocks/:id/history
router.get('/:id/history', getStockHistory);

export default router;