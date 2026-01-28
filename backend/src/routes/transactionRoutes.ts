import { Router } from 'express';
import { getFinancialReport, createTransaction, exportFinancialPDF } from '../controllers/transactionController';

const router = Router();

// GET ดูรายงานการเงิน + ส่วนแบ่งหุ้น
router.get('/', getFinancialReport);

// POST เพิ่มรายการรายรับ/รายจ่าย (Manual)
router.post('/', createTransaction);

// GET ดาวน์โหลด PDF
router.get('/export-pdf', exportFinancialPDF);

export default router;