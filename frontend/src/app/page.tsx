"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { ProductCatalog } from "@/components/ProductCatalog";
import { Trash2, Plus, Minus, Loader2, User } from "lucide-react";

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  price: number;
  image: string; 
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// กำหนด URL ของ Backend ไว้ที่เดียวเพื่อให้จัดการง่าย
const BACKEND_URL = "http://localhost:4000";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("New Order");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔄 1. ดึงข้อมูลเมนูจาก Backend และจัดการ Path รูปภาพ
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/api/products`);
        const data = res.data as any[];

        const formattedProducts = data.map((item: any) => {
          let imagePath = item.image || "/placeholder.png";

          // จัดการ Path รูปภาพให้ถูกต้องตามที่เก็บใน Backend /Asset
          if (imagePath && !imagePath.startsWith("http")) {
            // ใช้ encodeURI เพื่อป้องกันกรณีชื่อไฟล์มีอักขระพิเศษหรือเว้นวรรคหลงเหลืออยู่
            imagePath = `${BACKEND_URL}${encodeURI(imagePath)}`;
          }

          return {
            ...item,
            id: item.id.toString(),
            name: item.name,
            price: Number(item.price),
            category: item.category,
            image: imagePath,
          };
        });

        setProducts(formattedProducts);
      } catch (error) {
        console.error("❌ Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 🛒 2. ฟังก์ชันจัดการตะกร้าสินค้า
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: Math.max(0, item.quantity - 1) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // 🧭 3. การจัดการ Navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const routes: Record<string, string> = {
      "Dashboard": "/dashboard",
      "Order History": "/order-history",
      "Reports": "/reports",
      "Stock": "/stock"
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 💳 4. ฟังก์ชัน Checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      const finalAmount = totalAmount * 1.07; // คำนวณภาษี 7%
      const orderPayload = {
        customerName: customerName.trim() || "Walk-in Customer",
        totalAmount: finalAmount,
        paymentMethod: "Cash",
        items: cartItems.map((item) => ({
          id: Number(item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      await axios.post(`${BACKEND_URL}/api/orders`, orderPayload);
      alert("✅ ออเดอร์ส่งเข้าครัวเรียบร้อยแล้ว!");
      setCartItems([]);
      setCustomerName("");
    } catch (error) {
      console.error("Checkout Failed:", error);
      alert("❌ ไม่สามารถส่งออเดอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ Backend");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black font-sans overflow-hidden">
      
      {/* --- ส่วนแสดงเมนู (ซ้าย) --- */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="w-full z-50 bg-white dark:bg-black border-b relative shadow-sm">
          <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3 text-zinc-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="font-medium">กำลังเตรียมเมนูอาหาร...</p>
            </div>
          ) : (
            <ProductCatalog products={products} onAddToCart={handleAddToCart} />
          )}
        </main>
      </div>

      {/* --- ส่วนตะกร้าสินค้า (ขวา) --- */}
      <aside className="w-[380px] xl:w-[420px] border-l bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-full shadow-2xl z-40">
        
        {/* ส่วนหัวตะกร้า */}
        <div className="p-6 border-b dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold">ออเดอร์ปัจจุบัน</h2>
            <span className="text-zinc-500 text-sm">{cartItems.length} รายการ</span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="ชื่อลูกค้า / เลขโต๊ะ"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* รายการในตะกร้า */}
        <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/30 dark:bg-black/10">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-3xl">🛒</div>
              <p className="font-medium">ตะกร้ายังว่างอยู่</p>
              <p className="text-xs">กดที่เมนูเพื่อเพิ่มรายการอาหาร</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col p-4 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl border dark:border-zinc-700">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold truncate pr-2 dark:text-zinc-100">{item.name}</span>
                    <span className="font-bold text-blue-600 shrink-0">฿{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                      <button onClick={() => handleDecreaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:text-red-500 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                      <button onClick={() => handleAddToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:text-blue-500 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-zinc-400 hover:text-red-500 p-2 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* สรุปยอดเงิน */}
        <div className="p-6 border-t bg-white dark:bg-zinc-900">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-zinc-500 font-medium">
              <span>ราคาก่อนภาษี</span>
              <span className="text-zinc-900 dark:text-zinc-200">฿{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500 font-medium">
              <span>ภาษี (7%)</span>
              <span className="text-zinc-900 dark:text-zinc-200">฿{(totalAmount * 0.07).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-2xl font-black pt-3 border-t dark:border-zinc-800 text-blue-600">
              <span>ยอดชำระสุทธิ</span>
              <span>฿{(totalAmount * 1.07).toLocaleString()}</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-lg"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>กำลังประมวลผล...</span></>
            ) : (
              <span>ชำระเงิน (฿{(totalAmount * 1.07).toLocaleString()})</span>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}