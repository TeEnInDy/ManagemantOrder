import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// 👇 Import Routes
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import stockRoutes from './routes/stockRoutes';
import transactionRoutes from './routes/transactionRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ================= MIDDLEWARE =================
// ✅ แก้ไข CORS ตรงนี้ครับ
app.use(cors({
    origin: [
        "http://localhost:3000",      // Next.js (Run แบบ npm run dev)
        "http://localhost:9099",      // Docker (Localhost)
        "http://dekdee2.informatics.buu.ac.th:9099" // Server มหาลัย (IP/Domain จริง)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true // อนุญาตให้ส่ง Cookie/Auth Header
}));

app.use(express.json()); // อ่าน JSON body

// ================= ROUTES =================
app.use('/api/auth', authRoutes); // login

// 1. สินค้า (Menu)
app.use('/api/products', productRoutes);

// 2. ออเดอร์ (POS System)
app.use('/api/orders', orderRoutes);

// 3. สต็อก (Inventory & Expense)
app.use('/api/stocks', stockRoutes);

// 4. บัญชี (Reports & Income)
app.use('/api/transactions', transactionRoutes);

// 5. โฟลเดอร์รูปภาพ (Static Files)
// หมายเหตุ: ตรวจสอบ path ให้ดีว่าโฟลเดอร์ uploads อยู่ที่ไหน
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// app.use('/uploads', express.static(path.join(__dirname, '../Asset/uploads')));

// จัดการ Static Files อื่นๆ (ถ้ามี)
const assetPath = path.resolve(__dirname, '..', 'Asset');
app.use('/Asset', express.static(assetPath));

// Route เช็คสถานะ Server (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.send('✅ Pickled Shrimp POS Backend is Running!');
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
});