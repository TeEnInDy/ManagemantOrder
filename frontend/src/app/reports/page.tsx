"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  // ✅ ต้อง import ให้ครบตามนี้ครับ
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Download, Search, ArrowUpCircle, ArrowDownCircle, Wrench, 
  Calendar, Loader2, ChevronRight, PlusCircle, UploadCloud, X, Eye 
} from "lucide-react";

// ... (Types และตัวแปรอื่นๆ เหมือนเดิม)
interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string;
  slipImage?: string | null;
  createdAt: string;
}

const BACKEND_URL = "http://localhost:4000";

// ... (Helper function getWeeksInMonth เหมือนเดิม)
const getWeeksInMonth = (month: number, year: number) => {
  const weeks = [];
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);
  let currentStart = new Date(firstDate);

  while (currentStart <= lastDate) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 6);
    if (currentEnd > lastDate) currentEnd = new Date(lastDate);

    weeks.push({
      start: new Date(currentStart).toISOString().split("T")[0],
      end: new Date(currentEnd).toISOString().split("T")[0],
      label: `Week ${weeks.length + 1} (${currentStart.getDate()} - ${currentEnd.getDate()})`,
    });
    currentStart.setDate(currentStart.getDate() + 7);
  }
  return weeks;
};

export default function TransactionsPage() {
  const router = useRouter();
  
  // ... (States เดิมทั้งหมด)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTx, setFilteredTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    category: "Withdrawal",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewSlipOpen, setIsViewSlipOpen] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const weeks = useMemo(() => {
    return getWeeksInMonth(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const buildQueryParams = useCallback(() => {
    let params = new URLSearchParams();
    if (filterMode === "monthly") {
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());
    } else if (filterMode === "weekly") {
      const week = weeks[selectedWeekIdx];
      if (week) {
        params.append("startDate", week.start);
        params.append("endDate", week.end);
      }
    } else if (filterMode === "yearly") {
      params.append("year", selectedYear.toString());
    }
    return params;
  }, [filterMode, selectedMonth, selectedYear, selectedWeekIdx, weeks]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildQueryParams();
      const res = await axios.get(`${BACKEND_URL}/api/transactions?${params.toString()}`);
      const sorted = res.data.history.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
      setFilteredTx(sorted);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    let result = transactions;
    if (typeFilter !== "ALL") result = result.filter(t => t.type === typeFilter);
    if (searchTerm) {
      result = result.filter(t => 
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredTx(result);
  }, [searchTerm, typeFilter, transactions]);

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawForm.amount || isNaN(Number(withdrawForm.amount))) {
      alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("type", "EXPENSE");
      formData.append("amount", withdrawForm.amount);
      formData.append("category", withdrawForm.category);
      formData.append("description", withdrawForm.description);
      if (selectedFile) formData.append("image", selectedFile);

      await axios.post(`${BACKEND_URL}/api/transactions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ บันทึกรายการเบิกจ่ายสำเร็จ!");
      setIsWithdrawOpen(false);
      setWithdrawForm({ amount: "", category: "Withdrawal", description: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchTransactions();
    } catch (error) {
      console.error(error);
      alert("❌ เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewSlip = (slipImage: string) => {
    if (slipImage) {
        let fullUrl = slipImage;
        // 🛠️ แก้ไข Logic การสร้าง URL ให้ครอบคลุมทุกเคส
        if (!slipImage.startsWith("http")) {
            // 1. เปลี่ยน Backslash (\) เป็น Slash (/) เผื่อมาจาก Windows
            let cleanPath = slipImage.replace(/\\/g, '/');
            
            // 2. ถ้าไม่มี / นำหน้า ให้เติม
            if (!cleanPath.startsWith('/')) {
                cleanPath = `/${cleanPath}`;
            }

            // 3. ต่อ String กับ Backend URL
            // (Database อาจเก็บ /uploads/slips/xxx.jpg หรือ uploads/slips/xxx.jpg)
            // เช็คว่าใน path มีคำว่า uploads ซ้ำไหม ถ้ามีให้ตัดออกตัวนึง
            if (cleanPath.startsWith('/uploads/') && BACKEND_URL.endsWith('/')) {
                 // กรณีกันพลาด (ไม่น่าเกิดถ้าวางระบบดี)
            }
            
            fullUrl = `${BACKEND_URL}${cleanPath}`;
        }
        
        console.log("Opening Slip URL:", fullUrl); // 👈 ดู Log ใน Console ได้เลยถ้ารูปไม่ขึ้น
        setViewSlipUrl(fullUrl);
        setIsViewSlipOpen(true);
    }
  };

  const handleSyncData = async () => {
    if (!confirm("⚠️ ต้องการ Sync ข้อมูลบัญชีกับสต็อกใหม่หรือไม่?")) return;
    try {
        await axios.post(`${BACKEND_URL}/api/transactions/fix-data`);
        alert("Sync Completed!");
        fetchTransactions();
    } catch (e) { alert("Sync Failed"); }
  };

  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Transactions") router.push("/reports");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar activeTab="Transactions" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Header & Filters (เหมือนเดิม) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Transaction History</h2>
            <p className="text-zinc-500">ตรวจสอบประวัติรายรับ-รายจ่ายย้อนหลัง</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-orange-600 border-orange-200" onClick={handleSyncData}>
                <Wrench className="w-4 h-4" /> Fix Data
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => window.open(`${BACKEND_URL}/api/transactions/export-pdf?${buildQueryParams().toString()}`, "_blank")}>
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <Tabs value={filterMode} onValueChange={setFilterMode} className="w-auto">
                <TabsList>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
             </Tabs>
             <div className="flex flex-wrap items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400 mr-1" />
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2 rounded-md border bg-zinc-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {filterMode !== "yearly" && (
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="p-2 rounded-md border bg-zinc-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("en-US", { month: "short" })}</option>
                    ))}
                  </select>
                )}
                {filterMode === "weekly" && (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                    <select value={selectedWeekIdx} onChange={(e) => setSelectedWeekIdx(Number(e.target.value))} className="p-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-sm min-w-[140px]">
                      {weeks.map((w, idx) => <option key={idx} value={idx}>{w.label}</option>)}
                    </select>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Search & Withdraw */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
            <div className="flex flex-1 gap-4 w-full">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input placeholder="Search category or description..." className="pl-9 bg-white dark:bg-zinc-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-900"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="ALL">All Transactions</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm whitespace-nowrap">
                        <PlusCircle className="w-4 h-4" /> เบิกเงิน / บันทึกรายจ่าย
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>บันทึกการเบิกจ่าย (Expense)</DialogTitle>
                    </DialogHeader>
                    {/* ... (Form Withdraw เหมือนเดิม) ... */}
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount</Label>
                            <Input type="number" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})} placeholder="0.00" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Category</Label>
                            <select className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={withdrawForm.category} onChange={(e) => setWithdrawForm({...withdrawForm, category: e.target.value})}>
                                <option value="Withdrawal">Withdrawal (เบิกเงินสด)</option>
                                <option value="Salary">Salary (เงินเดือน)</option>
                                <option value="Stock Purchase">Stock Purchase (ซื้อของ)</option>
                                <option value="Utility Bill">Utility Bill (ค่าน้ำ/ไฟ)</option>
                                <option value="Maintenance">Maintenance (ซ่อมแซม)</option>
                                <option value="Other">Other (อื่นๆ)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Detail</Label>
                            <Input value={withdrawForm.description} onChange={(e) => setWithdrawForm({...withdrawForm, description: e.target.value})} placeholder="รายละเอียด..." className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right mt-2">Slip</Label>
                            <div className="col-span-3">
                                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition" onClick={() => fileInputRef.current?.click()}>
                                    {previewUrl ? (
                                        <div className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded" />
                                            <button onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"><X className="w-3 h-3" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" /><p className="text-xs text-zinc-500">Upload Slip</p>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
                        <Button onClick={handleWithdrawSubmit} disabled={isUploading} className="bg-red-600 hover:bg-red-700">{isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Confirm"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800">
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Slip</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/> Loading...</TableCell></TableRow>
              ) : filteredTx.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">No data found.</TableCell></TableRow>
              ) : (
                filteredTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-zinc-500 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}<br/>
                      <span className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type === 'INCOME' ? <ArrowUpCircle className="w-3 h-3"/> : <ArrowDownCircle className="w-3 h-3"/>}{tx.type}
                      </span>
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">{tx.description || "-"}</TableCell>
                    <TableCell className="text-center">
                        {tx.slipImage ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleViewSlip(tx.slipImage!)} title="View Slip">
                                <Eye className="w-4 h-4" />
                            </Button>
                        ) : <span className="text-zinc-300">-</span>}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'EXPENSE' ? "-" : "+"}฿{Number(tx.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* 🔴 แก้ไข: View Slip Modal (เพิ่ม DialogHeader/Title แต่ซ่อนไว้) */}
      <Dialog open={isViewSlipOpen} onOpenChange={setIsViewSlipOpen}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-black/90 border-none">
              
              {/* ✅ เพิ่มส่วนนี้เพื่อแก้ Error Accessibility */}
              <DialogHeader className="sr-only"> 
                <DialogTitle>View Payment Slip</DialogTitle>
                <DialogDescription>Image preview of the transaction slip</DialogDescription>
              </DialogHeader>

              <div className="relative w-full h-[80vh] flex items-center justify-center">
                  {viewSlipUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={viewSlipUrl} 
                        alt="Payment Slip" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                            // ถ้าโหลดรูปไม่ขึ้น ให้แสดง placeholder หรือแจ้งเตือน
                            e.currentTarget.style.display = 'none';
                            alert(`ไม่สามารถโหลดรูปภาพได้: ${viewSlipUrl}`);
                        }}
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