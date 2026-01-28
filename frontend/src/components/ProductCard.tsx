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
    <div 
      className="bg-white overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Image Section - Top (4:3 aspect ratio, no padding, fills width) */}
      <div 
        className="w-full overflow-hidden bg-gray-100 relative"
        style={{ 
          aspectRatio: '4 / 3',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      {/* Text & Price Area - Below Image */}
      {/* 24px vertical spacing from image, 24px horizontal padding, 16px bottom padding */}
      <div 
        className="flex flex-col"
        style={{ 
          paddingTop: '24px',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '16px',
        }}
      >
        {/* Menu Name - Prominent, bold, 24px */}
        <h3 
          className="font-bold text-gray-900"
          style={{ 
            fontSize: '24px',
            lineHeight: '32px',
            marginBottom: '8px',
          }}
        >
          {product.name}
        </h3>
        
        {/* Price - Secondary text, 16px */}
        <p 
          className="font-semibold text-gray-700"
          style={{ 
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          ${product.price.toFixed(2)}
        </p>
        
        {/* Action Button - 24px spacing from price, 48px height */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-98 touch-manipulation"
          style={{ 
            marginTop: '24px',
            height: '48px',
            fontSize: '16px',
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
