import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// 👇 Import Routes
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import stockRoutes from './routes/stockRoutes';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // อนุญาตให้ Frontend ยิงเข้ามาได้
app.use(express.json()); // อ่าน JSON body

// ================= ROUTES =================

// 1. สินค้า (Menu)
app.use('/api/products', productRoutes);

// 2. ออเดอร์ (POS System)
app.use('/api/orders', orderRoutes);

// 3. สต็อก (Inventory & Expense)
app.use('/api/stocks', stockRoutes);

// 4. บัญชี (Reports & Income)
app.use('/api/transactions', transactionRoutes);

// 5. โฟลเดอร์รูปภาพ (Static Files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../Asset/uploads')));
// หมายเหตุ: ตรวจสอบว่าโฟลเดอร์ Asset อยู่ระดับเดียวกับ src หรือ folder นอกสุด
const assetPath = path.resolve(__dirname, '..', 'Asset');
app.use('/Asset', express.static(assetPath));

// Route เช็คสถานะ Server (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.send('✅ Pickled Shrimp POS Backend is Running!');
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
    // console.log(`- Products:     http://localhost:${PORT}/api/products`);
    // console.log(`- Orders:       http://localhost:${PORT}/api/orders`);
    // console.log(`- Stocks:       http://localhost:${PORT}/api/stocks`);
    // console.log(`- Transactions: http://localhost:${PORT}/api/transactions`);
});