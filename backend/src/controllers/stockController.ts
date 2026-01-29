import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📦 1. ดึงรายการสต็อกทั้งหมด + คำนวณยอดรวม (Frontend ใช้ตัวนี้)
export const getStocks = async (req: Request, res: Response) => {
  try {
    const stocks = await prisma.stockItem.findMany({
      orderBy: { name: 'asc' } // เรียงตามชื่อ (A-Z) จะหาง่ายกว่า
    });

    // แปลง Decimal เป็น Number เพื่อให้คำนวณใน JS ง่ายขึ้น
    const stockWithValues = stocks.map(item => {
      const qty = Number(item.quantity);
      const cost = Number(item.costPerUnit);
      return {
        ...item,
        quantity: qty,
        costPerUnit: cost,
        totalValue: qty * cost // มูลค่ารวมของชิ้นนี้
      };
    });

    // คำนวณมูลค่าสต็อกรวมทั้งร้าน
    const grandTotal = stockWithValues.reduce((sum, item) => sum + item.totalValue, 0);

    // ส่ง Array ของ Items ออกไปตรงๆ (เพื่อให้ Frontend map ได้ง่าย)
    // หรือส่งเป็น Object { items, summary } ก็ได้ แต่ต้องแก้ Frontend ให้ตรงกัน
    // ในที่นี้ผมส่ง Array ไปก่อนเพื่อให้ตารางทำงานได้เลย ส่วน Summary เดี๋ยว Frontend คำนวณเองได้
    res.json(stockWithValues); 

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stock items" });
  }
};

// 🆕 2. สร้างสต็อกใหม่พร้อมบันทึกต้นทุนแรกเข้า (ใช้สำหรับ New Item / Curl Seed Data)
export const createStockInit = async (req: Request, res: Response) => {
  try {
      const { name, category, quantity, unit, cost, costPerUnit: costPerUnitInput } = req.body; 
      
      await prisma.$transaction(async (tx) => {
          const qty = parseFloat(quantity);
          
          // Logic: ถ้าส่ง cost (ราคารวม) มา ให้หาร quantity
          // แต่ถ้าส่ง costPerUnit มาตรงๆ ก็ใช้เลย
          let finalCostPerUnit = 0;
          let totalCost = 0;

          if (cost) {
             totalCost = parseFloat(cost);
             finalCostPerUnit = qty > 0 ? (totalCost / qty) : 0;
          } else if (costPerUnitInput) {
             finalCostPerUnit = parseFloat(costPerUnitInput);
             totalCost = qty * finalCostPerUnit;
          }

          // 1. สร้างสินค้า
          const newItem = await tx.stockItem.create({
              data: {
                  name,
                  category: category || 'General',
                  quantity: qty,
                  unit,
                  costPerUnit: finalCostPerUnit,
                  lowStockThreshold: 5
              }
          });

          // 2. บันทึก Log แรกเข้า
          await tx.stockLog.create({
              data: {
                  stockItemId: newItem.id,
                  type: 'RESTOCK', // ถือเป็นการเติมของครั้งแรก
                  amount: qty,
                  costAtTime: finalCostPerUnit,
                  reason: 'Initial Stock / New Item'
              }
          });

          // 3. ลงบัญชีรายจ่าย (Expense)
          if (totalCost > 0) {
            await tx.transaction.create({
                data: {
                    type: 'EXPENSE',
                    amount: totalCost,
                    category: 'Stock Purchase',
                    description: `ซื้อสินค้าใหม่: ${name}`,
                    createdAt: new Date()
                }
            });
          }

          return newItem;
      });

      res.status(201).json({ message: "✅ Stock created successfully" });

  } catch (error) {
      console.error("Init Stock Error:", error);
      res.status(500).json({ error: "Failed to create stock" });
  }
};

