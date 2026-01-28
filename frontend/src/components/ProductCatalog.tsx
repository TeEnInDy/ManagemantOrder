'use client';
import { Product, ProductCard } from './ProductCard';
import { Search } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ products, onAddToCart }: ProductCatalogProps) {
  return (
    <div className="h-full flex flex-col" style={{ padding: '48px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '48px' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            style={{ 
              paddingLeft: '48px', 
              paddingRight: '24px', 
              paddingTop: '16px', 
              paddingBottom: '16px', 
              fontSize: '16px',
              minHeight: '56px',
              borderRadius: '16px',
            }}
          />
        </div>
      </div>

      {/* Category Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 className="font-bold text-gray-900" style={{ fontSize: '32px', lineHeight: '40px' }}>
          Featured Menu
        </h2>
        <p className="text-gray-600" style={{ fontSize: '16px', marginTop: '8px', lineHeight: '24px' }}>
          Select items to add to your order
        </p>
      </div>

      {/* Product Grid - Responsive (Desktop: 3-4 columns, iPad: 2-3 columns) */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto pb-6"
        style={{ gap: '24px' }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
