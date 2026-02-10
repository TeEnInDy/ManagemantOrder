"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
// ❌ ลบ import axios เดิม
// ✅ import api จากไฟล์ที่เราสร้างไว้
import { api } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Wallet,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch Data (ดึงเฉพาะ Summary มาแสดง)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // สร้าง Query Params
      const params = new URLSearchParams();
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());

      // ✅ ใช้ api.get แทน axios.get (ตัด URL ออกเหลือแค่ endpoint)
      const res = await api.get(`/transactions?${params.toString()}`);

      // แปลงข้อมูลตาม Type
      setSummary((res.data as any).summary);

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
    const routes: Record<string, string> = {
      "New Order": "/",
      Dashboard: "/dashboard",
      "Order History": "/order-history",
      Stock: "/stock",
      Transactions: "/reports",
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  // เตรียมข้อมูลสำหรับกราฟ
  const chartData = [
    { name: "Income", amount: summary?.totalIncome || 0, fill: "#22c55e" },
    { name: "Expense", amount: summary?.totalExpense || 0, fill: "#ef4444" },
    { name: "Profit", amount: summary?.netProfit || 0, fill: "#3b82f6" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b shadow-sm">
        <Navbar activeTab="Dashboard" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Executive Dashboard
            </h2>
            <p className="text-zinc-500">ภาพรวมสถานะการเงินของร้าน</p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm outline-none font-medium cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm outline-none font-medium cursor-pointer"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              onClick={fetchDashboardData}
              className="h-8 w-8 ml-1"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p>Loading financial data...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Income"
                value={`฿${summary?.totalIncome.toLocaleString()}`}
                icon={DollarSign}
                color="text-green-600"
              />
              <SummaryCard
                title="Total Expense"
                value={`฿${summary?.totalExpense.toLocaleString()}`}
                icon={CreditCard}
                color="text-red-600"
              />
              <SummaryCard
                title="Net Profit"
                value={`฿${summary?.netProfit.toLocaleString()}`}
                icon={TrendingUp}
                color={
                  (summary?.netProfit || 0) >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                }
              />
              <SummaryCard
                title="Shop Fund (50%)"
                value={`฿${(
                  summary?.distribution?.retainedEarnings || 0
                ).toLocaleString()}`}
                icon={Wallet}
                color="text-orange-600"
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-7">
              {/* Bar Chart */}
              <Card className="col-span-1 md:col-span-4 shadow-md border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle>Income vs Expense Analysis</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis
                        tickFormatter={(val) => `฿${val}`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip
                        formatter={(val: number) => `฿${val.toLocaleString()}`}
                        cursor={{ fill: "transparent" }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[6, 6, 0, 0]}
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Profit Distribution */}
              <div className="col-span-1 md:col-span-3 space-y-4">
                <Card className="h-full shadow-md border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle>Profit Distribution (Dividend)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6 mt-2">
                      <PartnerRow
                        name="Teen (50%)"
                        amount={summary?.distribution?.shares.teen_50}
                        color="bg-blue-500"
                      />
                      <PartnerRow
                        name="Pond (25%)"
                        amount={summary?.distribution?.shares.pond_25}
                        color="bg-cyan-500"
                      />
                      <PartnerRow
                        name="Beam (25%)"
                        amount={summary?.distribution?.shares.beam_25}
                        color="bg-indigo-500"
                      />
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

// Components ช่วยแสดงผล (ย่อย)
function SummaryCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {title}
        </CardTitle>
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full shadow-sm ${color}`} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {name}
        </span>
      </div>
      <span className="font-bold text-zinc-900 dark:text-zinc-100">
        ฿{(amount || 0).toLocaleString()}
      </span>
    </div>
  );
}