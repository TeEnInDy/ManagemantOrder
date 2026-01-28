import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🟢 1. ดึงรายการสินค้าทั้งหมด (READ)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' } // แนะนำ: เรียงจาก ID น้อยไปมาก (เมนูจะได้เรียงสวยๆ ตามลำดับที่เพิ่ม)
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
};

// 🟢 2. เพิ่มสินค้าใหม่ (CREATE)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, category, image, description } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category,
        image: image || "",
        description: description || "",
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
    const { id } = req.params;
    const { name, price, category, image, isActive, description } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        category,
        image,
        description,
        isActive
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
    res.status(500).json({ error: "Failed to delete product (Item might be in use)" });
  }
};

export const seedProducts = async (req: Request, res: Response) => {
    try {
      // 1. ลบข้อมูลเก่าทิ้งก่อน (Clean Start)
      await prisma.product.deleteMany();
  
      // 2. เตรียมข้อมูลสินค้าใหม่
      const products = [
        // 🍚 ของทานเล่น / เพิ่มเติม
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
        // 🦐 เมนูกุ้งดอง
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
        {
          name: "กุ้งดอง 199฿ (20 ตัว)",
          price: 199,
          category: "Main",
          description: "กุ้งดองซีอิ๊วเกาหลี ขนาด 200 กรัม",
          image: "/images/shrimp199.jpg"
        },
        {
          name: "กุ้งดอง 249฿ (25 ตัว)",
          price: 249,
          category: "Main",
          description: "กุ้งดองซีอิ๊วเกาหลี ขนาด 250 กรัม",
          image: "/images/shrimp249.jpg"
        },
        {
          name: "กุ้งดอง 299฿ (Set 30 ตัว)",
          price: 299,
          category: "Main",
          description: "ขนาด 300 กรัม ฟรี! ข้าวญี่ปุ่น",
          image: "/images/shrimp299.jpg"
        },
        {
          name: "กุ้งดอง 349฿ (Set 35 ตัว)",
          price: 349,
          category: "Main",
          description: "ขนาด 350 กรัม ฟรี! ข้าวญี่ปุ่น",
          image: "/images/shrimp349.jpg"
        }
      ];
  
      // 3. วนลูปสร้างสินค้า
      for (const p of products) {
          await prisma.product.create({ data: p });
      }
  
      res.json({ message: "✅ เมนูสินค้าไทยถูกบันทึกเรียบร้อยแล้ว!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  };