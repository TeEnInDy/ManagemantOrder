"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
// ✅ ใช้ api จาก lib/axios
import { api } from "@/lib/axios";
import { Navbar } from "@/components/Navbar";
import {
  Calendar as CalendarIcon,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Loader2,
  FileText
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// --- TYPE DEFINITIONS ---
interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description?: string;
  date: string; // ISO String
  referenceId?: string; // Order ID
}

interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary>({ totalIncome: 0, totalExpense: 0, netProfit: 0, transactionCount: 0 });

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  // 🔄 1. Fetch Transactions
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      // สร้าง Query Params
      const params = new URLSearchParams();
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());

      // ✅ ใช้ api.get แทน
      // สมมติว่า Backend มี endpoint /reports หรือ /transactions ที่รับ filter ได้
      const res = await api.get(`/transactions?${params.toString()}`);


      // จัดการข้อมูล (ถ้า Backend ส่งมาเป็น { transactions: [], summary: {} })
      const data = res.data as any;
      if (data.transactions) {
        setTransactions(data.transactions);
        // ถ้า Backend ส่ง summary มาด้วยก็ใช้เลย ถ้าไม่ก็คำนวณเองหน้าบ้าน
        if (data.summary) {
          setSummary(data.summary);
        } else {
          calculateSummary(data.transactions);
        }
      } else {
        // Fallback กรณีส่งมาเป็น Array ตรงๆ
        setTransactions(Array.isArray(data) ? data : []);
        calculateSummary(Array.isArray(data) ? data : []);
      }

    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Helper: คำนวณสรุปยอด (กรณี Backend ไม่ส่งมา)
  const calculateSummary = (data: Transaction[]) => {
    const income = data.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = data.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
    setSummary({
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      transactionCount: data.length
    });
  };

  // 📤 2. Export CSV Function
  const handleExportCSV = () => {
    const headers = ["ID,Date,Type,Category,Description,Amount"];
    const rows = transactions.map(t =>
      `${t.id},${new Date(t.date).toLocaleDateString()},${t.type},${t.category},"${t.description || ''}",${t.amount}`
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic Frontend
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b shadow-sm">
        <Navbar
          activeTab="Transactions"
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
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Transaction Reports</h1>
            <p className="text-zinc-500">ประวัติรายรับ-รายจ่ายประจำเดือน</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm">
              <CalendarIcon className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm outline-none font-medium cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm outline-none font-medium cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Income</CardTitle>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">฿{summary.totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Expense</CardTitle>
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">฿{summary.totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Net Profit</CardTitle>
              <FileText className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ฿{summary.netProfit.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search category or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-10 px-3 rounded-md border border-input bg-white text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income Only</option>
                <option value="EXPENSE">Expense Only</option>
              </select>
            </div>
          </div>

          {/* Table Area */}
          <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800 border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading data...
                        </div>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {new Date(t.date).toLocaleDateString('en-GB')}
                          <div className="text-xs text-zinc-500">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={t.type === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                            {t.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{t.category}</td>
                        <td className="px-6 py-4 text-zinc-500 truncate max-w-[200px]">{t.description || "-"}</td>
                        <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}