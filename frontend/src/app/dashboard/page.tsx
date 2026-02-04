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
  Wrench,
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

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportTab, setReportTab] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch Data (ดึงเฉพาะ Summary มาแสดง)
  const fetchDashboardData = useCallback(async () => {
    try {
      let params = new URLSearchParams();
      // Dashboard เน้นดูภาพรวมรายเดือนเป็นหลัก
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());

      const res = await axios.get(`http://localhost:4000/api/transactions?${params.toString()}`);
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports"); // Reports ตอนนี้คือ Transaction
  };

  const paymentPieData = [
    { name: "Income", value: summary?.totalIncome || 0, color: "#22c55e" },
    { name: "Expense", value: summary?.totalExpense || 0, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar activeTab="Dashboard" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Executive Dashboard</h2>
            <p className="text-zinc-500">ภาพรวมสถานะการเงินของร้าน</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm">
             <Calendar className="w-4 h-4 text-zinc-400" />
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(Number(e.target.value))} 
               className="bg-transparent text-sm outline-none font-medium"
             >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("en-US", { month: "long" })}</option>
                ))}
             </select>
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(Number(e.target.value))} 
               className="bg-transparent text-sm outline-none font-medium"
             >
               {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
             </select>
             <Button size="icon" variant="ghost" onClick={fetchDashboardData}>
               <RefreshCcw className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard title="Total Income" value={`฿${summary?.totalIncome.toLocaleString()}`} icon={DollarSign} color="text-green-600" />
              <SummaryCard title="Total Expense" value={`฿${summary?.totalExpense.toLocaleString()}`} icon={CreditCard} color="text-red-600" />
              <SummaryCard title="Net Profit" value={`฿${summary?.netProfit.toLocaleString()}`} icon={TrendingUp} color={summary?.netProfit! >= 0 ? "text-blue-600" : "text-red-600"} />
              <SummaryCard title="Shop Fund (50%)" value={`฿${summary?.distribution?.retainedEarnings.toLocaleString() || 0}`} icon={Wallet} color="text-orange-600" />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-7">
              {/* Bar Chart */}
              <Card className="col-span-4">
                <CardHeader><CardTitle>Income vs Expense</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Income", amount: summary?.totalIncome, fill: "#22c55e" },
                      { name: "Expense", amount: summary?.totalExpense, fill: "#ef4444" },
                      { name: "Profit", amount: summary?.netProfit, fill: "#3b82f6" },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `฿${val}`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: number) => `฿${val.toLocaleString()}`} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart & Partners */}
              <div className="col-span-3 space-y-4">
                 <Card className="h-full">
                    <CardHeader><CardTitle>Profit Distribution</CardTitle></CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                          <PartnerRow name="Teen (50%)" amount={summary?.distribution?.shares.teen_50} color="bg-blue-500" />
                          <PartnerRow name="Pond (25%)" amount={summary?.distribution?.shares.pond_25} color="bg-cyan-500" />
                          <PartnerRow name="Beam (25%)" amount={summary?.distribution?.shares.beam_25} color="bg-indigo-500" />
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Components ช่วยแสดงผล
function SummaryCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function PartnerRow({ name, amount, color }: any) {
    return (
        <div className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800">
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm font-medium">{name}</span>
            </div>
            <span className="font-bold text-green-600">฿{(amount || 0).toLocaleString()}</span>
        </div>
    )
}