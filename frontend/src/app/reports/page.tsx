"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download,
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  Wallet,
  Loader2,
  ChevronRight,
  RefreshCcw,
  Wrench, // ใช้ icon นี้สื่อถึงการซ่อมแซมข้อมูล
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// --- TYPE DEFINITIONS ---
interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  distribution: {
    retainedEarnings: number;
    dividendPool: number;
    shares: {
      teen_50: number;
      pond_25: number;
      beam_25: number;
    };
  } | null;
}

export default function ReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filter State
  const [reportTab, setReportTab] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // 📅 Helper: Calculate Weeks in Month
  const getWeeksInMonth = (month: number, year: number) => {
    const weeks = [];
    const firstDate = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0);
    const currentStart = new Date(firstDate);

    while (currentStart <= lastDate) {
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      if (currentEnd > lastDate) currentEnd = new Date(lastDate);

      weeks.push({
        start: new Date(currentStart).toISOString().split("T")[0],
        end: new Date(currentEnd).toISOString().split("T")[0],
        label: `Week ${weeks.length + 1} (${currentStart.getDate()} - ${currentEnd.getDate()} ${new Date(0, month - 1).toLocaleString("en-US", { month: "short" })})`,
      });
      currentStart.setDate(currentStart.getDate() + 7);
    }
    return weeks;
  };

  const weeks = getWeeksInMonth(selectedMonth, selectedYear);

  // 🔄 Fetch Data Function
  const fetchReportData = useCallback(async () => {
    // ถ้าไม่ได้เป็นการ Auto-refresh (loading ยัง true) ให้เซ็ต error เป็น false ไว้ก่อน
    if(loading) setIsError(false);
    
    try {
      let params = new URLSearchParams();
      if (reportTab === "monthly") {
        params.append("month", selectedMonth.toString());
        params.append("year", selectedYear.toString());
      } else if (reportTab === "weekly") {
        const week = weeks[selectedWeekIdx];
        if (week) {
          params.append("startDate", week.start);
          params.append("endDate", week.end);
        }
      } else if (reportTab === "yearly") {
        params.append("year", selectedYear.toString());
      }

      // ยิงไปที่ Route กลาง (transactionRoutes)
      const res = await axios.get(`http://localhost:4000/api/transactions?${params.toString()}`);
      setSummary(res.data.summary);
      setIsError(false);
    } catch (error) {
      console.error("❌ Failed to fetch report:", error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [reportTab, selectedMonth, selectedYear, selectedWeekIdx, weeks]);

  // 🔥 Real-time Auto-Refresh Logic
  useEffect(() => {
    fetchReportData(); // โหลดครั้งแรก

    const interval = setInterval(() => {
      // Refresh เงียบๆ ทุก 5 วิ โดยใช้ params ชุดเดิม
      let params = new URLSearchParams();
      if (reportTab === "monthly") {
        params.append("month", selectedMonth.toString());
        params.append("year", selectedYear.toString());
      } else if (reportTab === "weekly") {
        const week = weeks[selectedWeekIdx];
        if (week) {
          params.append("startDate", week.start);
          params.append("endDate", week.end);
        }
      } else if (reportTab === "yearly") {
        params.append("year", selectedYear.toString());
      }

      axios.get(`http://localhost:4000/api/transactions?${params.toString()}`)
           .then(res => setSummary(res.data.summary))
           .catch(() => {});
    }, 5000); 

    return () => clearInterval(interval);
  }, [fetchReportData, reportTab, selectedMonth, selectedYear, weeks, selectedWeekIdx]);


  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };

  // 🖨️ Export PDF Function
  const handleExportPDF = () => {
    let params = new URLSearchParams();
    if (reportTab === "monthly") {
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());
    } else if (reportTab === "weekly") {
      const week = weeks[selectedWeekIdx];
      if (week) {
        params.append("startDate", week.start);
        params.append("endDate", week.end);
      }
    } else if (reportTab === "yearly") {
      params.append("year", selectedYear.toString());
    }
    // เปิดหน้าต่างใหม่เพื่อดาวน์โหลด PDF
    window.open(`http://localhost:4000/api/transactions/export-pdf?${params.toString()}`, "_blank");
  };

  // 🛠️ Function: Fix Data Sync (ซ่อมข้อมูล)
  const handleSyncData = async () => {
    if (!confirm("⚠️ คำเตือน: ระบบจะลบรายจ่ายเก่าทั้งหมดทิ้ง และคำนวณใหม่จากสต็อกที่มีอยู่จริง เพื่อให้ยอดเงินตรงกัน 100%\n\nยืนยันหรือไม่?")) return;
    
    try {
        setLoading(true);
        // ยิงไปที่ Route /fix-data ตามที่ตั้งไว้ใน Backend
        const res = await axios.post('http://localhost:4000/api/transactions/fix-data');
        alert(`✅ ${res.data.message}`);
        fetchReportData(); // โหลดข้อมูลใหม่ทันที
    } catch (error) {
        alert("❌ Sync Failed: ไม่สามารถเชื่อมต่อกับ Server ได้");
    } finally {
        setLoading(false);
    }
  };

  const paymentPieData = [
    { name: "Income", value: summary?.totalIncome || 0, color: "#22c55e" },
    { name: "Expense", value: summary?.totalExpense || 0, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar activeTab="Reports" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reports & Analytics</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Real-time overview of your business performance.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ปุ่ม Sync Data */}
             <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncData} 
                className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2"
                title="กดปุ่มนี้เมื่อยอดเงินไม่ตรงกับสต็อกจริง"
             >
                <Wrench className="w-4 h-4"/> Fix Data
             </Button>

            <Button variant="outline" onClick={fetchReportData} className="gap-2">
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <Tabs defaultValue="monthly" onValueChange={setReportTab} className="w-full">
            <TabsList className="bg-white dark:bg-zinc-900 border">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2 rounded-lg border bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {reportTab !== "yearly" && (
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="p-2 rounded-lg border bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("en-US", { month: "long" })}</option>
                ))}
              </select>
            )}

            {reportTab === "weekly" && (
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-zinc-300" />
                <select value={selectedWeekIdx} onChange={(e) => setSelectedWeekIdx(Number(e.target.value))} className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-700 outline-none focus:ring-2 focus:ring-blue-500">
                  {weeks.map((w, idx) => <option key={idx} value={idx}>{w.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && !summary ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin mb-2 text-blue-500" />
            <p>Loading financial data...</p>
          </div>
        ) : isError ? (
          <div className="h-64 flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-xl border border-red-100">
            <p className="font-bold">Unable to load report data.</p>
            <p className="text-sm text-red-400 mt-1">Check if the backend server is running.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchReportData}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard title="Total Income" value={`฿${summary?.totalIncome.toLocaleString()}`} icon={DollarSign} color="text-green-600" trend="รายรับรวมทั้งหมด" />
              <SummaryCard title="Total Expense" value={`฿${summary?.totalExpense.toLocaleString()}`} icon={CreditCard} color="text-red-600" trend="ต้นทุนสินค้าในสต็อก" />
              <SummaryCard title="Net Profit" value={`฿${summary?.netProfit.toLocaleString()}`} icon={TrendingUp} color={summary?.netProfit && summary.netProfit >= 0 ? "text-blue-600" : "text-red-600"} trend="กำไรสุทธิ (Income - Expense)" />
              <SummaryCard title="Shop Fund (50%)" value={`฿${summary?.distribution?.retainedEarnings.toLocaleString() || 0}`} icon={Wallet} sub="เงินหมุนเวียนเข้าร้าน" />
            </div>

            {/* Dividend Card */}
            <Card className="border-blue-100 shadow-md overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-zinc-900">
              <CardHeader className="border-b border-blue-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Dividend Distribution (เงินปันผล)</CardTitle>
                    <CardDescription>คำนวณจาก 50% ของกำไรสุทธิ</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <PartnerCard name="Teen" share="50%" amount={summary?.distribution?.shares.teen_50 || 0} color="bg-blue-600" />
                  <PartnerCard name="Pond" share="25%" amount={summary?.distribution?.shares.pond_25 || 0} color="bg-cyan-500" />
                  <PartnerCard name="Beam" share="25%" amount={summary?.distribution?.shares.beam_25 || 0} color="bg-indigo-500" />
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 shadow-sm border-zinc-200 dark:border-zinc-800">
                <CardHeader><CardTitle>Income Statement</CardTitle></CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Income", amount: summary?.totalIncome, fill: "#22c55e" },
                      { name: "Expense", amount: summary?.totalExpense, fill: "#ef4444" },
                      { name: "Profit", amount: summary?.netProfit, fill: "#3b82f6" },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `฿${val}`} tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val: number) => `฿${val.toLocaleString()}`} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3 shadow-sm border-zinc-200 dark:border-zinc-800">
                <CardHeader><CardTitle>Financial Ratio</CardTitle></CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={paymentPieData} 
                        innerRadius={80} 
                        outerRadius={110} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {paymentPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(val: number) => `฿${val.toLocaleString()}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      {/* Center Text */}
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-zinc-900 dark:fill-white font-bold text-xl">
                        {(summary?.totalIncome || 0) > (summary?.totalExpense || 0) ? "Profit" : "Loss"}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
function SummaryCard({ title, value, icon: Icon, trend, sub, color }: any) {
  return (
    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color ? color.replace('text-', 'bg-').replace('600', '100') : 'bg-zinc-100'}`}>
            <Icon className={`h-4 w-4 ${color || "text-zinc-500"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || "text-zinc-900 dark:text-zinc-100"}`}>{value}</div>
        {trend && <p className="text-[11px] text-zinc-500 mt-1 font-medium">{trend}</p>}
        {sub && <p className="text-[11px] text-zinc-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PartnerCard({ name, share, amount, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-zinc-100 bg-white dark:bg-zinc-800 dark:border-zinc-700 flex items-center justify-between shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${color}`}>
            {name[0]}
        </div>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-100">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
             <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-500 font-medium">Share {share}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${amount > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}>
            ฿{Math.round(amount).toLocaleString()}
        </p>
        <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Dividend</p>
      </div>
    </div>
  );
}