import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';   // 👈 เพิ่มเพื่อใช้ลบไฟล์
import path from 'path'; // 👈 เพิ่มเพื่อจัดการ Path

const prisma = new PrismaClient();

// 🟢 1. ดึงรายการสินค้าทั้งหมด (READ)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(products);
  } catch (error) {
    console.error("🔥 Error Detail:", error);
    res.status(500).json({ error: "Error fetching products" });
  }
};

// 🟢 2. เพิ่มสินค้าใหม่ + รองรับรูปภาพ (CREATE)
export const createProduct = async (req: Request, res: Response) => {
  try {
    // req.body จะเก็บข้อมูล Text
    // req.file จะเก็บข้อมูลไฟล์รูป (ถ้ามี)
    const { name, price, category, description } = req.body;

    // ตรวจสอบว่ามีไฟล์อัปโหลดมาไหม?
    // ถ้ามี: เก็บ Path เป็น /Asset/uploads/ชื่อไฟล์
    // ถ้าไม่มี: ให้เป็นค่าว่าง string
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category: category || 'General', // ถ้าไม่ระบุหมวดหมู่ ให้เป็น General
        image: imagePath,
        description: description || "",
        isActive: true
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// 🟢 3. แก้ไขสินค้า + เปลี่ยนรูปภาพ (UPDATE)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, category, isActive, description } = req.body;

    // 1. หาข้อมูลเก่าก่อน (เพื่อเอารูปเก่ามาลบ กรณีมีการเปลี่ยนรูป)
    const oldProduct = await prisma.product.findUnique({ where: { id: Number(id) } });

    if (!oldProduct) {
        return res.status(404).json({ error: "Product not found" });
    }

    let imagePath = oldProduct.image; // เริ่มต้นใช้รูปเดิม

    // 2. ถ้ามีการอัปโหลดรูปใหม่เข้ามา
    if (req.file) {
        imagePath = `/uploads/${req.file.filename}`; // ใช้รูปใหม่

        // 🗑️ ลบรูปเก่าทิ้ง (ถ้ามีรูปเก่า และไม่ใช่รูป Default)
        if (oldProduct.image && oldProduct.image.startsWith('/uploads/')) {
            const oldFilePath = path.join(__dirname, '../../', oldProduct.image);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath); // ลบไฟล์ออกจากเครื่อง
            }
        }
    }

    // 3. อัปเดตข้อมูล
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        category,
        image: imagePath,
        description,
        isActive: isActive ? JSON.parse(isActive) : undefined // แปลง string "true"/"false" เป็น boolean
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// 🟢 4. ลบสินค้า + ลบรูปภาพ (DELETE)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. หาข้อมูลสินค้าก่อน เพื่อเอารูปไปลบ
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    // 2. ลบรูปภาพออกจากโฟลเดอร์ (ถ้ามี)
    if (product.image && product.image.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', product.image);
        // เช็คว่ามีไฟล์อยู่จริงไหม แล้วค่อยลบ
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    // 3. ลบข้อมูลใน Database
    await prisma.product.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "✅ Product and Image deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

// 🟢 5. Seed Data (เหมือนเดิม)
export const seedProducts = async (req: Request, res: Response) => {
    try {
      await prisma.product.deleteMany();
      const products = [
        {
          name: "ข้าวญี่ปุ่น",
          price: 20,
          category: "Side Dish",
          description: "ข้าวญี่ปุ่นหอมนุ่ม (ต่อถ้วย)",
          image: "/images/rice.jpg"
        },
        {
          name: "สาหร่าย",
          price: 20,
          category: "Side Dish",
          description: "สาหร่ายเกาหลีอบกรอบ (ห่อ)",
          image: "/images/seaweed.jpg"
        },
        {
          name: "กุ้งดอง 99฿ (10 ตัว)",
          price: 99,
          category: "Main",
          description: "กุ้งดองซีอิ๊วเกาหลี ขนาด 100 กรัม",
          image: "/images/shrimp99.jpg"
        },
        {
          name: "กุ้งดอง 149฿ (15 ตัว)",
          price: 149,
          category: "Main",
          description: "กุ้งดองซีอิ๊วเกาหลี ขนาด 150 กรัม",
          image: "/images/shrimp149.jpg"
        },
        // ... (ข้อมูลอื่นๆ เหมือนเดิม)
      ];
  
      for (const p of products) {
          await prisma.product.create({ data: p });
      }
  
      res.json({ message: "✅ เมนูสินค้าไทยถูกบันทึกเรียบร้อยแล้ว!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to seed data" });
    }
};