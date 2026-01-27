import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // อนุญาตให้ Next.js ดึงข้อมูลได้
app.use(express.json()); // อ่าน body ของ request เป็น JSON

// ตัวอย่าง Route สำหรับดึงออเดอร์
app.get('/api/orders', (req: Request, res: Response) => {
    res.json({ message: "Backend is ready for POS System!" });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
});