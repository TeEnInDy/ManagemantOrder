import { Minus, Plus, Trash2 } from 'lucide-react';

export interface CartItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div
      className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm"
      style={{ padding: '16px', borderRadius: '16px' }}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate" style={{ fontSize: '16px', lineHeight: '24px' }}>
          {item.name}
        </h4>
        <p className="font-semibold" style={{ fontSize: '16px', marginTop: '4px', color: '#2563eb' }}>
          ${item.price.toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors touch-manipulation"
          style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', borderRadius: '8px' }}
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <span className="w-10 text-center font-semibold text-gray-900" style={{ fontSize: '16px' }}>
          {item.quantity}
        </span>
        
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="flex items-center justify-center text-white transition-colors active:scale-95 touch-manipulation"
          style={{ 
            width: '40px', 
            height: '40px', 
            minWidth: '40px', 
            minHeight: '40px',
            borderRadius: '8px',
            background: '#2563eb',
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors touch-manipulation"
        style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', borderRadius: '8px' }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
