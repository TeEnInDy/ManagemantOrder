"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  CreditCard, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Wallet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- MOCK DATA (จำลองข้อมูลสำหรับ รายวัน/รายเดือน/รายปี) ---

const DATA_SETS = {
  daily: {
    kpi: { revenue: 12500, expense: 4500, items: 85, profit: 8000 },
    chart: [
      { name: '10:00', revenue: 500, expense: 200 },
      { name: '12:00', revenue: 2400, expense: 800 },
      { name: '14:00', revenue: 1800, expense: 600 },
      { name: '16:00', revenue: 3200, expense: 1200 },
      { name: '18:00', revenue: 2900, expense: 1000 },
      { name: '20:00', revenue: 1700, expense: 700 },
    ]
  },
  monthly: {
    kpi: { revenue: 452000, expense: 180000, items: 3450, profit: 272000 },
    chart: [
      { name: 'Week 1', revenue: 95000, expense: 40000 },
      { name: 'Week 2', revenue: 112000, expense: 45000 },
      { name: 'Week 3', revenue: 108000, expense: 42000 },
      { name: 'Week 4', revenue: 137000, expense: 53000 },
    ]
  },
  yearly: {
    kpi: { revenue: 5400000, expense: 2100000, items: 45200, profit: 3300000 },
    chart: [
      { name: 'Jan', revenue: 400000, expense: 150000 },
      { name: 'Mar', revenue: 450000, expense: 180000 },
      { name: 'Jun', revenue: 520000, expense: 200000 },
      { name: 'Sep', revenue: 480000, expense: 190000 },
      { name: 'Dec', revenue: 600000, expense: 250000 },
    ]
  }
};

const recentSales = [
  { name: "Somchai (Table 5)", time: "Just now", amount: "+฿1,290", type: "Dine-in" },
  { name: "Alice (Order #22)", time: "5 min ago", amount: "+฿450", type: "Takeaway" },
  { name: "John Doe (Delivery)", time: "12 min ago", amount: "+฿890", type: "Delivery" },
  { name: "Table 12", time: "25 min ago", amount: "+฿2,100", type: "Dine-in" },
  { name: "Walk-in Customer", time: "40 min ago", amount: "+฿150", type: "Takeaway" },
];

export default function DashboardPage() {
    const router = useRouter();
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  
  // ดึงข้อมูลตาม Tab ที่เลือก
  const currentData = DATA_SETS[period];
  const handleNavigation = (tab: string) => {
    switch (tab) {
      case "New Order":
        router.push("/"); // กลับหน้าแรก
        break;
      case "Order History":
        router.push("order-history");
        break;
      case "Reports":
        router.push("/reports");
        break;
      case "Dashboard":
        router.push("/dashboard");
        break;
        case "stock":
            router.push("/stock");
            break;
      default:
        console.log("Unknown tab:", tab);
    }
  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="sticky top-0 z-50">
        <Navbar 
            activeTab="Dashboard" 
            onTabChange={handleNavigation}
        />
      </div>

      <main className="container mx-auto p-6 md:p-8 space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard Overview</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Summary of your restaurant's performance.
            </p>
          </div>
          
          {/* Tabs สำหรับเลือกช่วงเวลา */}
          <Tabs defaultValue="daily" className="w-full md:w-auto" onValueChange={(val) => setPeriod(val as any)}>
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="daily">Today</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* --- KPI CARDS (แสดงผลตามช่วงเวลาที่เลือก) --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. รายรับทั้งหมด */}
          <KpiCard 
            title="Total Revenue" 
            value={`฿${currentData.kpi.revenue.toLocaleString()}`} 
            icon={DollarSign}
            description="Income from all sources"
            trend="up"
          />
          
          {/* 2. รายจ่ายทั้งหมด */}
          <KpiCard 
            title="Total Expenses" 
            value={`฿${currentData.kpi.expense.toLocaleString()}`} 
            icon={CreditCard}
            description="Cost of goods & operations"
            trend="down"
            color="text-red-600"
          />

           {/* 3. กำไรสุทธิ (รายรับ - รายจ่าย) */}
           <KpiCard 
            title="Net Profit" 
            value={`฿${currentData.kpi.profit.toLocaleString()}`} 
            icon={Wallet}
            description="Earnings after expenses"
            trend="up"
            color="text-green-600"
          />

          {/* 4. ขายไปกี่อย่าง (จำนวนสินค้า) */}
          <KpiCard 
            title="Total Items Sold" 
            value={currentData.kpi.items.toLocaleString()} 
            icon={Package}
            description="Dishes & drinks served"
            trend="up"
          />
        </div>

        {/* --- MAIN CHART & ACTIVITY --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Revenue vs Expenses Chart (4/7) */}
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Comparing Revenue vs Expenses ({period})
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData.chart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value/1000}k`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`฿${value.toLocaleString()}`, '']}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    {/* เส้นรายรับ */}
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" fillOpacity={1} fill="url(#colorRev)" />
                    {/* เส้นรายจ่าย */}
                    <Area type="monotone" dataKey="expense" name="Expenses" stroke="#DC2626" fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales List (3/7) */}
          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentSales.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9 bg-blue-100 flex items-center justify-center">
                        {/* ใช้ Initial ตัวแรก */}
                       <span className="text-blue-700 font-bold">{item.name[0]}</span>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.time} • {item.type}</p>
                    </div>
                    <div className="ml-auto font-medium text-green-600">{item.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}

// --- KPI Card Component ---
function KpiCard({ title, value, icon: Icon, description, trend, color }: any) {
  return (
    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color || "text-zinc-500"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || "text-zinc-900 dark:text-zinc-50"}`}>
            {value}
        </div>
        <div className="flex items-center text-xs mt-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500 mr-1" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500 mr-1" />}
            <span className="text-zinc-500">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}