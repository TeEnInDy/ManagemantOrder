import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🟢 1. ดึงรายการสต็อกทั้งหมด + คำนวณยอดรวม
export const getStocks = async (req: Request, res: Response) => {
  try {
    const stocks = await prisma.stockItem.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // แปลง Decimal เป็น Number เพื่อให้คำนวณใน JS ง่ายขึ้น
    const stockWithValues = stocks.map(item => {
      const qty = Number(item.quantity);
      const cost = Number(item.costPerUnit);
      return {
        ...item,
        quantity: qty,        // ส่งไปหน้าเว็บเป็นตัวเลขปกติ
        costPerUnit: cost,    // ส่งไปหน้าเว็บเป็นตัวเลขปกติ
        totalValue: qty * cost // มูลค่ารวมของชิ้นนี้
      };
    });

    // คำนวณมูลค่าสต็อกรวมทั้งร้าน
    const grandTotal = stockWithValues.reduce((sum, item) => sum + item.totalValue, 0);

    res.json({
      items: stockWithValues,
      summary: {
        totalItems: stocks.length,
        grandTotalValue: grandTotal
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stock items" });
  }
};

// 🟢 2. เพิ่มรายการสต็อกใหม่
export const createStock = async (req: Request, res: Response) => {
  try {
    const { name, category, unit, quantity, costPerUnit, lowStockThreshold, supplier, expiryDate } = req.body;

    const newStock = await prisma.stockItem.create({
      data: {
        name,
        category,
        unit,
        quantity: parseFloat(quantity),      // แปลงเป็น Float ก่อนส่งให้ Prisma Decimal
        costPerUnit: parseFloat(costPerUnit), // แปลงเป็น Float ก่อนส่งให้ Prisma Decimal
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 5,
        supplier: supplier || "",
        expiryDate: expiryDate ? new Date(expiryDate) : null // ถ้าส่งวันหมดอายุมา ก็บันทึกด้วย
      }
    });

    res.status(201).json(newStock);
  } catch (error) {
    console.error("Create Stock Error:", error);
    res.status(500).json({ error: "Failed to create stock item" });
  }
};

// 🟢 3. ลบรายการ
export const deleteStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.stockItem.delete({
      where: { id: Number(id) }
    });
    res.json({ message: "✅ Stock item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
};