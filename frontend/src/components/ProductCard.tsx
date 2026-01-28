'use client';
import { Plus } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 group flex flex-col rounded-[16px] shadow-sm">
      {/* 🟢 ส่วนแสดงรูปภาพ */}
      <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 relative">
        <ImageWithFallback
          src={product.image} // URL จาก Backend
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="flex flex-col p-6 pt-4">
        <h3 className="font-bold text-gray-900 text-2xl mb-2">{product.name}</h3>
        <p className="font-semibold text-gray-700 text-base">฿{product.price.toFixed(2)}</p>
        
        <button
          onClick={() => onAddToCart(product)}
          className="w-full h-[48px] mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}