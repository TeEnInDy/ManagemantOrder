import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import stockRoutes from './routes/stockRoutes';
// 👇 1. Import Routes ที่เราสร้างไว้
import productRoutes from './routes/productRoutes';
// import orderRoutes from './routes/orderRoutes'; (เอาไว้เปิดใช้ตอนทำระบบออเดอร์)
import orderRoutes from './routes/orderRoutes'; //
import transactionRoutes from './routes/transactionRoutes';
dotenv.config();

const app = express();
// 👇 2. ใช้ Port 4000 ตามที่ตกลงกันใน .env
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // อนุญาตให้ Frontend (Next.js) ยิงเข้ามาได้
app.use(express.json()); // อ่าน JSON body

// ================= ROUTES =================

// 👇 3. ใช้งาน Route สินค้า (แก้ปัญหา Cannot GET /api/products)
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/transactions', transactionRoutes);
// (อนาคต) เชื่อมต่อ Route ออเดอร์
// app.use('/api/orders', orderRoutes);

// Route เช็คสถานะ Server (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.send('✅ Pickled Shrimp POS Backend is Running!');
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
    console.log(`📦 Product API: http://localhost:${PORT}/api/products`);
});