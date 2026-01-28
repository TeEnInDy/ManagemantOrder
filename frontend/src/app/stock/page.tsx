"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

// --- 1. TYPE DEFINITIONS ---
interface StockItem {
  id: string;
  name: string;
  category: "Raw Material" | "Seasoning" | "Packaging" | "Others";
  quantity: number;
  unit: string;
  costPerUnit: number;
}

// --- 2. INITIAL DATA (ข้อมูลตั้งต้นตามที่คุณระบุ) ---
const INITIAL_STOCK: StockItem[] = [
  {
    id: "1",
    name: "Fresh Shrimp (กุ้งสด)",
    category: "Raw Material",
    quantity: 20,
    unit: "kg",
    costPerUnit: 350,
  },
  {
    id: "2",
    name: "Eggs (ไข่ไก่)",
    category: "Raw Material",
    quantity: 10,
    unit: "tray",
    costPerUnit: 120,
  },
  {
    id: "3",
    name: "Kikkoman Shoyu (โชยุ)",
    category: "Seasoning",
    quantity: 12,
    unit: "btl",
    costPerUnit: 180,
  },
  {
    id: "4",
    name: "Bonito Sauce (ซอสปลาแห้ง)",
    category: "Seasoning",
    quantity: 6,
    unit: "btl",
    costPerUnit: 250,
  },
  {
    id: "5",
    name: "Sesame Oil (น้ำมันงา)",
    category: "Seasoning",
    quantity: 5,
    unit: "btl",
    costPerUnit: 140,
  },
  {
    id: "6",
    name: "Sugar (น้ำตาลทราย)",
    category: "Seasoning",
    quantity: 10,
    unit: "kg",
    costPerUnit: 24,
  },
  {
    id: "7",
    name: "Salt (เกลือ)",
    category: "Seasoning",
    quantity: 20,
    unit: "bag",
    costPerUnit: 15,
  },
  {
    id: "8",
    name: "MSG (ผงชูรส)",
    category: "Seasoning",
    quantity: 5,
    unit: "kg",
    costPerUnit: 90,
  },
  {
    id: "9",
    name: "Chili (พริกจินดา)",
    category: "Raw Material",
    quantity: 3,
    unit: "kg",
    costPerUnit: 150,
  },
  {
    id: "10",
    name: "Garlic (กระเทียม)",
    category: "Raw Material",
    quantity: 5,
    unit: "kg",
    costPerUnit: 80,
  },
  {
    id: "11",
    name: "Pickled Sauce (น้ำดองปรุงสำเร็จ)",
    category: "Seasoning",
    quantity: 15,
    unit: "liter",
    costPerUnit: 100,
  },
  {
    id: "12",
    name: "Packaging Box (กล่องบรรจุภัณฑ์)",
    category: "Packaging",
    quantity: 500,
    unit: "pcs",
    costPerUnit: 8,
  },
];

export default function StockPage() {
  const router = useRouter();
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK);
  const [searchTerm, setSearchTerm] = useState("");

  // State สำหรับ Modal เพิ่มข้อมูล
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    name: "",
    category: "Raw Material",
    quantity: 0,
    unit: "kg",
    costPerUnit: 0,
  });

  // Navigation Logic
  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };

  // Logic: Add New Item
  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.costPerUnit) {
      alert("Please fill in all required fields");
      return;
    }

    const itemToAdd: StockItem = {
      id: Date.now().toString(), // สร้าง ID มั่วๆ จากเวลา
      name: newItem.name!,
      category: newItem.category as any,
      quantity: Number(newItem.quantity),
      unit: newItem.unit || "unit",
      costPerUnit: Number(newItem.costPerUnit),
    };

    setStockItems([...stockItems, itemToAdd]);
    setIsModalOpen(false); // ปิด Modal
    // Reset Form
    setNewItem({
      name: "",
      category: "Raw Material",
      quantity: 0,
      unit: "kg",
      costPerUnit: 0,
    });
  };

  // Logic: Delete Item
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setStockItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Calculations
  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + item.quantity * item.costPerUnit,
    0
  );
  //วิธีแก้ไขการตั้งค่า (ถ้าอยากเปลี่ยนเกณฑ์เตือน) ช่องนี้คือ "Low Stock Alert" (การ์ดแจ้งเตือนสินค้าใกล้หมด)
  const lowStockCount = stockItems.filter((item) => item.quantity < 5).length;

  // Filtering
  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans relative">
      <div className="sticky top-0 z-40">
        <Navbar activeTab="Stock" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Inventory Management
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Track raw materials, seasonings, and packaging costs.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Insert New Item
          </Button>
        </div>

        {/* --- KPI Summary Cards --- */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                Total Stock Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{totalStockValue.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Total capital locked in inventory
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                Items Count
              </CardTitle>
              <Package className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockItems.length} SKUs</div>
              <p className="text-xs text-zinc-500 mt-1">
                Raw Materials & Ingredients
              </p>
            </CardContent>
          </Card>

          <Card
            className={`shadow-sm border-zinc-200 dark:border-zinc-800 ${
              lowStockCount > 0 ? "bg-orange-50 dark:bg-orange-900/10" : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                Low Stock Alert
              </CardTitle>
              <AlertCircle
                className={`w-4 h-4 ${
                  lowStockCount > 0 ? "text-orange-600" : "text-green-500"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  lowStockCount > 0 ? "text-orange-600" : "text-green-600"
                }`}
              >
                {lowStockCount} Items
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Need restock immediately
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Stock Table --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Search (e.g., Kikkoman, Shrimp)..."
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
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium">
                      {item.name}
                      {item.quantity < 5 && (
                        <span className="ml-2 text-[10px] text-red-500 bg-red-100 px-1 rounded">
                          Low
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${
                          item.category === "Raw Material"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : item.category === "Seasoning"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{item.costPerUnit}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.quantity}{" "}
                      <span className="text-zinc-400 text-xs font-normal">
                        {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-zinc-700 dark:text-zinc-200">
                      ฿{(item.costPerUnit * item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
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

      {/* --- ADD ITEM MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b dark:border-zinc-800">
              <h2 className="text-xl font-bold">Add New Stock Item</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <Input
                  placeholder="e.g. Lime Juice"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as any,
                      })
                    }
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Seasoning">Seasoning</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    placeholder="kg, btl, pcs"
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cost per Unit (฿)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newItem.costPerUnit}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        costPerUnit: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" /> Save Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
