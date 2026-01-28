"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios"; // 👈 นำเข้า axios เพื่อดึงข้อมูล
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Search,
  Package,
  DollarSign,
  AlertCircle,
  X,
  Save,
  Loader2,
} from "lucide-react";

// --- 1. TYPE DEFINITIONS ---
interface StockItem {
  id: number; // ปรับเป็น number ตาม Backend
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalValue: number; // Backend จะคำนวณมาให้
}

export default function StockPage() {
  const router = useRouter();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState({ totalItems: 0, grandTotalValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State สำหรับ Modal เพิ่มข้อมูล
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Raw Material",
    quantity: 0,
    unit: "kg",
    costPerUnit: 0,
  });

  // --- 2. ดึงข้อมูลจริงจาก Backend ---
  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/stocks");
      setStockItems(response.data.items);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("❌ Failed to fetch stock:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // --- 3. Logic: Add New Item (ยิง API จริง) ---
  const handleAddItem = async () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.costPerUnit <= 0) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return;
    }

    try {
      await axios.post("http://localhost:4000/api/stocks", newItem);
      alert("✅ เพิ่มรายการสำเร็จ");
      setIsModalOpen(false);
      fetchStock(); // โหลดข้อมูลใหม่หลังจากเพิ่มเสร็จ
      setNewItem({ name: "", category: "Raw Material", quantity: 0, unit: "kg", costPerUnit: 0 });
    } catch (error) {
      alert("❌ ไม่สามารถเพิ่มรายการได้");
    }
  };

  // --- 4. Logic: Delete Item (ยิง API จริง) ---
  const handleDelete = async (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      try {
        await axios.delete(`http://localhost:4000/api/stocks/${id}`);
        fetchStock(); // โหลดข้อมูลใหม่หลังจากลบเสร็จ
      } catch (error) {
        alert("❌ ไม่สามารถลบรายการได้");
      }
    }
  };

  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };

  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = stockItems.filter((item) => item.quantity < 5).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans relative">
      <div className="sticky top-0 z-40">
        <Navbar activeTab="Stock" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Inventory Management
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Track raw materials and packaging costs.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg">
            <Plus className="w-4 h-4" /> Insert New Item
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Stock Value</CardTitle>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{summary.grandTotalValue.toLocaleString()}</div>
              <p className="text-xs text-zinc-500 mt-1">Total capital in inventory</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Items Count</CardTitle>
              <Package className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalItems} SKUs</div>
              <p className="text-xs text-zinc-500 mt-1">Managed ingredients</p>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${lowStockCount > 0 ? "bg-orange-50 dark:bg-orange-900/10" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Low Stock Alert</CardTitle>
              <AlertCircle className={`w-4 h-4 ${lowStockCount > 0 ? "text-orange-600" : "text-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-600" : "text-green-600"}`}>{lowStockCount} Items</div>
              <p className="text-xs text-zinc-400 mt-1">Threshold: &lt; 5 units</p>
            </CardContent>
          </Card>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Search inventory..."
              className="max-w-sm border-none shadow-none focus-visible:ring-0 px-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[30%]">Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost / Unit</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                       <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell className="font-medium">
                      {item.name}
                      {item.quantity < 5 && (
                        <span className="ml-2 text-[10px] text-red-500 bg-red-100 px-1 rounded">Low</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        item.category === "Raw Material" ? "bg-green-50 text-green-700 border-green-200" :
                        item.category === "Seasoning" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>{item.category}</span>
                    </TableCell>
                    <TableCell className="text-right">฿{Number(item.costPerUnit).toLocaleString()}</TableCell>
                    <TableCell className="text-center font-medium">
                      {item.quantity} <span className="text-zinc-400 text-xs font-normal">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      ฿{Number(item.totalValue).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Modal - เพิ่มรายการใหม่ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border dark:border-zinc-800 p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b dark:border-zinc-800">
              <h2 className="text-xl font-bold">Add New Stock Item</h2>
              <X className="w-5 h-5 cursor-pointer text-zinc-500" onClick={() => setIsModalOpen(false)} />
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <Input placeholder="e.g. Lime Juice" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" 
                    value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Seasoning">Seasoning</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input placeholder="kg, btl, pcs" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost per Unit (฿)</label>
                  <Input type="number" value={newItem.costPerUnit} onChange={(e) => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="w-4 h-4 mr-2" /> Save Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}