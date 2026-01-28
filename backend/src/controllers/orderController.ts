import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios'; // ใช้ยิงไปหา Bot

const prisma = new PrismaClient();

// 🟢 1. สร้างออเดอร์ใหม่ (Create Order)
export const createOrder = async (req: Request, res: Response) => {
  try {
    // รับข้อมูลจากหน้าเว็บ
    const { customerName, items, totalAmount, paymentMethod } = req.body;

    // A. บันทึกลง Database MySQL
    const newOrder = await prisma.order.create({
      data: {
        customerName: customerName || "General Customer",
        totalAmount: parseFloat(totalAmount),
        paymentMethod: paymentMethod || "Cash",
        status: "Pending",
        // บันทึกรายการสินค้าลงตารางลูก (OrderItems) พร้อมกันเลย
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            priceAtTime: item.price
          }))
        }
      },
      include: { items: true } // ให้ส่งข้อมูลรายการกลับมาด้วย
    });

    // B. 🔥 ยิงไปบอก Discord Bot (ที่ Port 4001)
    try {
        await axios.post('http://localhost:4001/notify/new-order', {
            orderId: newOrder.id,
            totalAmount: newOrder.totalAmount,
            items: items
        });
        console.log("✅ Sent notification to Discord Bot");
    } catch (botError) {
        console.error("⚠️ Failed to notify Discord Bot (Is it running?)");
    }

    // C. ตอบกลับหน้าเว็บ
    res.status(201).json(newOrder);

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// 🟢 2. ดึงประวัติออเดอร์ทั้งหมด (Get All Orders)
export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true }, // ดึงรายการสินค้ามาด้วย
            orderBy: { createdAt: 'desc' } // เรียงจากใหม่ไปเก่า
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

// 🟢 3. (ใหม่!) ดึงรายละเอียดออเดอร์เดียว (Get Order by ID)
// ใช้เวลาคลิกดูบิลย้อนหลัง
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: Number(id) }, // แปลง id เป็นตัวเลขเสมอ
            include: { items: true }
        });
        
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch order" });
    }
};

// 🟢 4. (ใหม่!) อัปเดตสถานะออเดอร์ (Update Status)
// ใช้สำหรับเปลี่ยนเป็น Cooking, Completed หรือ Cancelled
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // รับค่า status ใหม่จากหน้าเว็บ

        const updatedOrder = await prisma.order.update({
            where: { id: Number(id) },
            data: { status: status },
            include: { items: true }
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Failed to update order status" });
    }
};