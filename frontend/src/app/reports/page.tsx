"use client";

import React, { useState, useEffect } from "react";
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

  // 🟢 State สำหรับ Filter
  const [reportTab, setReportTab] = useState("monthly"); // "monthly" | "weekly" | "yearly"
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // 📅 ฟังก์ชันหาช่วงวันที่ของแต่ละสัปดาห์ในเดือน
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
        label: `สัปดาห์ที่ ${
          weeks.length + 1
        } (${currentStart.getDate()} - ${currentEnd.getDate()} ${new Date(
          0,
          month - 1
        ).toLocaleString("th-TH", { month: "short" })})`,
      });
      currentStart.setDate(currentStart.getDate() + 7);
    }
    return weeks;
  };

  const weeks = getWeeksInMonth(selectedMonth, selectedYear);

  // 🔄 ดึงข้อมูลจาก Backend
  const fetchReportData = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:4000/api/transactions?year=${selectedYear}`;

      if (reportTab === "monthly") {
        url += `&month=${selectedMonth}`;
      } else if (reportTab === "weekly") {
        const week = weeks[selectedWeekIdx];
        url += `&startDate=${week.start}&endDate=${week.end}`;
      }
      // ถ้าเป็น yearly จะส่งแค่ year ไป (Backend รองรับอยู่แล้ว)

      const res = await axios.get(url);
      setSummary(res.data.summary);
    } catch (error) {
      console.error("❌ Failed to fetch financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear, reportTab, selectedWeekIdx]);

  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("/order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };
  const handleExportPDF = () => {
    // สร้าง URL พื้นฐาน
    let url = `http://localhost:4000/api/transactions/export-pdf?year=${selectedYear}`;

    // เพิ่มเงื่อนไขตาม Tab ที่เลือกดูอยู่จริง
    if (reportTab === "monthly") {
      url += `&month=${selectedMonth}`;
    } else if (reportTab === "weekly") {
      const week = weeks[selectedWeekIdx];
      url += `&startDate=${week.start}&endDate=${week.end}`;
    }

    // เปิดหน้าต่างใหม่เพื่อดาวน์โหลดไฟล์ PDF จาก API
    window.open(url, "_blank");
  };
  // Mock data สำหรับกราฟวงกลม
  const paymentPieData = [
    { name: "Cash", value: 35000, color: "#22c55e" },
    { name: "QR Transfer", value: 55000, color: "#3b82f6" },
    { name: "Credit Card", value: 15000, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar activeTab="Reports" onTabChange={handleNavigation} />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Reports & Analytics
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Overview of your business performance and profit sharing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Export PDF Report
            </Button>
          </div>
        </div>

        {/* --- 🟢 TAB & FILTER UI แบบเดิม --- */}
        <div className="space-y-4">
          <Tabs
            defaultValue="monthly"
            onValueChange={setReportTab}
            className="w-full"
          >
            <TabsList className="bg-white dark:bg-zinc-900 border">
              <TabsTrigger value="weekly">Daily / Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium">ระบุเวลา:</span>
            </div>

            {/* เลือกปี/เดือน (แสดงตลอด ยกเว้น Yearly อาจจะซ่อนเดือน) */}
            {reportTab !== "yearly" && (
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setSelectedWeekIdx(0);
                }}
                className="p-2 rounded-lg border bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("th-TH", { month: "long" })}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedWeekIdx(0);
              }}
              className="p-2 rounded-lg border bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>

            {/* แสดงเฉพาะเมื่อเลือกรายสัปดาห์ */}
            {reportTab === "weekly" && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <ChevronRight className="w-4 h-4 text-zinc-300" />
                <select
                  value={selectedWeekIdx}
                  onChange={(e) => setSelectedWeekIdx(Number(e.target.value))}
                  className="p-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-sm outline-none text-blue-700 dark:text-blue-300"
                >
                  {weeks.map((w, idx) => (
                    <option key={idx} value={idx}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin mb-2" />
            <p>กำลังประมวลผลข้อมูลทางบัญชี...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* --- 1. KEY METRICS --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="รายได้ทั้งหมด"
                value={`฿${summary?.totalIncome.toLocaleString()}`}
                icon={DollarSign}
                trend="+12% จากช่วงก่อนหน้า"
              />
              <SummaryCard
                title="ค่าใช้จ่ายสะสม"
                value={`฿${summary?.totalExpense.toLocaleString()}`}
                icon={CreditCard}
                trend="รวมต้นทุนวัตถุดิบ"
              />
              <SummaryCard
                title="กำไรสุทธิ"
                value={`฿${summary?.netProfit.toLocaleString()}`}
                icon={TrendingUp}
                color="text-blue-600"
              />
              <SummaryCard
                title="เงินกองทุนร้าน (50%)"
                value={`฿${
                  summary?.distribution?.retainedEarnings.toLocaleString() || 0
                }`}
                icon={Wallet}
                sub="เงินหมุนเวียนส่วนกลาง"
              />
            </div>

            {/* --- 2. PROFIT SHARING CARD (หุ้นส่วน 3 คน) --- */}
            <Card className="border-blue-100 dark:border-blue-900 shadow-md bg-white dark:bg-zinc-900 overflow-hidden">
              <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle>
                    Dividend Distribution (ส่วนแบ่งปันผลหุ้นส่วน)
                  </CardTitle>
                </div>
                <CardDescription>
                  คำนวณจาก 50% ของกำไรสุทธิ เพื่อแบ่งตามสัดส่วน Teen 50% | Pond
                  25% | Beam 25%
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <PartnerCard
                    name="Teen"
                    share="50%"
                    amount={summary?.distribution?.shares.teen_50 || 0}
                    color="bg-blue-600"
                  />
                  <PartnerCard
                    name="Pond"
                    share="25%"
                    amount={summary?.distribution?.shares.pond_25 || 0}
                    color="bg-cyan-500"
                  />
                  <PartnerCard
                    name="Beam"
                    share="25%"
                    amount={summary?.distribution?.shares.beam_25 || 0}
                    color="bg-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* --- 3. CHARTS SECTION --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 shadow-sm">
                <CardHeader>
                  <CardTitle>Financial Comparison</CardTitle>
                  <CardDescription>
                    รายรับ | รายจ่าย | กำไร ในช่วงเวลาที่เลือก
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "รายรับ", total: summary?.totalIncome },
                        { name: "รายจ่าย", total: summary?.totalExpense },
                        { name: "กำไร", total: summary?.netProfit },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `฿${val}`} />
                      <Tooltip
                        formatter={(val: number) => `฿${val.toLocaleString()}`}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={60}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#2563EB" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3 shadow-sm">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>สัดส่วนช่องทางการชำระเงิน</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col justify-center">
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentPieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {paymentPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-xl font-bold">100%</span>
                      <span className="text-[10px] text-zinc-500">Revenue</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {paymentPieData.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold">
                          ฿{item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Helper Components ---
function SummaryCard({ title, value, icon: Icon, trend, sub, color }: any) {
  return (
    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
        {trend && (
          <p className="text-[10px] text-green-600 mt-1 font-medium">{trend}</p>
        )}
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PartnerCard({ name, share, amount, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${color}`}
        >
          {name[0]}
        </div>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-100">{name}</p>
          <p className="text-[10px] text-zinc-500 text-left">
            สัดส่วน: {share}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-blue-600">
          ฿{Math.round(amount).toLocaleString()}
        </p>
        <p className="text-[9px] text-zinc-400 uppercase tracking-wider text-right">
          Dividend
        </p>
      </div>
    </div>
  );
}
