// server/routes/transactionRoutes.ts

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getFinancialReport, 
  createTransaction, 
  exportFinancialPDF, 
  syncAllData 
} from '../controllers/transactionController';

const router = express.Router();

// ==========================================
// 📂 1. ตั้งค่า Multer (ที่เก็บไฟล์)
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // กำหนดโฟลเดอร์ปลายทาง: public/uploads/slips
    // (ต้องสร้างโฟลเดอร์นี้รอไว้ด้วย หรือใช้ fs.mkdirSync แบบด้านล่าง)
    const dir = path.join(__dirname, '../../uploads/slips');
    
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ใหม่: slip-timestamp-random.jpg (กันชื่อซ้ำ)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `slip-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage: storage });

// ==========================================
// 🛣️ 2. เชื่อม Route เข้ากับ Controller
// ==========================================

// GET: ดึงรายการ (Dashboard & Table)
router.get('/', getFinancialReport);

// POST: สร้างรายการใหม่ + อัปโหลดรูป 📸
router.post('/', upload.single('image'), createTransaction);

// GET: Export PDF
router.get('/export-pdf', exportFinancialPDF);

// POST: Fix Data
router.post('/fix-data', syncAllData);

export default router;