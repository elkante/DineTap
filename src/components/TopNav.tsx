import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  PhoneCall,
  Menu,
  X,
  BookOpen,
  Info,
  CreditCard,
  ChefHat,
  ShieldCheck,
  Check
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
    ownerSession
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Secret 6-tap easter egg for platform super admin (/sys-hq)
  const [logoTaps, setLogoTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 3000) {
      setLogoTaps(1);
    } else {
      const next = logoTaps + 1;
      if (next >= 6) {
        setLogoTaps(0);
        window.location.href = '/sys-hq';
        return;
      }
      setLogoTaps(next);
    }
    setLastTapTime(now);
    setCurrentView('flipbook');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 no-print">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Restaurant Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={handleLogoTap}
            className="flex items-center gap-2 group text-left focus:outline-none min-w-0 active:scale-95 transition-transform"
            title="TapMenu - Tap 6 times for Super Admin"
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

        {/* Zone 2: Actions (Waiter Buzzer, Cart, and Hamburger Dropdown) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

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

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-200 active:scale-95"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 text-neutral-900" />
            ) : (
              <Menu className="w-4 h-4 text-neutral-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Dropdown Tray */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white/98 backdrop-blur-xl px-4 py-3.5 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1 text-xs font-semibold text-neutral-800">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentView('flipbook');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                currentView === 'flipbook' ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/60' : 'hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>3D Flipbook Menu</span>
              </div>
              {currentView === 'flipbook' && <Check className="w-3.5 h-3.5 text-amber-700" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCart();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-neutral-600" />
                <span>My Table Order</span>
              </div>
              {totalCartCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold">
                  {totalCartCount} items
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">Empty</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWaiterModal();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-600" />
                <span>Call Waiter / Request Bill</span>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded font-bold">
                Instant
              </span>
            </button>

            {/* If Owner / Staff session is active, offer KDS link */}
            {ownerSession && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCurrentView('orders');
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  <span>Kitchen Display (KDS)</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  Staff
                </span>
              </button>
            )}
          </div>

          {/* Dine-in Table Context & Direct Payments Info */}
          <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
              <span>Direct Staff POS / Cash</span>
            </span>
            {currentTable && (
              <span className="font-mono font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                Table: {currentTable}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
