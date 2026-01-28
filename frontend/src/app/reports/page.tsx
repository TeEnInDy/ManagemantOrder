"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker"; // *ถ้ายังไม่มี component นี้ ใช้ div ธรรมดาแทนได้ครับ
import { Download, Calendar, CreditCard, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// --- 1. MOCK DATA ---

// ข้อมูลกราฟแท่ง (Revenue Trend)
const dailyData = [
  { name: 'Mon', total: 1500 },
  { name: 'Tue', total: 2300 },
  { name: 'Wed', total: 3400 },
  { name: 'Thu', total: 2900 },
  { name: 'Fri', total: 4500 },
  { name: 'Sat', total: 5100 },
  { name: 'Sun', total: 4800 },
];

const monthlyData = [
  { name: 'Jan', total: 45000 },
  { name: 'Feb', total: 52000 },
  { name: 'Mar', total: 48000 },
  { name: 'Apr', total: 61000 },
  { name: 'May', total: 55000 },
  { name: 'Jun', total: 67000 },
];

// ข้อมูลวงกลม (Payment Methods - สรุปยอดบัญชี)
const paymentData = [
  { name: 'Cash', value: 35000, color: '#22c55e' }, // สีเขียว
  { name: 'QR Transfer', value: 55000, color: '#3b82f6' }, // สีฟ้า
  { name: 'Credit Card', value: 15000, color: '#f59e0b' }, // สีส้ม
];

export default function ReportsPage() {
    const router = useRouter();
  const [reportType, setReportType] = useState("daily");
  const handleNavigation = (tab: string) => {
    if (tab === "New Order") router.push("/");
    else if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Order History") router.push("order-history");
    else if (tab === "Stock") router.push("/stock");
    else if (tab === "Reports") router.push("/reports");
  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar 
            activeTab="Reports"
            onTabChange={handleNavigation}
        />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reports & Analytics</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Overview of your business performance and financial status.
            </p>
          </div>
          <div className="flex items-center gap-2">
             {/* ปุ่มเลือกช่วงเวลา (Simulated) */}
            <Button variant="outline" className="hidden md:flex gap-2">
                <Calendar className="w-4 h-4" /> Last 30 Days
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* --- TABS SECTION (เลือกดู รายวัน / รายเดือน) --- */}
        <Tabs defaultValue="daily" className="space-y-4" onValueChange={setReportType}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            
            {/* 1. KEY METRICS (สรุปตัวเลขสำคัญ) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard 
                title="Total Revenue" 
                value="$24,560.00" 
                icon={DollarSign} 
                trend="+12% vs yesterday"
              />
              <SummaryCard 
                title="Total Orders" 
                value="345" 
                icon={TrendingUp} 
                trend="+5% vs yesterday"
              />
              <SummaryCard 
                title="Avg. Order Value" 
                value="$71.20" 
                icon={CreditCard} 
                trend="-2% vs yesterday"
              />
              <SummaryCard 
                title="Cash Received" 
                value="$8,120.00" 
                icon={DollarSign} 
                sub="Physical cash in drawer"
              />
            </div>

            {/* 2. MAIN CHARTS (กราฟและบัญชี) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              
              {/* Revenue Trend Chart (4/7 ส่วน) */}
              <Card className="col-span-4 shadow-sm">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue performance for the current week.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary / Payment Methods (3/7 ส่วน) */}
              <Card className="col-span-3 shadow-sm">
                <CardHeader>
                  <CardTitle>Payment Breakdown</CardTitle>
                  <CardDescription>Income by payment method (บัญชีรายรับ).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={paymentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     {/* Text ตรงกลาง Donut Chart */}
                     <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-bold">$105k</span>
                        <span className="text-xs text-zinc-500">Total</span>
                     </div>
                  </div>

                  {/* Legend ด้านล่าง */}
                  <div className="mt-4 space-y-3">
                    {paymentData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-zinc-600 dark:text-zinc-300">{item.name}</span>
                            </div>
                            <span className="font-bold">${item.value.toLocaleString()}</span>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* เนื้อหาสำหรับ Tabs อื่นๆ (Weekly, Monthly) สามารถ copy pattern ด้านบนไปใส่ได้ */}
          <TabsContent value="monthly">
            <div className="p-10 text-center text-zinc-500 bg-zinc-100 rounded-xl border border-dashed">
                Monthly Data Visualization will appear here (Similar to Daily)
            </div>
          </TabsContent>
           <TabsContent value="weekly">
            <div className="p-10 text-center text-zinc-500 bg-zinc-100 rounded-xl border border-dashed">
                Weekly Data Visualization will appear here
            </div>
          </TabsContent>
           <TabsContent value="yearly">
            <div className="p-10 text-center text-zinc-500 bg-zinc-100 rounded-xl border border-dashed">
                Yearly Data Visualization will appear here
            </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

// --- Helper Component ---
function SummaryCard({ title, value, icon: Icon, trend, sub }: any) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && <p className="text-xs text-zinc-500 mt-1">{trend}</p>}
                {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
            </CardContent>
        </Card>
    )
}