// server/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "my-secret-key-1234"; // ควรย้ายไปใส่ .env

// 🟢 1. ลงทะเบียน (Register) - เอาไว้สร้าง User คนแรก
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

        // เช็คว่ามี user นี้หรือยัง
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: "Username already exists" });

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role || 'STAFF'
            }
        });

        res.status(201).json({ message: "User created", user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: "Register failed" });
    }
};

// 🟢 2. เข้าสู่ระบบ (Login)
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // หา User
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ error: "User not found" });

        // เช็คระหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid password" });

        // สร้าง Token (บัตรผ่าน)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1d' } // อายุ 1 วัน
        );

        res.json({ 
            message: "Login successful", 
            token, 
            user: { id: user.id, username: user.username, role: user.role } 
        });

    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
};