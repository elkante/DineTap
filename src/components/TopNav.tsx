import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  ListOrdered, 
  ShoppingBag, 
  Settings,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { OwnerHubModal } from './OwnerHubModal';

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
    isNfcSource 
  } = useApp();

  const [ownerHubOpen, setOwnerHubOpen] = useState(false);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isCustomerMenu = currentView === 'flipbook' || currentView === 'quick_menu';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 no-print">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Restaurant Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setCurrentView('flipbook')}
              className="flex items-center gap-2 group text-left focus:outline-none min-w-0"
            >
              <span className="text-xl sm:text-2xl shrink-0 p-1 bg-neutral-100 rounded-lg">
                {activeRestaurant.logo}
              </span>
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
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200/80 rounded-md text-[10px] sm:text-xs font-semibold text-amber-900 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>{currentTable}</span>
              </div>
            )}
          </div>

          {/* Zone 2: View Switcher (Flipbook vs List) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Mode Toggle Pill (Flipbook / List) */}
            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200/60">
              <button
                onClick={() => setCurrentView('flipbook')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentView === 'flipbook'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Interactive 3D Flipbook"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xs:inline">Flipbook</span>
              </button>
              <button
                onClick={() => setCurrentView('quick_menu')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentView === 'quick_menu'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Quick Searchable List"
              >
                <ListOrdered className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden xs:inline">List</span>
              </button>
            </div>

            {/* Waiter Buzzer Button */}
            {isCustomerMenu && (
              <button
                onClick={onOpenWaiterModal}
                className="relative p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Call Waiter / Request Bill"
              >
                <PhoneCall className="w-4 h-4 text-amber-600" />
                {waiterCalls.filter(c => c.tableNumber === currentTable).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Restaurant Staff & Admin Hub Button */}
            <button
              onClick={() => setOwnerHubOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              title="Restaurant Owner & Staff Hub (Builder, QR/NFC, Kitchen, Admin)"
            >
              <Settings className="w-4 h-4 text-neutral-600" />
              <span className="hidden md:inline font-semibold">Staff Hub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Owner Management Sheet */}
      <OwnerHubModal 
        isOpen={ownerHubOpen} 
        onClose={() => setOwnerHubOpen(false)} 
      />
    </>
  );
};
