"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios"; // 👈 นำเข้า axios
import { Navbar } from "@/components/Navbar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; 
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Filter, ArrowUpDown, Loader2 } from "lucide-react";

// --- 1. TYPE DEFINITIONS (ปรับให้ตรงกับ Backend) ---
interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  priceAtTime: number;
}

interface Order {
  id: number;
  customerName: string;
  createdAt: string; // Backend ส่งมาเป็น ISO Date string
  status: string;
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[]; // มีรายการสินค้าข้างใน
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]); // เริ่มเป็นอาเรย์ว่าง
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };

  // --- 2. ดึงข้อมูลจาก Backend API ---
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        // ยิงไปที่ Endpoint ของคุณ (Port 4000)
        const response = await axios.get<Order[]>('http://localhost:4000/api/orders');
        setOrders(response.data);
      } catch (error) {
        console.error("❌ Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ฟังก์ชันกรองข้อมูล (Search)
  const filteredOrders = orders.filter(order => 
    order.id.toString().includes(searchTerm) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200"; // สำหรับสถานะอื่นๆ เช่น Cooking
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar activeTab="Order History" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Order History
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Manage and view past transactions.</p>
          </div>
        </div>

        {/* Search & Table Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-zinc-400" />
            <Input 
              placeholder="Search by Order ID or Customer name..." 
              className="max-w-sm border-none shadow-none focus-visible:ring-0 px-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Loading orders...
                       </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-zinc-500">No orders found.</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                           {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </div>
                        <div className="text-xs text-zinc-400">
                           {new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-zinc-400">{order.paymentMethod}</div>
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} border px-2 py-0.5 rounded-full font-normal shadow-none`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        ฿{Number(order.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => alert(`View details for Order #${order.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}