import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();

// 🟢 1. สร้างออเดอร์ใหม่ (Create Order)
export const createOrder = async (req: Request, res: Response) => {
    try {
        // ✅ 1. รับ note มาด้วย
        const { customerName, items, totalAmount, paymentMethod, discordUserId, discordChannelId, note } = req.body;

        // A. บันทึกลง Database MySQL
        const newOrder = await prisma.order.create({
            data: {
                customerName: customerName || "General Customer",
                totalAmount: parseFloat(totalAmount),
                paymentMethod: paymentMethod || "Cash",
                status: "Pending",
                discordUserId: discordUserId,
                discordChannelId: discordChannelId,
                note: note, // ✅ 2. บันทึก Note (ส่วนลด) ลงใน Order ไว้ก่อน

                items: {
                    create: items.map((item: any) => ({
                        productId: Number(item.id),
                        productName: item.name,
                        quantity: Number(item.quantity),
                        priceAtTime: parseFloat(item.price)
                    }))
                }
            },
            include: { items: true }
        });

        // ❌ เอา Transaction ตรงนี้ออก (เพราะระบบคุณไปทำตอน Completed)

        // B. ยิง Discord
        axios.post('http://localhost:4001/notify/new-order', {
            orderId: newOrder.id,
            totalAmount: newOrder.totalAmount,
            items: items,
            customerName: newOrder.customerName,
            note: note // ส่ง Note ไปบอกใน Discord ด้วยก็ได้
        }).catch(err => console.error("⚠️ Failed to notify Discord Bot"));

        res.status(201).json(newOrder);

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};

// 🟢 2. ดึงประวัติออเดอร์ทั้งหมด
export const getOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 50 } = req.query;
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
                items: { include: { product: true } }
            }
        });

        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch order" });
    }
};

// 🟢 4. อัปเดตสถานะออเดอร์ (Real-time Income)
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (status === 'Completed') {
            const result = await prisma.$transaction(async (tx) => {
                const existing = await tx.order.findUnique({ where: { id: Number(id) } });
                if (!existing || existing.status === 'Completed') throw new Error("Order handled");

                // 1. เปลี่ยนสถานะ
                const updated = await tx.order.update({
                    where: { id: Number(id) },
                    data: { status: 'Completed' }
                });

                // 2. 💰 บันทึกรายรับทันที (เมื่อสถานะเป็น Completed)
                await tx.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: existing.totalAmount,
                        category: 'Sales',
                        
                        // ✅ 3. แก้ตรงนี้: ให้ดึงชื่อลูกค้า (ที่มีส่วนลดติดมา) มาใส่ใน Description
                        // (Frontend เราส่งชื่อแบบ "สมชาย (ลด 10%)" มาแล้ว มันจะมาโผล่ตรงนี้)
                        description: `Order #${existing.id} : ${existing.customerName}`,
                        
                        orderId: existing.id,
                        slipImage: existing.slipImage,
                        createdAt: new Date()
                    }
                });

                return updated;
            });
            return res.json(result);
        } else {
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

// 🟢 5. Sync Transaction ย้อนหลัง
export const syncTransactions = async (req: Request, res: Response) => {
    try {
        const ordersMissingTx = await prisma.order.findMany({
            where: { status: 'Completed', transaction: null }
        });

        if (ordersMissingTx.length === 0) {
            return res.json({ message: "✅ ข้อมูลบัญชีครบถ้วนแล้ว ไม่ต้อง Sync เพิ่ม" });
        }

        let count = 0;
        for (const order of ordersMissingTx) {
            await prisma.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: order.totalAmount,
                    category: 'Sales',
                    // ✅ Sync ย้อนหลังก็เอาชื่อลูกค้ามาใส่ด้วย
                    description: `Income from Order #${order.id} : ${order.customerName}`,
                    orderId: order.id,
                    createdAt: order.updatedAt
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

// 🟢 6. อัปโหลดสลิป
export const uploadSlip = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        if (!req.file) return res.status(400).json({ error: "No slip image uploaded" });
        const slipPath = `/uploads/slips/${req.file.filename}`;
        const updatedOrder = await prisma.order.update({
            where: { id: Number(id) },
            data: { slipImage: slipPath }
        });
        res.json({ message: "✅ Slip uploaded successfully", slipImage: slipPath, order: updatedOrder });
    } catch (error) {
        console.error("Upload Slip Error:", error);
        res.status(500).json({ error: "Failed to upload slip" });
    }
};