"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import heic2any from "heic2any";
// ❌ ลบ import axios เดิม
// ✅ import api และ SERVER_URL จากไฟล์ที่เราเพิ่งสร้าง
import { api, SERVER_URL } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import { ProductCatalog } from "@/components/ProductCatalog";
import {
  Trash2,
  Plus,
  Minus,
  Loader2,
  User,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// ❌ ลบ const BACKEND_URL ทิ้งไปเลย ไม่ใช้แล้ว

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("New Order");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Add New Menu Item State ---
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState("Main");
  const [newMenuDescription, setNewMenuDescription] = useState("");
  const [newMenuImage, setNewMenuImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 🔄 1. Fetch Products from Backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // ✅ ใช้ api.get แทน (ไม่ต้องใส่ URL ยาวๆ แล้ว ใส่แค่ชื่อ path)
      const res = await api.get("/products");
      const data = res.data as any[];

      const formattedProducts = data.map((item: any) => {
        let imagePath = item.image || "/placeholder.png";

        // ✅ แก้ Logic รูปภาพให้ใช้ SERVER_URL ที่มาจาก Docker
        if (imagePath && !imagePath.startsWith("http")) {
          imagePath = `${SERVER_URL}${encodeURI(imagePath)}`;
        }

        return {
          ...item,
          id: item.id.toString(),
          name: item.name,
          price: Number(item.price),
          category: item.category,
          image: imagePath,
          description: item.description,
        };
      });

      setProducts(formattedProducts);
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🛒 2. Cart Management Functions
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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

  // 🧭 3. Navigation Management
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const routes: Record<string, string> = {
      Dashboard: "/dashboard",
      "Order History": "/order-history",
      Transactions: "/reports",
      Stock: "/stock",
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 💳 4. Checkout Function
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      const orderPayload = {
        customerName: customerName.trim() || "Walk-in Customer",
        totalAmount: totalAmount,
        paymentMethod: "Cash",
        items: cartItems.map((item) => ({
          id: Number(item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // ✅ ใช้ api.post แทน
      await api.post("/orders", orderPayload);
      alert("✅ Order sent to kitchen successfully!");
      setCartItems([]);
      setCustomerName("");
    } catch (error) {
      console.error("Checkout Failed:", error);
      alert("❌ Failed to send order. Please check backend connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ➕ 5. Add New Menu Item Function
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      let fileToProcess = file; // สร้างตัวแปรมารับไฟล์ (เผื่อต้องแปลง)

      // 🔍 เช็คว่าเป็นไฟล์ตระกูล HEIC หรือไม่
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try {
          // บอกให้ User รู้หน่อยว่ากำลังแปลงไฟล์ (ถ้ามี State Loading ก็เปิดตรงนี้ได้)
          console.log("🔄 Detecting HEIC file, converting...");

          // สั่งแปลงเป็น JPG
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8, // ปรับคุณภาพได้ (0.1 - 1.0)
          });

          // แปลง Blob กลับเป็น File Object
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

          fileToProcess = new File(
            [blob],
            file.name.replace(/\.heic$/i, ".jpg"), // เปลี่ยนนามสกุลไฟล์
            { type: "image/jpeg" }
          );

          console.log("✅ Converted to JPG successfully!");
        } catch (error) {
          console.error("❌ Failed to convert HEIC:", error);
          alert("ไม่สามารถแปลงไฟล์ภาพได้ กรุณาลองใหม่หรือใช้ไฟล์ JPG/PNG");
          return;
        }
      }

      // ✅ ทำงานต่อด้วยไฟล์ที่ (อาจจะ) ถูกแปลงแล้ว
      setNewMenuImage(fileToProcess);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(fileToProcess);
    }
  };

  const handleAddNewMenu = async () => {
    if (!newMenuName || !newMenuPrice) {
      alert("Please fill in at least the name and price.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("name", newMenuName);
    formData.append("price", newMenuPrice);
    formData.append("category", newMenuCategory);
    formData.append("description", newMenuDescription);
    if (newMenuImage) {
      formData.append("image", newMenuImage);
    }

    try {
      // ✅ ใช้ api.post แทน
      await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Menu item added successfully!");
      setIsAddMenuOpen(false);

      // Reset Form
      setNewMenuName("");
      setNewMenuPrice("");
      setNewMenuCategory("Main");
      setNewMenuDescription("");
      setNewMenuImage(null);
      setImagePreview(null);

      // Refresh Data
      fetchProducts();
    } catch (error) {
      console.error("Failed to add menu item:", error);
      alert("❌ Failed to add menu item.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black font-sans overflow-hidden">
      {/* ... ส่วน UI เหมือนเดิมทุกอย่าง ... */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="w-full z-50 bg-white dark:bg-black border-b relative shadow-sm flex justify-between items-center pr-6">
          <div className="flex-1">
            <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
          <Button
            onClick={() => setIsAddMenuOpen(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Menu
          </Button>
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3 text-zinc-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="font-medium">Preparing menu...</p>
            </div>
          ) : (
            <ProductCatalog products={products} onAddToCart={handleAddToCart} />
          )}
        </main>
      </div>

      <aside className="w-[380px] xl:w-[420px] border-l bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-full shadow-2xl z-40">
        <div className="p-6 border-b dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold">Current Order</h2>
            <span className="text-zinc-500 text-sm">
              {cartItems.length} items
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Customer Name / Table No."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/30 dark:bg-black/10">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-3xl">
                🛒
              </div>
              <p className="font-medium">Cart is empty</p>
              <p className="text-xs">Click on menu items to add.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col p-4 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl border dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold truncate pr-2 dark:text-zinc-100">
                      {item.name}
                    </span>
                    <span className="font-bold text-blue-600 shrink-0">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                      <button
                        onClick={() => handleDecreaseQuantity(item.id)}
                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:text-red-500 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:text-blue-500 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-zinc-400 hover:text-red-500 p-2 transition-colors"
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
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Checkout (฿{totalAmount.toLocaleString()})</span>
            )}
          </button>
        </div>
      </aside>

      {/* --- Add New Menu Item Dialog --- */}
      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} className="col-span-3" placeholder="e.g. Pad Thai" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input id="price" type="number" value={newMenuPrice} onChange={(e) => setNewMenuPrice(e.target.value)} className="col-span-3" placeholder="e.g. 120" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <select id="category" value={newMenuCategory} onChange={(e) => setNewMenuCategory(e.target.value)} className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="Main">Main Dish</option>
                <option value="Side Dish">Side Dish</option>
                <option value="Drink">Drink</option>
                <option value="Dessert">Dessert</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={newMenuDescription} onChange={(e) => setNewMenuDescription(e.target.value)} className="col-span-3" placeholder="Description..." />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right pt-2">Image</Label>
              <div className="col-span-3">
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors relative h-40" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                      <button onClick={(e) => { e.stopPropagation(); setNewMenuImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-400"><ImageIcon className="w-8 h-8 mb-2" /><span className="text-xs text-center">Click to upload image</span></div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMenuOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewMenu} disabled={isUploading} className="bg-blue-600 text-white hover:bg-blue-700">
              {isUploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : ("Save Menu")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}