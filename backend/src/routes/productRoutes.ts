import { Router } from 'express';
import { 
    getProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    seedProducts 
} from '../controllers/productController';

const router = Router();

// GET /api/products -> ดึงสินค้า
router.get('/', getProducts);

// POST /api/products -> เพิ่มสินค้าใหม่ (🆕)
router.post('/', createProduct);

// PUT /api/products/:id -> แก้ไขสินค้าตาม ID (🆕)
router.put('/:id', updateProduct);

// DELETE /api/products/:id -> ลบสินค้าตาม ID (🆕)
router.delete('/:id', deleteProduct);

// POST /api/products/seed -> ยิงข้อมูลจำลอง
router.post('/seed', seedProducts);

export default router;