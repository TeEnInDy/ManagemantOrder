"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, SERVER_URL } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import {
  Search,
  Filter,
  ChevronDown,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- TYPE DEFINITIONS ---
interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  createdAt: string;
  customerName: string;
  totalAmount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
  slipImage?: string; // string | undefined
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Order History");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      const data = res.data as any[];

      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        createdAt: order.createdAt,
        customerName: order.customerName || "Walk-in Customer",
        totalAmount: Number(order.totalAmount || 0),
        status: order.status,
        // ✅ แก้ตรงนี้: เปลี่ยน null เป็น undefined
        slipImage: order.slipImage ? `${SERVER_URL}${order.slipImage}` : undefined,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          name: item.product?.name || item.name || "Unknown Item",
          quantity: Number(item.quantity || 0),
          price: Number(item.price || item.product?.price || 0),
        })),
      }));

      // กำหนด Type ให้ชัดเจนตอน sort
      setOrders(formattedOrders.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const routes: Record<string, string> = {
      "New Order": "/",
      Dashboard: "/dashboard",
      "Order History": "/order-history",
      Transactions: "/reports",
      Stock: "/stock",
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus =
      filterStatus === "All" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b dark:border-zinc-800">
        <Navbar activeTab="Order History" onTabChange={handleTabChange} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Order History
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              จัดการรายการสั่งซื้อและสถานะ
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[300px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search order # or name..."
                className="pl-9 bg-white dark:bg-zinc-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white dark:bg-zinc-900">
                  <Filter className="w-4 h-4" />
                  {filterStatus === "All" ? "All Status" : filterStatus}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("All")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("PENDING")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("COMPLETED")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("CANCELLED")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" /> กำลังโหลดข้อมูล...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>ไม่พบรายการสั่งซื้อ</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Order #{order.id}</span>
                        {order.slipImage && (
                          <FileText className="w-4 h-4 text-green-500 cursor-pointer" onClick={() => setSelectedSlip(order.slipImage!)} />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`${getStatusColor(order.status)} font-medium`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Customer:</span>
                      <span className="font-medium text-right truncate max-w-[120px]">{order.customerName}</span>
                    </div>
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 my-2"></div>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {item.quantity}x <span className="text-zinc-800 dark:text-zinc-200">{item.name}</span>
                          </span>
                          <span className="text-zinc-400 font-mono">
                            ฿{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-zinc-500">Total Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      ฿{order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  {order.slipImage && (
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs" onClick={() => setSelectedSlip(order.slipImage!)}>
                      View Slip
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedSlip} onOpenChange={(open) => !open && setSelectedSlip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-zinc-100 rounded-lg overflow-hidden">
            {selectedSlip && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedSlip} alt="Slip" className="max-h-[500px] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}