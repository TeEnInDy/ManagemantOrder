import { Router } from 'express';
import { getStocks, createStock, deleteStock } from '../controllers/stockController';

const router = Router();

// GET /api/stocks -> ดูภาพรวม
router.get('/', getStocks);

// POST /api/stocks -> เพิ่มของเข้าสต็อก
router.post('/', createStock);

// DELETE /api/stocks/:id -> ลบรายการ
router.delete('/:id', deleteStock);

export default router;