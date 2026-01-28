import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🟢 1. ดึงรายการสินค้าทั้งหมด (READ)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' } // เรียงจากใหม่ไปเก่า
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
};

// 🟢 2. เพิ่มสินค้าใหม่ (CREATE)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, category, image } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price), // แปลงเป็นตัวเลขให้ชัวร์
        category,
        image: image || "", // ถ้าไม่มีรูป ใส่ว่างไว้
        isActive: true
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// 🟢 3. แก้ไขสินค้า (UPDATE)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // รับ ID จาก URL
    const { name, price, category, image, isActive } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) }, // ต้องแปลง ID เป็นตัวเลข (Int)
      data: {
        name,
        price: price ? parseFloat(price) : undefined, // ถ้าส่งราคามาค่อยแก้
        category,
        image,
        isActive // เอาไว้เปิด-ปิดเมนู (true/false)
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

// 🟢 4. ลบสินค้า (DELETE)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "✅ Product deleted successfully" });
  } catch (error) {
    // ⚠️ ถ้าสินค้าเคยถูกสั่งซื้อไปแล้ว Database อาจจะไม่ยอมให้ลบ (ติด Relation)
    // แนะนำให้ใช้การ update isActive: false แทนการลบครับ
    res.status(500).json({ error: "Failed to delete product (Item might be in use)" });
  }
};

// 🔥 Seed Data (อันเดิม)
export const seedProducts = async (req: Request, res: Response) => {
  try {
    await prisma.product.deleteMany();
    await prisma.product.createMany({
      data: [
        { name: "Spicy Pickled Shrimp", price: 18.99, category: "Main", image: "/images/shrimp1.jpg" },
        { name: "Fresh Shrimp Platter", price: 24.99, category: "Main", image: "/images/shrimp2.jpg" },
        { name: "Shrimp Appetizer", price: 16.99, category: "Appetizer", image: "/images/app1.jpg" },
        { name: "Coke Zero", price: 2.50, category: "Drink", image: "/images/coke.jpg" },
      ]
    });
    res.json({ message: "✅ Seed Data Added Successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed data" });
  }
};