import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProductCatalog } from '@/components/ProductCatalog';
import { OrderSummary } from '@/components/OrderSummary';
import { Product } from '@/components/ProductCard';
import { CartItemType } from '@/components/CartItem';
import { toast, Toaster } from 'sonner';

// Mock product data
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Spicy Pickled Shrimp',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1750680229991-726754d4d58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGljeSUyMHBpY2tsZWQlMjBzaHJpbXB8ZW58MXx8fHwxNzY5NTgxMjE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Zesty and tangy pickled shrimp with a spicy kick',
  },
  {
    id: '2',
    name: 'Fresh Shrimp Platter',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1758384075930-6e3835d22b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNocmltcCUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzY5NTgxMjE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Premium fresh shrimp served with signature sauce',
  },
  {
    id: '3',
    name: 'Grilled Shrimp Special',
    price: 21.99,
    image: 'https://images.unsplash.com/photo-1762631882900-e3174bada2ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwc2hyaW1wJTIwZGlzaHxlbnwxfHx8fDE3Njk1ODEyMTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Perfectly grilled shrimp with herbs and spices',
  },
  {
    id: '4',
    name: 'Shrimp Appetizer Combo',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1762631882592-25bc08678af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaHJpbXAlMjBhcHBldGl6ZXIlMjBwbGF0ZXxlbnwxfHx8fDE3Njk1MTA1NDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Assorted shrimp appetizers perfect for sharing',
  },
  {
    id: '5',
    name: 'Seafood Shrimp Bowl',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1759244566095-d6047dfde9c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWFmb29kJTIwc2hyaW1wJTIwYm93bHxlbnwxfHx8fDE3Njk1ODEyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Hearty bowl with fresh shrimp and vegetables',
  },
  {
    id: '6',
    name: 'Asian Shrimp Salad',
    price: 17.99,
    image: 'https://images.unsplash.com/photo-1665199020996-66cfdf8cba00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaHJpbXAlMjBzYWxhZCUyMGFzaWFufGVufDF8fHx8MTc2OTU4MTIyMHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Crisp salad with seasoned shrimp and Asian dressing',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('new-order');
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        toast.success(`Added another ${product.name}`);
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      toast.success(`${product.name} added to cart`);
      return [...prevItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      toast.info(`${item.name} removed from cart`);
    }
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = total * 0.08;
    const finalTotal = total + tax;
    
    toast.success(`Order placed! Total: $${finalTotal.toFixed(2)}`, {
      description: 'Thank you for your order!',
    });
    
    // Clear cart after checkout
    setTimeout(() => {
      setCartItems([]);
    }, 1500);
  };

  return (
    <div className="w-full h-screen bg-white overflow-hidden">
      <Toaster position="top-right" richColors />
      
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content - Responsive Split Layout */}
      <div className="w-full h-full flex flex-col md:flex-row" style={{ paddingTop: '72px' }}>
        {/* Left Section - Product Catalog (70% on desktop, full width on mobile) */}
        <div className="flex-1 md:w-[70%] border-b md:border-b-0 md:border-r border-gray-200 overflow-hidden">
          {activeTab === 'new-order' && (
            <ProductCatalog 
              products={PRODUCTS} 
              onAddToCart={handleAddToCart}
            />
          )}
          
          {activeTab === 'dashboard' && (
            <div className="h-full flex items-center justify-center p-8 md:p-12">
              <div className="text-center max-w-md">
                <div 
                  className="mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-6"
                  style={{ width: '80px', height: '80px' }}
                >
                  <span className="text-4xl">📊</span>
                </div>
                <h2 className="font-bold text-gray-900 mb-3" style={{ fontSize: '28px' }}>Dashboard</h2>
                <p className="text-gray-600" style={{ fontSize: '16px' }}>View your daily and monthly summaries</p>
              </div>
            </div>
          )}
          
          {activeTab === 'stock' && (
            <div className="h-full flex items-center justify-center p-8 md:p-12">
              <div className="text-center max-w-md">
                <div 
                  className="mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-6"
                  style={{ width: '80px', height: '80px' }}
                >
                  <span className="text-4xl">📋</span>
                </div>
                <h2 className="font-bold text-gray-900 mb-3" style={{ fontSize: '28px' }}>Stock</h2>
                <p className="text-gray-600" style={{ fontSize: '16px' }}>Manage your product catalog</p>
              </div>
            </div>
          )}
          
          {activeTab === 'order-history' && (
            <div className="h-full flex items-center justify-center p-8 md:p-12">
              <div className="text-center max-w-md">
                <div 
                  className="mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-6"
                  style={{ width: '80px', height: '80px' }}
                >
                  <span className="text-4xl">📜</span>
                </div>
                <h2 className="font-bold text-gray-900 mb-3" style={{ fontSize: '28px' }}>Order History</h2>
                <p className="text-gray-600" style={{ fontSize: '16px' }}>View past orders and transactions</p>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="h-full flex items-center justify-center p-8 md:p-12">
              <div className="text-center max-w-md">
                <div 
                  className="mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-6"
                  style={{ width: '80px', height: '80px' }}
                >
                  <span className="text-4xl">📈</span>
                </div>
                <h2 className="font-bold text-gray-900 mb-3" style={{ fontSize: '28px' }}>Reports</h2>
                <p className="text-gray-600" style={{ fontSize: '16px' }}>Access daily and monthly financial summaries</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Order Summary (30% on desktop, full width on mobile) */}
        <div className="flex-1 md:w-[30%] md:max-w-[480px] overflow-hidden">
          <OrderSummary
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
