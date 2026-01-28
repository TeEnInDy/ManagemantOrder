"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; // ใช้ Table Component ของ Shadcn UI
import { Badge } from "@/components/ui/badge"; // ใช้ Badge แสดงสถานะ
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Filter, ArrowUpDown } from "lucide-react";
import { format } from "date-fns"; // ถ้าไม่มีให้ใช้ toLocaleDateString แทนได้

// --- 1. TYPE DEFINITIONS ---
interface Order {
  id: string;
  customerName: string;
  date: string; // หรือ Date type
  status: "Completed" | "Pending" | "Cancelled" | "Processing";
  totalAmount: number;
  itemsCount: number;
  paymentMethod: string;
}

// --- 2. MOCK DATA (ข้อมูลจำลอง) ---
const MOCK_ORDERS: Order[] = [
  { id: "ORD-001", customerName: "Alice Freeman", date: "2023-10-25T10:30:00", status: "Completed", totalAmount: 45.99, itemsCount: 3, paymentMethod: "Credit Card" },
  { id: "ORD-002", customerName: "Bob Smith", date: "2023-10-25T11:15:00", status: "Processing", totalAmount: 24.50, itemsCount: 1, paymentMethod: "Cash" },
  { id: "ORD-003", customerName: "Charlie Brown", date: "2023-10-24T14:20:00", status: "Completed", totalAmount: 120.00, itemsCount: 5, paymentMethod: "QR Code" },
  { id: "ORD-004", customerName: "David Wilson", date: "2023-10-24T09:00:00", status: "Cancelled", totalAmount: 15.00, itemsCount: 1, paymentMethod: "Credit Card" },
  { id: "ORD-005", customerName: "Eve Johnson", date: "2023-10-23T18:45:00", status: "Completed", totalAmount: 67.80, itemsCount: 4, paymentMethod: "Cash" },
  { id: "ORD-006", customerName: "Frank Miller", date: "2023-10-23T12:10:00", status: "Pending", totalAmount: 35.25, itemsCount: 2, paymentMethod: "Credit Card" },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS); // เริ่มต้นด้วย Mock Data
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };
  // --- 3. API INTEGRATION PLACEHOLDER (ส่วนเชื่อมต่อ API) ---
  useEffect(() => {
    // ฟังก์ชันสำหรับดึงข้อมูลจริง (Uncomment เมื่อพร้อมใช้งาน)
    const fetchOrders = async () => {
      /*
      setIsLoading(true);
      try {
        // TODO: เปลี่ยน URL นี้เป็น Endpoint ของ Backend คุณ
        // const response = await fetch('/api/order-history'); 
        // const data = await response.json();
        // setOrders(data); // อัปเดต State ด้วยข้อมูลจริง
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
      */
      console.log("Fetching orders from API..."); // จำลองการทำงาน
    };

    fetchOrders();
  }, []);

  // ฟังก์ชันช่วยเลือกสี Badge ตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
      case "Processing": return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200";
      case "Cancelled": return "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar 
          activeTab="Order History" 
          onTabChange={handleNavigation}
        />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Order History
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Manage and view past transactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search & Table Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          
          {/* Search Bar */}
          <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-zinc-400" />
            <Input 
              placeholder="Search by order ID or customer..." 
              className="max-w-sm border-none shadow-none focus-visible:ring-0 px-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>
                     <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-900">
                       Date <ArrowUpDown className="w-3 h-3" />
                     </div>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading State
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  // Empty State
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Data Rows
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="text-zinc-500">
                        {/* ใช้ new Date().toLocaleDateString() ถ้ายังไม่ได้ลง date-fns */}
                        {new Date(order.date).toLocaleDateString()} 
                        <span className="text-xs text-zinc-400 block">
                          {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </TableCell>
                      <TableCell>
                         <div className="font-medium">{order.customerName}</div>
                         <div className="text-xs text-zinc-500">{order.paymentMethod}</div>
                      </TableCell>
                      <TableCell>{order.itemsCount} items</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} border px-2 py-0.5 rounded-full font-normal shadow-none`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Footer (Static Placeholder) */}
          <div className="p-4 border-t dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-500">
             <span>Showing 1-6 of {orders.length} orders</span>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled>Previous</Button>
               <Button variant="outline" size="sm" disabled>Next</Button>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
}