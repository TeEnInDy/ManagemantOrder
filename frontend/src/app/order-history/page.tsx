"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// ✅ ใช้ api และ SERVER_URL เพื่อรองรับ Docker
import { api, SERVER_URL } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChefHat,
  MoreVertical,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// --- TYPE DEFINITIONS ---
interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  totalAmount: number;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
  slipImage?: string;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // State สำหรับ Upload Slip
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 1. Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // ✅ ใช้ api.get แทน axios.get
      const res = await api.get("/orders");
      const data = res.data as any[];

      // Formatted Data & Fix Image URL
      const formattedOrders = data.map((order: any) => {
        let slipPath = order.slipImage;
        // ✅ แก้ Logic รูปภาพให้ใช้ SERVER_URL (แก้รูปแตก)
        if (slipPath && !slipPath.startsWith("http")) {
          slipPath = `${SERVER_URL}${encodeURI(slipPath)}`;
        }
        return { ...order, slipImage: slipPath };
      });

      // เรียงจากใหม่ไปเก่า
      setOrders(formattedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔄 2. Update Status Function
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      // ✅ ใช้ api.put แทน
      await api.put(`/orders/${orderId}/status`, { status: newStatus });

      // อัปเดต State ทันที (Optimistic Update)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("❌ Failed to update status");
    }
  };

  // 📤 3. Upload Slip Function
  const handleUploadSlip = async () => {
    if (!selectedOrderId || !slipFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("slip", slipFile);

      // ✅ ใช้ api.post แทน พร้อม Header
      await api.post(`/orders/${selectedOrderId}/upload-slip`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Slip uploaded successfully!");
      setIsUploadOpen(false);
      setSlipFile(null);
      fetchOrders(); // โหลดข้อมูลใหม่เพื่อแสดงรูป
    } catch (error) {
      console.error("Upload failed:", error);
      alert("❌ Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper Functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      COOKING: "bg-orange-100 text-orange-800 border-orange-200",
      SERVED: "bg-blue-100 text-blue-800 border-blue-200",
      PAID: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b shadow-sm">
        <Navbar
          activeTab="Order History"
          onTabChange={(tab) => {
            const routes: Record<string, string> = {
              "New Order": "/",
              Dashboard: "/dashboard",
              "Order History": "/order-history",
              Transactions: "/reports",
              Stock: "/stock",
            };
            if (routes[tab]) router.push(routes[tab]);
          }}
        />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Order History</h1>
            <p className="text-zinc-500">จัดการรายการสั่งซื้อและสถานะ</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search order # or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[250px] bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-white text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COOKING">Cooking</option>
              <option value="SERVED">Served</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No orders found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Order #{order.id}
                      {order.slipImage && <FileText className="w-4 h-4 text-green-500" />}
                    </CardTitle>
                    <CardDescription>{new Date(order.createdAt).toLocaleString()}</CardDescription>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(order.status)} font-bold`}>
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Customer:</span>
                      <span className="font-medium">{order.customerName}</span>
                    </div>

                    {/* Items List */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg space-y-2 max-h-[150px] overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-zinc-500">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Action */}
                    <div className="pt-2 border-t flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500">Total Amount</p>
                        <p className="text-xl font-bold text-blue-600">฿{order.totalAmount.toLocaleString()}</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "COOKING")}>
                            <ChefHat className="mr-2 h-4 w-4" /> Start Cooking
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "SERVED")}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Served
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedOrderId(order.id); setIsUploadOpen(true); }}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Slip / Pay
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "CANCELLED")} className="text-red-600">
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Show Slip Preview Button (If exists) */}
                    {order.slipImage && (
                      <Button
                        variant="ghost"
                        className="w-full text-xs text-blue-600 h-6 mt-1"
                        onClick={() => window.open(order.slipImage, '_blank')}
                      >
                        View Payment Slip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Slip Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {slipFile ? (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">{slipFile.name}</p>
                  <p className="text-xs text-zinc-500">Click to change</p>
                </div>
              ) : (
                <div className="text-center text-zinc-400">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p>Click to upload payment slip</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>This will also mark order as PAID</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadSlip} disabled={!slipFile || isUploading} className="bg-green-600 hover:bg-green-700 text-white">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}