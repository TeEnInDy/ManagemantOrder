"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// ❌ ลบ import axios เดิมออก
// ✅ ใช้ api จาก lib/axios
import { api } from "@/lib/axios";
import heic2any from "heic2any";
import { Navbar } from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Scissors,
  PlusCircle,
  AlertTriangle,
  Search,
  History,
  Trash2,
  X,
  Save,
  Loader2,
  DollarSign,
  Calculator,
  UploadCloud,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- 1. TYPE DEFINITIONS ---
interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  lowStockThreshold: number;
}

export default function StockPage() {
  const router = useRouter();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockSlip, setStockSlip] = useState<File | null>(null);
  const stockFileInputRef = useRef<HTMLInputElement>(null);

  // --- Calculations for KPI Cards ---
  const totalStockValue = stockItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.costPerUnit)), 0);
  const lowStockCount = stockItems.filter(item => item.quantity <= item.lowStockThreshold).length;

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State สำหรับเพิ่มสินค้า
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Raw Material",
    quantity: 0,
    unit: "g",
    totalCost: 0,
  });

  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [cutAmount, setCutAmount] = useState("");
  const [cutReason, setCutReason] = useState("USE");

  // --- FETCH DATA ---
  // --- FETCH DATA ---
  const fetchStocks = async () => {
    setLoading(true);
    try {
      // ใช้ api.get เหมือนเดิม
      const res = await api.get("/stocks");

      // ✅ แก้ตรงนี้: เติม (res.data as any[]) เพื่อบอกว่าเป็น Array แน่ๆ
      const mappedData = (res.data as any[]).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        costPerUnit: Number(item.costPerUnit),
        lowStockThreshold: item.lowStockThreshold || 5
      }));

      setStockItems(mappedData);
    } catch (error) {
      console.error("Failed to fetch stocks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // --- ACTIONS ---

  // 1. Add New Item
  const handleAddItem = async () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.totalCost <= 0) {
      return alert("กรุณากรอกข้อมูลให้ครบ (ชื่อ, จำนวน, ราคาที่ซื้อ)");
    }

    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("category", newItem.category);
      formData.append("quantity", newItem.quantity.toString());
      formData.append("unit", newItem.unit);
      formData.append("cost", newItem.totalCost.toString());

      // ✅ แนบไฟล์ถ้ามี
      if (stockSlip) {
        formData.append("slip", stockSlip);
      }

      // ✅ ใช้ api.post แทน
      await api.post("/stocks/restock-init", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert(`✅ เพิ่มสินค้า "${newItem.name}" เรียบร้อย!`);
      setIsAddModalOpen(false);
      fetchStocks();
      // Reset Form
      setNewItem({ name: "", category: "Raw Material", quantity: 0, unit: "g", totalCost: 0 });
      setStockSlip(null); // Reset File
    } catch (error) {
      console.error(error);
      alert("❌ เพิ่มสินค้าไม่สำเร็จ");
    }
  };

  // 2. Delete Item
  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    try {
      // ✅ ใช้ api.delete แทน
      await api.delete(`/stocks/${id}`);
      fetchStocks();
    } catch (error) {
      alert("❌ ลบไม่สำเร็จ");
    }
  }

  // 3. Open Cut Modal
  const handleOpenCutModal = (item: StockItem) => {
    setSelectedStock(item);
    setCutAmount("");
    setCutReason("USE");
    setIsCutModalOpen(true);
  };

  // 4. Submit Cut Stock
  const handleSubmitCutStock = async () => {
    if (!selectedStock || !cutAmount || Number(cutAmount) <= 0) return;

    try {
      // ✅ ใช้ api.post แทน
      await api.post(`/stocks/${selectedStock.id}/use`, {
        amount: Number(cutAmount),
        type: cutReason === "WASTE" ? "WASTE" : "USE",
        reason: cutReason === "USE" ? "ปรุงอาหาร/ขาย" : (cutReason === "WASTE" ? "ของเสีย/หมดอายุ" : "เลี้ยงพนักงาน"),
      });

      alert(`✅ ตัดสต็อกเรียบร้อย!`);
      setIsCutModalOpen(false);
      fetchStocks();
    } catch (error: any) {
      // ดักจับ error จาก api wrapper หรือ response
      alert(`❌ เกิดข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
    }
  };

  const filteredStocks = stockItems.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculatedCostPerUnit = (newItem.quantity > 0 && newItem.totalCost > 0)
    ? (newItem.totalCost / newItem.quantity)
    : 0;
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      let fileToProcess = file;

      // 🔍 ตรวจสอบว่าเป็นไฟล์ HEIC หรือไม่
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try {
          console.log("🔄 Detecting HEIC slip, converting...");
          // แปลงไฟล์
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
          });

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

          // สร้าง File Object ใหม่ที่เป็น JPG
          fileToProcess = new File(
            [blob],
            file.name.replace(/\.heic$/i, ".jpg"),
            { type: "image/jpeg" }
          );
          console.log("✅ Slip converted to JPG!");
        } catch (error) {
          console.error("❌ Failed to convert HEIC:", error);
          alert("ไม่สามารถแปลงไฟล์ HEIC ได้ กรุณาใช้ไฟล์ JPG/PNG");
          return;
        }
      }

      // ✅ เก็บไฟล์ที่แปลงแล้วลง State (เพื่อรอส่งใน handleAddItem)
      setStockSlip(fileToProcess);

      // สร้าง Preview
      const reader = new FileReader();
      reader.readAsDataURL(fileToProcess);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans relative">
      <div className="sticky top-0 z-40">
        <Navbar activeTab="Stock" onTabChange={(tab) => {
          const routes: Record<string, string> = {
            "New Order": "/",
            Dashboard: "/dashboard",
            "Order History": "/order-history",
            Transactions: "/reports",
            Stock: "/stock",
          };
          if (routes[tab]) router.push(routes[tab]);
        }} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Inventory Management
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">จัดการวัตถุดิบ เบิกใช้ และเช็คต้นทุน</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <History className="w-4 h-4" /> Log ประวัติ
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg">
              <PlusCircle className="w-4 h-4" /> เพิ่มสินค้าใหม่ (New SKU)
            </Button>
          </div>
        </div>

        {/* --- KPI Cards --- */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Stock Value</CardTitle>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-zinc-500 mt-1">มูลค่าของในร้านทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Items</CardTitle>
              <Package className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockItems.length} SKUs</div>
              <p className="text-xs text-zinc-500 mt-1">รายการวัตถุดิบ</p>
            </CardContent>
          </Card>

          <Card className={`shadow-sm border-zinc-200 dark:border-zinc-800 ${lowStockCount > 0 ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Low Stock Alert</CardTitle>
              <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? "text-orange-600" : "text-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-600" : "text-green-600"}`}>{lowStockCount} Items</div>
              <p className="text-xs text-zinc-500 mt-1">ของใกล้หมด (ต่ำกว่าเกณฑ์)</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Search Bar --- */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="ค้นหาวัตถุดิบ (เช่น กระเทียม, กุ้ง)..."
            className="pl-9 bg-white dark:bg-zinc-900 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead className="w-[30%]">สินค้า (Product)</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">คงเหลือ (Qty)</TableHead>
                <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
                <TableHead className="text-center">มูลค่ารวม</TableHead>
                <TableHead className="text-center w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-zinc-500">ยังไม่มีข้อมูลวัตถุดิบ</TableCell>
                </TableRow>
              ) : (
                filteredStocks.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                        {item.name}
                        {item.quantity <= item.lowStockThreshold && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                            Low
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-zinc-100 text-zinc-600 border-zinc-200">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-zinc-700 dark:text-zinc-300">
                      {Number(item.quantity).toLocaleString()} <span className="text-xs font-normal text-zinc-400">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-zinc-500">
                      ฿{Number(item.costPerUnit).toFixed(3)} / {item.unit}
                    </TableCell>
                    <TableCell className="text-center font-medium text-blue-600 dark:text-blue-400">
                      ฿{(Number(item.quantity) * Number(item.costPerUnit)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 border"
                          title="เบิกใช้ (Cut Stock)"
                          onClick={() => handleOpenCutModal(item)}
                        >
                          <Scissors className="w-3.5 h-3.5 mr-1" /> เบิก
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* --- Dialog: เพิ่มสินค้าใหม่ (Easy Mode) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border dark:border-zinc-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b dark:border-zinc-800">
              <h2 className="text-xl font-bold">➕ เพิ่มวัตถุดิบใหม่</h2>
              <X className="w-5 h-5 cursor-pointer text-zinc-500 hover:text-zinc-800" onClick={() => setIsAddModalOpen(false)} />
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อวัตถุดิบ <span className="text-red-500">*</span></label>
                <Input placeholder="เช่น กระเทียม, กุ้งขาว, ถุงหิ้ว" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">หมวดหมู่</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                    <option value="Raw Material">Raw Material (ของสด)</option>
                    <option value="Seasoning">Seasoning (เครื่องปรุง)</option>
                    <option value="Sauce">Sauce (ซอส)</option>
                    <option value="Packaging">Packaging (บรรจุภัณฑ์)</option>
                    <option value="Fresh">Fresh (ผัก/ผลไม้)</option>
                    <option value="Dry Food">Dry Food (ของแห้ง)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">หน่วยนับ</label>
                  <Input placeholder="เช่น g, kg, ml, ชิ้น" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                </div>
              </div>

              {/* ส่วนคำนวณต้นทุนแบบง่าย (Easy Input) */}
              <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <Calculator className="w-4 h-4" /> คำนวณต้นทุน
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">ซื้อมาจำนวนเท่าไหร่?</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        className="pr-8"
                        value={newItem.quantity || ""}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-400">{newItem.unit || 'หน่วย'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">จ่ายเงินไปกี่บาท?</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        className="pr-8"
                        value={newItem.totalCost || ""}
                        onChange={(e) => setNewItem({ ...newItem, totalCost: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-400">บาท</span>
                    </div>
                  </div>
                </div>

                {/* แสดงผลการคำนวณอัตโนมัติ */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-300">
                  <span className="text-xs text-zinc-500">ต้นทุนเฉลี่ยต่อหน่วย:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {calculatedCostPerUnit > 0 ? calculatedCostPerUnit.toFixed(4) : "0.00"} บาท / {newItem.unit || "หน่วย"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">หลักฐานการโอนเงิน (Slip)</label>
                <div
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  onClick={() => stockFileInputRef.current?.click()}
                >
                  {stockSlip ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{stockSlip.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setStockSlip(null); }}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
                      <p className="text-xs text-zinc-500">คลิกเพื่อแนบสลิป (ถ้ามี)</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={stockFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}  // 👈 ต้องเรียกใช้ตรงนี้
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <Save className="w-4 h-4 mr-2" /> บันทึกสินค้า
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Dialog: เบิกสต็อก (Cut Stock) --- */}
      <Dialog open={isCutModalOpen} onOpenChange={setIsCutModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-orange-500" />
              เบิกใช้วัตถุดิบ: <span className="text-blue-600">{selectedStock?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700">
              <div className="text-sm">
                <p className="text-zinc-500">คงเหลือปัจจุบัน</p>
                <p className="font-bold text-lg">{selectedStock?.quantity} {selectedStock?.unit}</p>
              </div>
              <div className="text-sm text-right">
                <p className="text-zinc-500">ต้นทุนต่อหน่วย</p>
                <p className="font-bold text-lg">฿{Number(selectedStock?.costPerUnit).toFixed(3)}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">จำนวนที่เบิกใช้ ({selectedStock?.unit})</label>
              <Input
                type="number"
                value={cutAmount}
                onChange={(e) => setCutAmount(e.target.value)}
                placeholder="เช่น 100, 500, 1..."
                className="text-lg font-medium"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">สาเหตุการเบิก</label>
              <select
                className="w-full p-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={cutReason}
                onChange={(e) => setCutReason(e.target.value)}
              >
                <option value="USE">🍳 ปรุงอาหาร / ขายหน้าร้าน (Cost)</option>
                <option value="WASTE">🗑️ ของเสีย / หมดอายุ / ทิ้ง (Loss)</option>
                <option value="STAFF">👨‍🍳 พนักงานรับประทาน (Welfare)</option>
              </select>
            </div>

            {cutAmount && Number(cutAmount) > 0 && selectedStock && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center animate-in fade-in zoom-in duration-300">
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">มูลค่าต้นทุนที่จะตัดออก</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ฿{(Number(cutAmount) * Number(selectedStock.costPerUnit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCutModalOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={handleSubmitCutStock}
              disabled={!cutAmount || Number(cutAmount) <= 0 || Number(cutAmount) > Number(selectedStock?.quantity)}
              className={`${cutReason === 'WASTE' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {cutReason === 'WASTE' ? 'ยืนยันการทิ้ง' : 'ยืนยันการเบิก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}