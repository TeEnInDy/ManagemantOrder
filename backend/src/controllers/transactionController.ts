import { Request, Response } from 'express';
import { PrismaClient, Transaction } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// 🟢 1. ดึงรายการบัญชี + สรุปตัวเลขการเงิน (Dashboard)
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    // 🟢 รับค่าจาก Frontend: month/year สำหรับรายเดือน หรือ startDate/endDate สำหรับรายสัปดาห์
    const { month, year, startDate, endDate } = req.query;

    let whereClause: any = {};

    // 1. ตรวจสอบการกรองข้อมูลตามช่วงวันที่ (สำหรับ Weekly หรือ Custom Range)
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    // 2. ตรวจสอบการกรองข้อมูลแบบรายเดือน (Monthly)
    else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59); // วันสุดท้ายของเดือน เวลาสิ้นวัน
      whereClause.createdAt = { gte: start, lte: end };
    }
    // 3. ตรวจสอบการกรองข้อมูลแบบรายปี (Yearly)
    else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59);
      whereClause.createdAt = { gte: start, lte: end };
    }

    // ดึงข้อมูลรายการจาก Database
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // --- คำนวณรายรับ/รายจ่าย ---
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') totalIncome += amount;
      else if (t.type === 'EXPENSE') totalExpense += amount;
    });

    const netProfit = totalIncome - totalExpense;

    // --- 💰 คำนวณส่วนแบ่งหุ้น ( Teen 50%, Pond 25%, Beam 25% ) ---
    let distribution = null;

    if (netProfit > 0) {
      // สูตร: กำไร 50% เก็บเข้าทุนร้าน | 50% แบ่งปันผล
      const toCapital = netProfit * 0.50;
      const toShareholders = netProfit * 0.50;

      distribution = {
        retainedEarnings: toCapital, // เงินเก็บเข้ากองทุนร้าน
        dividendPool: toShareholders, // เงินรวมสำหรับปันผล
        shares: {
          teen_50: toShareholders * 0.50, // Teen รับ 50% ของกองปันผล
          pond_25: toShareholders * 0.25, // Pond รับ 25% ของกองปันผล
          beam_25: toShareholders * 0.25  // Beam รับ 25% ของกองปันผล
        }
      };
    }

    res.json({
      summary: { totalIncome, totalExpense, netProfit, distribution },
      history: transactions
    });

  } catch (error) {
    console.error("🔥 Report Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

// 🟢 2. บันทึกรายการใหม่ (Manual Add)
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { type, amount, category, description } = req.body;
    const newTx = await prisma.transaction.create({
      data: {
        type, // INCOME หรือ EXPENSE
        amount: parseFloat(amount),
        category,
        description
      }
    });
    res.status(201).json(newTx);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// 🟢 3. Export PDF Report
export const exportFinancialPDF = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // คำนวณยอดเหมือนข้างบน
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += Number(t.amount);
      else totalExpense += Number(t.amount);
    });
    const netProfit = totalIncome - totalExpense;

    // เริ่มสร้าง PDF
    const doc = new PDFDocument({ margin: 50 });

    // ตั้งชื่อไฟล์เวลาดาวน์โหลด
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_report.pdf');

    doc.pipe(res); // ส่งไฟล์ตรงไปที่ Browser

    // --- หัวกระดาษ ---
    doc.fontSize(20).text('Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // --- สรุปตัวเลข (Summary Box) ---
    doc.fontSize(14).text('Summary Overview', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Income: ${totalIncome.toLocaleString()} THB`);
    doc.text(`Total Expense: ${totalExpense.toLocaleString()} THB`);

    // เปลี่ยนสีตามกำไร/ขาดทุน
    if (netProfit >= 0) doc.fillColor('green');
    else doc.fillColor('red');
    doc.text(`Net Profit: ${netProfit.toLocaleString()} THB`);
    doc.fillColor('black'); // กลับมาสีดำ

    doc.moveDown();

    // --- ส่วนแบ่งกำไร (Dividend) ---
    if (netProfit > 0) {
      doc.text('-------------------------------------------------------');
      doc.text('Profit Distribution');
      doc.moveDown(0.5);

      const toCapital = netProfit * 0.50;
      const toShareholders = netProfit * 0.50;

      doc.text(`1. Retained Earnings: ${toCapital.toLocaleString()} THB`);
      doc.text(`2. Dividend Pool: ${toShareholders.toLocaleString()} THB`);
      doc.moveDown(0.5);
      doc.text(`   - Partner 1 (50%): ${(toShareholders * 0.50).toLocaleString()} THB`);
      doc.text(`   - Partner 2 (25%): ${(toShareholders * 0.25).toLocaleString()} THB`);
      doc.text(`   - Partner 3 (25%): ${(toShareholders * 0.25).toLocaleString()} THB`);
      doc.text('-------------------------------------------------------');
    }

    doc.moveDown();

    // --- ตารางรายการ (Transaction List) ---
    doc.fontSize(14).text('Transaction History');
    doc.moveDown(0.5);
    doc.fontSize(10);

    // Header Table
    const y = doc.y;
    doc.text('Date', 50, y, { width: 90 });
    doc.text('Type', 150, y, { width: 60 });
    doc.text('Category', 220, y, { width: 100 });
    doc.text('Amount', 330, y, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    // Data Rows
    transactions.forEach((t) => {
      const dateStr = t.createdAt.toLocaleDateString();
      const amountStr = Number(t.amount).toLocaleString();

      // เช็คว่าหน้ากระดาษหมดหรือยัง
      if (doc.y > 700) doc.addPage();

      doc.text(dateStr, 50, doc.y, { width: 90, continued: true });
      doc.text(t.type, 150, doc.y - doc.currentLineHeight(), { width: 60 });
      doc.text(t.category, 220, doc.y - doc.currentLineHeight(), { width: 100 });

      if (t.type === 'INCOME') doc.fillColor('green');
      else doc.fillColor('red');
      doc.text(amountStr, 330, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
      doc.fillColor('black');

      doc.moveDown(0.5);
    });

    doc.end(); // จบการทำงาน PDF

  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};