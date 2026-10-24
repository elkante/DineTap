import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  ListOrdered, 
  ShoppingBag, 
  PhoneCall,
  Sparkles
} from 'lucide-react';

export const TopNav: React.FC<{ 
  onOpenCart: () => void; 
  onOpenWaiterModal: () => void 
}> = ({ onOpenCart, onOpenWaiterModal }) => {
  const { 
    currentView, 
    setCurrentView, 
    activeRestaurant, 
    currentTable, 
    cart, 
    waiterCalls,
  } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 no-print">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Restaurant Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setCurrentView('flipbook')}
            className="flex items-center gap-2 group text-left focus:outline-none min-w-0"
          >
            {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
              <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shrink-0 border border-neutral-200" />
            ) : (
              <span className="text-xl sm:text-2xl shrink-0 p-1 bg-neutral-100 rounded-lg">
                {activeRestaurant.logo || '🍽️'}
              </span>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-neutral-900 block truncate group-hover:text-amber-800 transition-colors">
                {activeRestaurant.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium block truncate -mt-0.5">
                Digital Menu Book
              </span>
            </div>
          </button>

          {/* Table Badge */}
          {currentTable && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-lg text-[11px] sm:text-xs font-mono font-bold text-amber-950 shrink-0 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              <span>{currentTable}</span>
            </div>
          )}
        </div>

        {/* Zone 2: View Switcher (Flipbook vs List) & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle Pill (Flipbook / List) */}
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-xl border border-neutral-200/60">
            <button
              onClick={() => setCurrentView('flipbook')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                currentView === 'flipbook'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Interactive 3D Flipbook"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xs:inline">Flipbook</span>
            </button>
            <button
              onClick={() => setCurrentView('quick_menu')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                currentView === 'quick_menu'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Quick Searchable List"
            >
              <ListOrdered className="w-3.5 h-3.5 text-neutral-700" />
              <span className="hidden xs:inline">List</span>
            </button>
          </div>

          {/* Waiter Buzzer Button */}
          <button
            onClick={onOpenWaiterModal}
            className="relative p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
            title="Call Waiter / Request Bill"
          >
            <PhoneCall className="w-4 h-4 text-amber-600" />
            {waiterCalls.filter(c => c.tableNumber === currentTable).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Order</span>
            {totalCartCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-mono text-[10px] font-black rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
