"use client";
import React, { useState } from "react"; // 🟢 เพิ่ม useState
import { Product, ProductCard } from "./ProductCard";
import { Search } from "lucide-react";

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ products, onAddToCart }: ProductCatalogProps) {
  // 🟢 1. สร้าง State สำหรับเก็บคำค้นหา
  const [searchTerm, setSearchTerm] = useState("");

  // 🟢 2. กรองสินค้าตามชื่อที่พิมพ์ในช่อง Search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ padding: "24px" }}>
      {/* Search Bar */}
      <div style={{ marginBottom: "24px" }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm} // 🟢 3. ผูกค่ากับ State
            onChange={(e) => setSearchTerm(e.target.value)} // 🟢 4. อัปเดต State เมื่อพิมพ์
            className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            style={{
              paddingLeft: "48px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontSize: "16px",
              minHeight: "56px",
              borderRadius: "16px",
            }}
          />
        </div>
      </div>

      {/* Category Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          className="font-bold text-gray-900"
          style={{ fontSize: "32px", lineHeight: "40px" }}
        >
          Featured Menu
        </h2>
        <p
          className="text-gray-600"
          style={{ fontSize: "16px", marginTop: "8px", lineHeight: "24px" }}
        >
          Select items to add to your order
        </p>
      </div>

      {/* Product Grid */}
      <div className="w-full">
        {/* 🟢 5. เปลี่ยนจาก products.map เป็น filteredProducts.map เพื่อให้ผลการค้นหาแสดงผล */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {/* 🟢 6. แสดงข้อความเมื่อไม่พบสินค้าจากการค้นหา */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg italic">ไม่พบเมนูที่คุณค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
}