import { Router } from 'express';
import { 
    getStocks, 
    createStockInit, // ใช้ฟังก์ชันนี้สำหรับสร้างสินค้าใหม่ (แทน createStock เดิม)
    deleteStock,
    restockItem,     // 🆕 เติมของ
    useStockItem,    // 🆕 ตัดสต็อก
    getStockHistory  // 🆕 ดูประวัติ
} from '../controllers/stockController';

const router = Router();

// 🟢 1. ดูภาพรวมสต็อก (GET)
// URL: http://localhost:4000/api/stocks
router.get('/', getStocks);

// 🟢 2. เพิ่มสินค้าใหม่ (POST) - ใช้ฟังก์ชัน createStockInit เพื่อคำนวณต้นทุนแรกเข้า
// URL: http://localhost:4000/api/stocks
router.post('/', createStockInit);

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