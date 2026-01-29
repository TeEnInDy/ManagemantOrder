import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    getProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    seedProducts 
} from '../controllers/productController';

const router = Router();

// =========================================
// 🛠️ ตั้งค่า Multer (สำหรับอัปโหลดรูป)
// =========================================

// 1. ตรวจสอบว่ามีโฟลเดอร์ uploads ไหม ถ้าไม่มีให้สร้าง (กัน Error)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. กำหนดที่เก็บไฟล์และการตั้งชื่อ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // เก็บไฟล์ในโฟลเดอร์ uploads
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ใหม่: product-{เวลา}-{เลขสุ่ม}.นามสกุลเดิม
        // เช่น product-170659888-123.jpg (ป้องกันชื่อซ้ำ)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. ตัวกรองไฟล์ (Optional: รับเฉพาะรูปภาพ)
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไม่เกิน 5MB
});

// =========================================
// 🛣️ ROUTES
// =========================================

// GET /api/products -> ดึงสินค้าทั้งหมด
router.get('/', getProducts);

// POST /api/products -> เพิ่มสินค้าใหม่ (🔥 ต้องใส่ upload.single('image'))
// 'image' คือ key ที่ต้องส่งมาจาก Frontend (Form Data)
router.post('/', upload.single('image'), createProduct);

// PUT /api/products/:id -> แก้ไขสินค้า (🔥 ต้องใส่ upload.single เผื่อเปลี่ยนรูป)
router.put('/:id', upload.single('image'), updateProduct);

// DELETE /api/products/:id -> ลบสินค้า
router.delete('/:id', deleteProduct);

// POST /api/products/seed -> ยิงข้อมูลจำลอง
router.post('/seed', seedProducts);

export default router;