import { Router } from 'express';
import { 
    getFinancialReport, 
    createTransaction, 
    exportFinancialPDF, 
    syncAllData // 👈 นำเข้าฟังก์ชัน sync
} from '../controllers/transactionController'; // 👈 import จากชื่อไฟล์ที่ถูกต้อง

const router = Router();

// GET ดูรายงานการเงิน + ส่วนแบ่งหุ้น
router.get('/', getFinancialReport);

// POST เพิ่มรายการรายรับ/รายจ่าย (Manual)
router.post('/', createTransaction);

// GET ดาวน์โหลด PDF
router.get('/export-pdf', exportFinancialPDF);

// 🔥 POST ซ่อมข้อมูล (Fix Data) - ต้องมีเส้นนี้ครับ
router.post('/fix-data', syncAllData);

export default router;