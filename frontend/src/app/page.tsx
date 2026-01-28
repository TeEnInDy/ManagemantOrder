"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // 👈 เพิ่ม Router สำหรับเปลี่ยนหน้า
import { Navbar } from "@/components/Navbar";
import { ProductCatalog } from "@/components/ProductCatalog";
import { Trash2, Plus, Minus } from "lucide-react"; // ไอคอนสำหรับจัดการตะกร้า

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// --- MOCK DATA ---
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Spicy Pickled Shrimp", price: 18.99, category: "Main", image: "/placeholder.png" },
  { id: "2", name: "Fresh Shrimp Platter", price: 24.99, category: "Main", image: "/placeholder.png" },
  { id: "3", name: "Grilled Shrimp Special", price: 21.99, category: "Main", image: "/placeholder.png" },
  { id: "4", name: "Shrimp Appetizer Combo", price: 16.99, category: "Appetizer", image: "/placeholder.png" },
  { id: "5", name: "Seafood Shrimp Bowl", price: 19.99, category: "Main", image: "/placeholder.png" },
  { id: "6", name: "Asian Shrimp Salad", price: 17.99, category: "Salad", image: "/placeholder.png" },
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("New Order");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 🛒 ฟังก์ชันจัดการตะกร้าสินค้า (เพิ่มจำนวนถ้ามีอยู่แล้ว)
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

  // 🗑️ ฟังก์ชันลบสินค้า
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  // 🔽 ฟังก์ชันลดจำนวน
  const handleDecreaseQuantity = (productId: string) => {
    setCartItems((prev) => 
      prev.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        return item;
      }).filter(item => item.quantity > 0) // ลบออกถ้าจำนวนเป็น 0
    );
  };

  // 🔗 ฟังก์ชันเปลี่ยนหน้าเมื่อกด Navbar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Logic การเปลี่ยนหน้า
    if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("order-history");
    else if (tab === "Reports") router.push("/reports");
    else if (tab === "Stock") router.push("/stock");
    // ถ้าเป็น New Order อยู่หน้านี้อยู่แล้ว ไม่ต้องทำอะไร
  };

  // 💰 คำนวณยอดรวม
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black font-sans overflow-hidden">
      
      {/* ================= LEFT SIDE (70-75%) ================= */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Navbar Wrapper */}
        <div className="w-full z-50 bg-white dark:bg-black border-b relative shadow-sm">
             <Navbar 
               activeTab={activeTab} 
               onTabChange={handleTabChange} // ใช้ฟังก์ชันที่มี Router
             />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20"> 
            
            {/* Search Bar */}
            <div className="w-full">
               <input 
                 type="text" 
                 placeholder="Search menu..." 
                 className="w-full p-4 rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>

            <header>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Featured Menu
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Select items to add to your order
              </p>
            </header>

            {/* Catalog */}
            <ProductCatalog
              products={MOCK_PRODUCTS} 
              onAddToCart={handleAddToCart}
            />
          </div>
        </main>
      </div>

      {/* ================= RIGHT SIDE (Cart) ================= */}
      <aside className="w-[350px] xl:w-[400px] border-l bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-full shadow-xl z-40">
        
        <div className="p-6 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900">
             <h2 className="text-2xl font-bold">Current Order</h2>
             <p className="text-zinc-500">{cartItems.length} items</p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/50 dark:bg-black/20">
            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4">
                    <span className="text-4xl">🛒</span>
                    <p>No items in cart</p>
                    <p className="text-xs">Tap on Stock to add here</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {cartItems.map((item, index) => (
                        <div key={index} className="flex flex-col p-3 bg-white dark:bg-zinc-800 shadow-sm rounded-lg border dark:border-zinc-700 gap-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium truncate w-32 dark:text-zinc-200">{item.name}</span>
                                <span className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            
                            {/* Cart Controls */}
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                                    <button 
                                        onClick={() => handleDecreaseQuantity(item.id)}
                                        className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded shadow-sm hover:bg-zinc-50"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => handleAddToCart(item)}
                                        className="w-6 h-6 flex items-center justify-center bg-white dark:bg-zinc-800 rounded shadow-sm hover:bg-zinc-50"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="p-6 border-t bg-white dark:bg-zinc-900">
             <div className="space-y-2 mb-4">
                 <div className="flex justify-between text-sm text-zinc-500">
                     <span>Subtotal</span>
                     <span>${totalAmount.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-zinc-500">
                     <span>Tax (7%)</span>
                     <span>${(totalAmount * 0.07).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xl font-bold pt-2 border-t">
                     <span>Total</span>
                     <span>${(totalAmount * 1.07).toFixed(2)}</span>
                 </div>
             </div>
             <button 
                disabled={cartItems.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
             >
                 Charge Order (${(totalAmount * 1.07).toFixed(2)})
             </button>
        </div>
      </aside>

    </div>
  );
}