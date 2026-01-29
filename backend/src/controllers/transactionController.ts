import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

const buildDateFilter = (query: any) => {
  const { month, year, startDate, endDate } = query;
  let whereClause: Prisma.TransactionWhereInput = {};

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  } else if (month && year) {
    let y = Number(year);
    if (y > 2400) y -= 543;
    const start = new Date(y, Number(month) - 1, 1);
    const end = new Date(y, Number(month), 0, 23, 59, 59);
    whereClause.createdAt = { gte: start, lte: end };
  } else if (year) {
    let y = Number(year);
    if (y > 2400) y -= 543;
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    whereClause.createdAt = { gte: start, lte: end };
  }

  return whereClause;
};

const calculateDistribution = (netProfit: number) => {
  if (netProfit <= 0) return null;
  const toCapital = netProfit * 0.50;
  const toShareholders = netProfit * 0.50;

  return {
    retainedEarnings: toCapital,
    dividendPool: toShareholders,
    shares: {
      teen_50: toShareholders * 0.50,
      pond_25: toShareholders * 0.25,
      beam_25: toShareholders * 0.25
    }
  };
};

// ==========================================
// 🟢 CONTROLLERS
// ==========================================

// 1. ดึงรายงานการเงิน (Dashboard)
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const whereClause = buildDateFilter(req.query);

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const val = Number(t.amount);
      if (t.type === 'INCOME') totalIncome += val;
      else if (t.type === 'EXPENSE') totalExpense += val;
    });

    const netProfit = totalIncome - totalExpense;
    const distribution = calculateDistribution(netProfit);

    res.json({
      summary: { totalIncome, totalExpense, netProfit, distribution },
      history: transactions
    });

  } catch (error) {
    console.error("🔥 Report Error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

// 2. เพิ่มรายการรายรับ/รายจ่าย (Manual)
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { type, amount, category, description } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const newTx = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description
      }
    });
    res.status(201).json(newTx);
  } catch (error) {
    console.error("Create Tx Error:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// 3. Export PDF
export const exportFinancialPDF = async (req: Request, res: Response) => {
  try {
    const whereClause = buildDateFilter(req.query);
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += Number(t.amount);
      else totalExpense += Number(t.amount);
    });
    const netProfit = totalIncome - totalExpense;
    const distribution = calculateDistribution(netProfit);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const fontPath = path.join(process.cwd(), 'fonts', 'Sarabun-Regular.ttf');
    
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      console.warn("⚠️ Thai font not found. Using default font.");
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString('th-TH')}`, { align: 'right' });
    doc.moveDown();

    doc.rect(50, doc.y, 495, 100).stroke();
    const startY = doc.y + 15;
    
    doc.fontSize(14).text('Summary Overview', 70, startY, { underline: true });
    
    doc.fontSize(12).fillColor('black').text(`Total Income:`, 70, startY + 25);
    doc.fillColor('green').text(`${totalIncome.toLocaleString()} THB`, 200, startY + 25, { align: 'right', width: 300 });

    doc.fillColor('black').text(`Total Expense:`, 70, startY + 45);
    doc.fillColor('red').text(`${totalExpense.toLocaleString()} THB`, 200, startY + 45, { align: 'right', width: 300 });

    doc.fillColor('black').text(`Net Profit:`, 70, startY + 65);
    doc.fillColor(netProfit >= 0 ? 'blue' : 'red').text(`${netProfit.toLocaleString()} THB`, 200, startY + 65, { align: 'right', width: 300 });
    
    doc.fillColor('black');
    doc.moveDown(5);

    if (distribution) {
      doc.fontSize(14).text('Profit Distribution (การแบ่งปันผล)', 50);
      doc.moveDown(0.5);
      doc.fontSize(12);
      
      doc.text(`1. กองทุนร้าน (50%): ${distribution.retainedEarnings.toLocaleString()} THB`);
      doc.text(`2. เงินปันผล (50%): ${distribution.dividendPool.toLocaleString()} THB`);
      
      const startX = 70;
      doc.fontSize(10).fillColor('#555');
      doc.text(`• Teen (50%): ${distribution.shares.teen_50.toLocaleString()} THB`, startX);
      doc.text(`• Pond (25%): ${distribution.shares.pond_25.toLocaleString()} THB`, startX);
      doc.text(`• Beam (25%): ${distribution.shares.beam_25.toLocaleString()} THB`, startX);
      doc.fillColor('black');
      doc.moveDown(1.5);
    }

    doc.fontSize(14).text('Transaction History');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colDate = 50;
    const colType = 150;
    const colCat = 230;
    const colAmt = 400;

    doc.fontSize(10).font('Helvetica-Bold'); 
    doc.text('Date', colDate, tableTop);
    doc.text('Type', colType, tableTop);
    doc.text('Category', colCat, tableTop);
    doc.text('Amount', colAmt, tableTop, { align: 'right', width: 100 });
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown(1.5);
    
    if (fs.existsSync(fontPath)) doc.font(fontPath); else doc.font('Helvetica');
    doc.fontSize(10);

    transactions.forEach((t) => {
      const currentY = doc.y;
      if (currentY > 750) doc.addPage();

      const dateStr = t.createdAt.toLocaleDateString('th-TH');
      
      doc.text(dateStr, colDate, currentY);
      doc.text(t.type, colType, currentY);
      doc.text(t.category, colCat, currentY);

      if (t.type === 'INCOME') doc.fillColor('green');
      else doc.fillColor('red');
      
      doc.text(Number(t.amount).toLocaleString(), colAmt, currentY, { align: 'right', width: 100 });
      doc.fillColor('black');
      doc.moveDown(0.8);
    });

    doc.end();

  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).end();
  }
};

// 🟢 4. FIX DATA / FORCE SYNC
// ฟังก์ชันซ่อมข้อมูล (สำคัญมาก!)
export const syncAllData = async (req: Request, res: Response) => {
  try {
    let incomeCount = 0;
    let expenseCount = 0;

    await prisma.$transaction(async (tx) => {
      // 1. Sync Incomes
      const allCompletedOrders = await tx.order.findMany({ where: { status: 'Completed' } });
      const existingIncomes = await tx.transaction.findMany({
        where: { type: 'INCOME', orderId: { not: null } },
        select: { orderId: true }
      });
      const existingOrderIds = new Set(existingIncomes.map(tx => tx.orderId));

      for (const order of allCompletedOrders) {
        if (!existingOrderIds.has(order.id)) {
          await tx.transaction.create({
            data: {
              type: 'INCOME',
              amount: order.totalAmount,
              category: 'Sales',
              description: `Income from Order #${order.id} (Force Synced)`,
              orderId: order.id,
              createdAt: order.updatedAt
            }
          });
          incomeCount++;
        }
      }

      // 2. Sync Expenses (RESET MODE: ลบของเก่า สร้างใหม่จากสต็อกจริง)
      await tx.transaction.deleteMany({
        where: { type: 'EXPENSE', category: 'Stock Purchase' }
      });

      const stocks = await tx.stockItem.findMany();
      for (const item of stocks) {
        const totalVal = Number(item.quantity) * Number(item.costPerUnit);
        if (totalVal > 0) {
          await tx.transaction.create({
            data: {
              type: 'EXPENSE',
              amount: totalVal,
              category: 'Stock Purchase',
              description: `ซื้อวัตถุดิบ: ${item.name} (Synced)`,
              createdAt: item.createdAt
            }
          });
          expenseCount++;
        }
      }
    });

    res.json({ 
      message: `🎉 กู้คืนข้อมูลสำเร็จ!`,
      details: { newIncomes: incomeCount, totalExpensesRecreated: expenseCount }
    });

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Failed to sync data" });
  }
};