// ➕ 3. เติมของเพิ่ม (Restock) + คำนวณต้นทุนเฉลี่ย
export const restockItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, cost, supplier } = req.body; 

    try {
        await prisma.$transaction(async (tx) => {
            const item = await tx.stockItem.findUnique({ where: { id: Number(id) } });
            if (!item) throw new Error("Item not found");

            const addedQty = Number(quantity);
            const totalCostBatch = Number(cost); 
            
            // 🧮 สูตรคำนวณต้นทุนเฉลี่ย (Weighted Average Cost)
            const currentTotalValue = Number(item.quantity) * Number(item.costPerUnit);
            const newTotalValue = currentTotalValue + totalCostBatch;
            const newTotalQty = Number(item.quantity) + addedQty;
            
            const newCostPerUnit = newTotalQty > 0 ? (newTotalValue / newTotalQty) : 0;

            await tx.stockItem.update({
                where: { id: Number(id) },
                data: {
                    quantity: newTotalQty,
                    costPerUnit: newCostPerUnit,
                    supplier: supplier || item.supplier
                }
            });

            await tx.stockLog.create({
                data: {
                    stockItemId: Number(id),
                    type: 'RESTOCK',
                    amount: addedQty,
                    costAtTime: newCostPerUnit,
                    reason: `เติมของเพิ่ม`
                }
            });

            await tx.transaction.create({
                data: {
                    type: 'EXPENSE',
                    amount: totalCostBatch,
                    category: 'Stock Purchase',
                    description: `Restock: ${item.name} (${addedQty} ${item.unit})`
                }
            });
        });

        res.json({ message: "✅ Restock successful" });
    } catch (error) {
        res.status(500).json({ error: "Failed to restock" });
    }
};

// ✂️ 4. ตัดสต็อก (Cut Stock / Usage)
export const useStockItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, reason, type } = req.body; // type: 'USE' | 'WASTE'

    try {
        await prisma.$transaction(async (tx) => {
            const item = await tx.stockItem.findUnique({ where: { id: Number(id) } });
            if (!item) throw new Error("Item not found");

            const usedQty = Number(amount);

            if (Number(item.quantity) < usedQty) {
                throw new Error("❌ ของในสต็อกไม่พอให้ตัด!");
            }

            // 1. อัปเดตจำนวนคงเหลือ
            await tx.stockItem.update({
                where: { id: Number(id) },
                data: { quantity: { decrement: usedQty } }
            });

            // 2. บันทึก Log การใช้
            await tx.stockLog.create({
                data: {
                    stockItemId: Number(id),
                    type: type || 'USE', 
                    amount: -usedQty,     // บันทึกเป็นค่าติดลบ
                    costAtTime: item.costPerUnit,
                    reason: reason || 'ใช้งานทั่วไป'
                }
            });
            
            // หมายเหตุ: การ "ใช้ของ" ปกติจะไม่ลง Transaction เป็น Expense 
            // เพราะ Expense ลงไปแล้วตอน "ซื้อของ" (Restock)
            // แต่ถ้าอยากลงเป็น "Loss" (ความเสียหาย) ก็เพิ่ม Logic ตรงนี้ได้
        });

        res.json({ message: "✅ Stock deducted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message || "Failed to use stock" });
    }
};

// 🗑️ 5. ลบรายการสินค้า (Delete Item)
export const deleteStock = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findUnique({ where: { id: Number(id) } });
      if (!item) throw new Error("Item not found");

      // คืนยอดเงิน (Adjustment)
      const totalValue = Number(item.quantity) * Number(item.costPerUnit);
      if (totalValue > 0) {
        await tx.transaction.create({
          data: {
            type: 'EXPENSE',
            amount: -totalValue, // คืนยอดติดลบ
            category: 'Stock Adjustment',
            description: `ลบรายการสต็อก: ${item.name}`,
            createdAt: new Date()
          }
        });
      }

      await tx.stockItem.delete({ where: { id: Number(id) } });
    });

    res.json({ message: "✅ Item deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// 📜 6. ดูประวัติสต็อก (History)
export const getStockHistory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const logs = await prisma.stockLog.findMany({
            where: { stockItemId: Number(id) },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
};