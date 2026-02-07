"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
// ✅ เปลี่ยนมาใช้ api ตัวกลาง (Port 9098)
import { api, SERVER_URL } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Loader2, Check, X, Upload, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// --- TYPE DEFINITIONS ---
interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  priceAtTime: number;
}

interface Order {
  id: number;
  customerName: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  slipImage?: string;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Upload Slip State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- View Slip State ---
  const [isViewSlipOpen, setIsViewSlipOpen] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const handleNavigation = (tab: string) => {
    const routes: Record<string, string> = {
      "New Order": "/",
      Dashboard: "/dashboard",
      "Order History": "/order-history",
      Stock: "/stock",
      Transactions: "/reports",
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  // --- 2. Fetch Orders from Backend ---
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // ✅ ใช้ api.get แทน (ตัด URL ยาวๆ ออก)
      const response = await api.get<Order[]>("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 🔥 3. Update Status Function
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    const confirmMsg = newStatus === 'Completed'
      ? "Confirm to complete order? (This will record income)"
      : "Confirm to cancel order?";

    if (!confirm(confirmMsg)) return;

    try {
      // ✅ ใช้ api.patch (Backend ต้องเปิดรับ PATCH ด้วยนะ)
      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus
      });

      alert(`✅ Order #${orderId} status updated to ${newStatus}!`);
      fetchOrders();
    } catch (error) {
      console.error("Update failed:", error);
      alert("❌ Failed to update status.");
    }
  };

  // --- 4. Upload Slip Functions ---
  const openUploadModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSlipFile(null);
    setSlipPreview(null);
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!selectedOrderId || !slipFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("slip", slipFile);

    try {
      // ✅ ใช้ api.post
      await api.post(`/orders/${selectedOrderId}/upload-slip`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Slip uploaded successfully!");
      setIsUploadModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("❌ Failed to upload slip.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 5. View Slip Function ---
  const handleViewAction = (order: Order) => {
    if (order.slipImage) {
      let fullUrl = order.slipImage;
      // ✅ ใช้ SERVER_URL จาก lib/axios
      if (order.slipImage && !order.slipImage.startsWith("http")) {
        const cleanPath = order.slipImage.startsWith('/') ? order.slipImage : `/${order.slipImage}`;
        fullUrl = `${SERVER_URL}${cleanPath}`;
      }
      setViewSlipUrl(fullUrl);
      setIsViewSlipOpen(true);
    } else {
      alert(`Order #${order.id} details: \nStatus: ${order.status}\nNo payment slip attached.`);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter((order) =>
    order.id.toString().includes(searchTerm) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
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
            <p className="text-zinc-500 dark:text-zinc-400">
              Manage and view past transactions.
            </p>
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
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center w-[150px]">Action</TableHead>
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
                    <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString("th-TH")}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-zinc-400">
                          {order.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>

                      <TableCell>
                        <Badge
                          className={`${getStatusColor(
                            order.status
                          )} border px-2 py-0.5 rounded-full font-normal shadow-none`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        ฿{Number(order.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full border-zinc-200 text-zinc-500 hover:text-blue-600 hover:border-blue-200"
                            title="Upload Slip"
                            onClick={() => openUploadModal(order.id)}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>

                          {order.status === "Pending" ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 rounded-full"
                                title="Complete Order"
                                onClick={() => handleUpdateStatus(order.id, "Completed")}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 h-8 w-8 p-0 rounded-full"
                                title="Cancel Order"
                                onClick={() => handleUpdateStatus(order.id, "Cancelled")}
                              >
                                <X className="w-4 h-4 text-white" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${order.slipImage ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-zinc-400"}`}
                              title={order.slipImage ? "View Slip" : "View Details"}
                              onClick={() => handleViewAction(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* --- Upload Slip Modal --- */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Payment Slip (Order #{selectedOrderId})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors h-64 relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {slipPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="Slip Preview" className="w-full h-full object-contain rounded-md" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                    <p className="text-white font-medium">Click to change</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-400 gap-2">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-sm">Click to upload slip image</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadSlip} disabled={isUploading || !slipFile}>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- View Slip Modal --- */}
      <Dialog open={isViewSlipOpen} onOpenChange={setIsViewSlipOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {viewSlipUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewSlipUrl}
                alt="Payment Slip"
                className="max-w-full max-h-full object-contain"
              />
            )}
            <button
              onClick={() => setIsViewSlipOpen(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}