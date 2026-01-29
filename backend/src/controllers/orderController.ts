import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();

// 🟢 1. สร้างออเดอร์ใหม่ (Create Order)
export const createOrder = async (req: Request, res: Response) => {
    try {
        // รับข้อมูลจากหน้าเว็บ
        const { customerName, items, totalAmount, paymentMethod, discordUserId, discordChannelId } = req.body;

        // A. บันทึกลง Database MySQL
        const newOrder = await prisma.order.create({
            data: {
                customerName: customerName || "General Customer",
                totalAmount: parseFloat(totalAmount),
                paymentMethod: paymentMethod || "Cash",
                status: "Pending", // ตรงกับ Enum ใน Schema
                discordUserId: discordUserId,     // (Optional) เก็บไว้เผื่อ Bot ตอบกลับ
                discordChannelId: discordChannelId,

                // บันทึกรายการสินค้าลงตารางลูก (OrderItems)
                items: {
                    create: items.map((item: any) => ({
                        productId: Number(item.id),
                        productName: item.name,   // Snapshot ชื่อสินค้า ณ ตอนขาย
                        quantity: Number(item.quantity),
                        priceAtTime: parseFloat(item.price) // Snapshot ราคา ณ ตอนขาย
                    }))
                }
            },
            include: { items: true } // ให้ส่งข้อมูลรายการกลับมาด้วย
        });

        // B. 🔥 ยิงไปบอก Discord Bot (ที่ Port 4001)
        // ใช้ setImmediate หรือไม่รอ await เพื่อให้หน้าเว็บตอบสนองเร็วขึ้น
        axios.post('http://localhost:4001/notify/new-order', {
            orderId: newOrder.id,
            totalAmount: newOrder.totalAmount,
            items: items,
            customerName: newOrder.customerName
        }).catch(err => console.error("⚠️ Failed to notify Discord Bot"));

        // C. ตอบกลับหน้าเว็บ
        res.status(201).json(newOrder);

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};

// 🟢 2. ดึงประวัติออเดอร์ทั้งหมด
export const getOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 50 } = req.query; // รองรับ Pagination ในอนาคต
        const orders = await prisma.order.findMany({
            take: Number(limit),
            skip: (Number(page) - 1) * Number(limit),
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

// 🟢 3. ดึงรายละเอียดออเดอร์เดียว
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                items: {
                    include: { product: true } // ดึงข้อมูล Product จริงมาด้วยเผื่อเช็ครูป
                }
            }
        });

        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch order" });
    }
};

// 🟢 4. อัปเดตสถานะออเดอร์ (Update Status)
// 🟢 4. อัปเดตสถานะออเดอร์ (Real-time Income)
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (status === 'Completed') {
            const result = await prisma.$transaction(async (tx) => {
                // เช็คกันซ้ำ
                const existing = await tx.order.findUnique({ where: { id: Number(id) } });
                if (!existing || existing.status === 'Completed') throw new Error("Order handled");

                // 1. เปลี่ยนสถานะ
                const updated = await tx.order.update({
                    where: { id: Number(id) },
                    data: { status: 'Completed' }
                });

                // 2. 💰 บันทึกรายรับทันที (Real-time Income)
                await tx.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: existing.totalAmount,
                        category: 'Sales',
                        description: `Order #${existing.id}`,
                        orderId: existing.id,
                        createdAt: new Date() // เวลาปัจจุบัน
                    }
                });

                // 3. 📦 ตัดสต็อก (Recipe Logic) - ถ้ามี
                // ... (ใส่ Logic ตัดสต็อกตรงนี้) ...

                return updated;
            });
            return res.json(result);
        } else {
            // Cancel หรือสถานะอื่น ไม่ยุ่งกับเงิน
            const updated = await prisma.order.update({
                where: { id: Number(id) },
                data: { status }
            });
            return res.json(updated);
        }
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
};

// 🟢 5. (ใหม่!) Sync Transaction ย้อนหลัง (แก้ปัญหา Report เป็น 0)
export const syncTransactions = async (req: Request, res: Response) => {
    try {
        // 1. หา Order ที่จบแล้ว (Completed) แต่ยังไม่มีในบัญชี (Transaction)
        const ordersMissingTx = await prisma.order.findMany({
            where: {
                status: 'Completed',
                transaction: null // ยังไม่มี Transaction ผูกอยู่
            }
        });

        if (ordersMissingTx.length === 0) {
            return res.json({ message: "✅ ข้อมูลบัญชีครบถ้วนแล้ว ไม่ต้อง Sync เพิ่ม" });
        }

        let count = 0;

        // 2. วนลูปสร้างรายการบัญชีย้อนหลัง
        for (const order of ordersMissingTx) {
            await prisma.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: order.totalAmount, // เอายอดจากออเดอร์มาใส่
                    category: 'Sales',
                    description: `Income from Order #${order.id} (Synced)`,
                    orderId: order.id,
                    createdAt: order.updatedAt // ใช้วันที่เดียวกับตอนจบออเดอร์
                }
            });
            count++;
        }

        res.json({ message: `🎉 กู้คืนข้อมูลสำเร็จ! สร้างรายการบัญชีเพิ่ม ${count} รายการ` });

    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ error: "Failed to sync transactions" });
    }
};

// 🟢 6. (ใหม่!) อัปโหลดสลิปโอนเงิน (Upload Payment Slip)
export const uploadSlip = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // ตรวจสอบว่ามีไฟล์ส่งมาไหม
        if (!req.file) {
            return res.status(400).json({ error: "No slip image uploaded" });
        }

        const slipPath = `/uploads/slips/${req.file.filename}`; // เก็บแยกโฟลเดอร์ slips เพื่อความเป็นระเบียบ

        // อัปเดต path รูปสลิปลงใน Order
        const updatedOrder = await prisma.order.update({
            where: { id: Number(id) },
            data: { 
                slipImage: slipPath,
                // ถ้าอัปสลิปแล้ว อาจจะเปลี่ยนสถานะเป็น 'Paid' หรือ 'Checking' ก็ได้ (แล้วแต่ Flow ร้าน)
                // status: 'Checking' 
            }
        });

        res.json({ 
            message: "✅ Slip uploaded successfully", 
            slipImage: slipPath,
            order: updatedOrder 
        });

    } catch (error) {
        console.error("Upload Slip Error:", error);
        res.status(500).json({ error: "Failed to upload slip" });
    }
};