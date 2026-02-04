"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  User,
  Menu,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new-order", label: "New Order", icon: ShoppingCart },
    { id: "stock", label: "Stock", icon: Package }, // ใช้ไอคอน Package สื่อถึงสต็อกสินค้า
    { id: "order-history", label: "Order History", icon: History },
    { id: "transactions", label: "Transactions", icon: BarChart3 },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 z-50 h-[72px]">
      <div className="h-full flex items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Left Section: Logo & Menu */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">🦐</span>
            </div>
            <span className="hidden sm:inline font-bold text-gray-900 text-lg">
              Pickled Shrimp
            </span>
          </div>

          {/* Desktop Menu Items */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // ✅ Logic การเช็ค: เทียบกับ Label โดยตรง เพื่อให้ตรงกับ Routing ที่เราทำไว้
              const isActive = activeTab === item.label;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.label)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Profile & Mobile Trigger */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button (Hamburger) - ซ่อนบนจอใหญ่ */}
          <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          {/* User Profile Button */}
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border border-gray-200">
            <User className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </nav>
  );
}
