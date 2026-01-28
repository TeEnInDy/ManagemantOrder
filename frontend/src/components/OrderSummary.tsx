import { CartItem, CartItemType } from './CartItem';
import { Tag, CreditCard } from 'lucide-react';

interface OrderSummaryProps {
  items: CartItemType[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function OrderSummary({ items, onUpdateQuantity, onRemove, onCheckout }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal - discount + tax;

  return (
    <div className="h-full flex flex-col bg-gray-50" style={{ padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h2 className="font-bold text-gray-900" style={{ fontSize: '32px', lineHeight: '40px' }}>
          Current Order
        </h2>
        <p className="text-gray-600" style={{ fontSize: '16px', marginTop: '8px', lineHeight: '24px' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ marginBottom: '24px' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="rounded-full bg-gray-200 flex items-center justify-center" 
              style={{ width: '80px', height: '80px', marginBottom: '16px' }}
            >
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium" style={{ fontSize: '16px' }}>
              No items in cart
            </p>
            <p className="text-gray-400" style={{ fontSize: '14px', marginTop: '8px' }}>
              Add products to start an order
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Discount Input */}
      {items.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Discount code"
              className="w-full bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{ 
                paddingLeft: '48px', 
                paddingRight: '16px', 
                paddingTop: '14px', 
                paddingBottom: '14px', 
                fontSize: '14px',
                minHeight: '52px'
              }}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 shadow-sm" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600" style={{ fontSize: '16px' }}>
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600" style={{ fontSize: '16px' }}>
                <span>Discount</span>
                <span className="font-medium">-${discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600" style={{ fontSize: '16px' }}>
                <span>Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              
              <div className="h-px bg-gray-200" style={{ margin: '16px 0' }}></div>
              
              <div className="flex justify-between text-gray-900" style={{ fontSize: '24px' }}>
                <span className="font-bold">Total</span>
                <span className="font-bold" style={{ color: '#2563eb' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="w-full text-white font-semibold transition-all shadow-lg hover:shadow-xl active:scale-98 touch-manipulation"
            style={{ 
              padding: '16px 24px', 
              fontSize: '16px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            }}
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
