import React, { useState } from 'react';
import { 
  ChefHat, 
  UtensilsCrossed, 
  PhoneCall, 
  Volume2, 
  CheckCircle2, 
  ArrowLeft,
  Building2,
  CreditCard,
  Plus,
  MessageCircle,
  Package,
  BellRing,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Lock,
  Utensils,
  QrCode,
  Settings
} from 'lucide-react';

export interface KitchenNotchedBarProps {
  variant: 'kitchen';
  activeOrdersCount: number;
  waiterCallsCount: number;
  completedOrdersCount: number;
  isTestingChime?: boolean;
  onTestChime: () => void;
  onFilterActive?: () => void;
  onFilterServed?: () => void;
  onOpenCalls?: () => void;
  onBackToMenu: () => void;
  currentFilter?: 'all' | 'active' | 'served' | 'calls';
}

export interface KitchenDashboardNotchedBarProps {
  variant: 'kitchen_dashboard';
  activeTab: 'kds' | 'menu' | 'inventory' | 'expenses' | 'archive' | 'tables' | 'settings';
  onTabChange: (tab: 'kds' | 'menu' | 'inventory' | 'expenses' | 'archive' | 'tables' | 'settings') => void;
  activeOrdersCount: number;
  waiterCallsCount: number;
  totalDishesCount: number;
  totalTablesCount: number;
  isTestingChime?: boolean;
  onTestChime: () => void;
}

export interface SuperAdminNotchedBarProps {
  variant: 'super_admin';
  activeTab: 'restaurants' | 'plans' | 'settings' | 'hardware';
  onTabChange: (tab: 'restaurants' | 'plans' | 'settings' | 'hardware') => void;
  onOpenOnboardModal: () => void;
  totalRestaurants: number;
  hasPlanChanges?: boolean;
  onLockSession?: () => void;
  onExitHQ?: () => void;
}

export type NotchedBottomBarProps = KitchenNotchedBarProps | KitchenDashboardNotchedBarProps | SuperAdminNotchedBarProps;

export const NotchedBottomBar: React.FC<NotchedBottomBarProps> = (props) => {
  const [pressedFeedback, setPressedFeedback] = useState(false);

  const handleCenterAction = () => {
    setPressedFeedback(true);
    setTimeout(() => setPressedFeedback(false), 300);

    if (props.variant === 'kitchen' || props.variant === 'kitchen_dashboard') {
      props.onTestChime();
    } else {
      props.onOpenOnboardModal();
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-50 md:hidden max-w-md mx-auto pointer-events-auto select-none">
      <div className="relative h-16 w-full flex items-center justify-between">
        
        {/* Authentic SVG Concave Notched Backdrop with Luxury Amber Glow */}
        <svg 
          className="absolute inset-0 w-full h-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] filter pointer-events-none" 
          viewBox="0 0 390 64" 
          fill="none" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="luxuryNotchBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08140f" stopOpacity="0.97" />
              <stop offset="50%" stopColor="#0c1f17" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#070f0b" stopOpacity="0.97" />
            </linearGradient>
            
            <linearGradient id="luxuryNotchBorder" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Precision Scooped Notched Path */}
          <path
            d="
              M 20 0 
              L 146 0 
              C 162 0, 164 30, 195 30 
              C 226 30, 228 0, 244 0 
              L 370 0 
              A 20 20 0 0 1 390 20 
              L 390 44 
              A 20 20 0 0 1 370 64 
              L 20 64 
              A 20 20 0 0 1 0 44 
              L 0 20 
              A 20 20 0 0 1 20 0 
              Z
            "
            fill="url(#luxuryNotchBg)"
            stroke="url(#luxuryNotchBorder)"
            strokeWidth="1.25"
          />
        </svg>

        {/* =========================================================================
            ELEVATED CENTER FLOATING ACTION BUTTON (Nestled in the Concave Notch)
           ========================================================================= */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-20">
          <button
            type="button"
            onClick={handleCenterAction}
            aria-label={props.variant === 'super_admin' ? 'Onboard New Restaurant Tenant' : 'Test Kitchen Buzzer Alert & Badge'}
            className={`
              w-14 h-14 rounded-full flex flex-col items-center justify-center 
              bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-stone-950 font-bold 
              shadow-[0_10px_24px_rgba(245,158,11,0.5),0_0_15px_rgba(251,191,36,0.3)]
              border-2 border-yellow-200/90
              transition-all duration-200 ease-out cursor-pointer
              ${pressedFeedback ? 'scale-90 ring-4 ring-amber-400/60' : 'hover:scale-105 active:scale-95'}
              ${(props.variant === 'kitchen' || props.variant === 'kitchen_dashboard') && props.isTestingChime ? 'animate-pulse ring-4 ring-yellow-300' : ''}
            `}
          >
            {props.variant === 'super_admin' ? (
              <>
                <Plus className="w-6 h-6 text-stone-950 stroke-[2.75]" />
                <span className="text-[8px] font-black uppercase tracking-tighter -mt-0.5 text-stone-950">
                  Onboard
                </span>
              </>
            ) : (
              <>
                <Volume2 className={`w-6 h-6 text-stone-950 ${props.isTestingChime ? 'animate-bounce' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter -mt-0.5 text-stone-950">
                  {props.isTestingChime ? 'Alert!' : 'Buzzer'}
                </span>
              </>
            )}

            {/* Glowing Ambient Halo */}
            <span className="absolute -inset-1 rounded-full bg-amber-400/20 blur-sm -z-10 pointer-events-none" />
          </button>
        </div>

        {/* =========================================================================
            LEFT SECTION TABS (2 items)
           ========================================================================= */}
        <div className="flex-1 flex items-center justify-around pr-8 z-10 pl-2">
          {props.variant === 'kitchen_dashboard' ? (
            <>
              {/* Dashboard Tab 1: Kitchen Orders */}
              <button
                type="button"
                onClick={() => props.onTabChange('kds')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'kds'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <ChefHat className="w-5 h-5" />
                  {props.activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-mono font-black rounded-full border border-stone-900 shadow-xs">
                      {props.activeOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Kitchen</span>
              </button>

              {/* Dashboard Tab 2: Menu Dishes */}
              <button
                type="button"
                onClick={() => props.onTabChange('menu')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'menu'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <Utensils className="w-5 h-5" />
                  {props.totalDishesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-stone-700 text-amber-300 text-[10px] font-mono font-bold rounded-full border border-stone-900 shadow-xs">
                      {props.totalDishesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Dishes</span>
              </button>
            </>
          ) : props.variant === 'kitchen' ? (
            <>
              {/* Tab 1: Active Tickets */}
              <button
                type="button"
                onClick={props.onFilterActive}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.currentFilter === 'active' || !props.currentFilter || props.currentFilter === 'all'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <ChefHat className="w-5 h-5" />
                  {props.activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-mono font-black rounded-full border border-stone-900 shadow-xs">
                      {props.activeOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Tickets</span>
              </button>

              {/* Tab 2: Waiter Table Calls */}
              <button
                type="button"
                onClick={props.onOpenCalls}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.currentFilter === 'calls'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <PhoneCall className={`w-5 h-5 ${props.waiterCallsCount > 0 ? 'text-amber-400 animate-bounce' : ''}`} />
                  {props.waiterCallsCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-mono font-black rounded-full border border-stone-900 animate-pulse shadow-xs">
                      {props.waiterCallsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Calls</span>
              </button>
            </>
          ) : (
            <>
              {/* Super Admin Tab 1: Tenants / Restaurants */}
              <button
                type="button"
                onClick={() => props.onTabChange('restaurants')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'restaurants'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <Building2 className="w-5 h-5" />
                  {props.totalRestaurants > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-mono font-black rounded-full border border-stone-900 shadow-xs">
                      {props.totalRestaurants}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Tenants</span>
              </button>

              {/* Super Admin Tab 2: Pricing Plans */}
              <button
                type="button"
                onClick={() => props.onTabChange('plans')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'plans'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <CreditCard className="w-5 h-5" />
                  {props.hasPlanChanges && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Plans</span>
              </button>
            </>
          )}
        </div>

        {/* =========================================================================
            RIGHT SECTION TABS (2 items)
           ========================================================================= */}
        <div className="flex-1 flex items-center justify-around pl-8 z-10 pr-2">
          {props.variant === 'kitchen_dashboard' ? (
            <>
              {/* Dashboard Tab 3: Tables QR Codes */}
              <button
                type="button"
                onClick={() => props.onTabChange('tables')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'tables'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <QrCode className="w-5 h-5" />
                  {props.totalTablesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-stone-700 text-amber-300 text-[10px] font-mono font-bold rounded-full border border-stone-900 shadow-xs">
                      {props.totalTablesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Tables</span>
              </button>

              {/* Dashboard Tab 4: Settings & Day Shift */}
              <button
                type="button"
                onClick={() => props.onTabChange('settings')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'settings'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Settings & Shift Closeout"
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
              </button>
            </>
          ) : props.variant === 'kitchen' ? (
            <>
              {/* Tab 3: Completed / Served Orders */}
              <button
                type="button"
                onClick={props.onFilterServed}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.currentFilter === 'served'
                    ? 'text-emerald-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <CheckCircle2 className="w-5 h-5" />
                  {props.completedOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-emerald-500 text-stone-950 text-[10px] font-mono font-bold rounded-full border border-stone-900 shadow-xs">
                      {props.completedOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Served</span>
              </button>

              {/* Tab 4: Return to Menu */}
              <button
                type="button"
                onClick={props.onBackToMenu}
                className="flex flex-col items-center justify-center min-w-[54px] py-1.5 text-stone-400 hover:text-amber-400 transition-colors"
                title="Return to Flipbook Menu"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
              </button>
            </>
          ) : (
            <>
              {/* Super Admin Tab 3: WhatsApp Chat Settings */}
              <button
                type="button"
                onClick={() => props.onTabChange('settings')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'settings'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5">WhatsApp</span>
              </button>

              {/* Super Admin Tab 4: Hardware Stands or Session Lock */}
              <button
                type="button"
                onClick={() => props.onTabChange('hardware')}
                className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 transition-colors relative ${
                  props.activeTab === 'hardware'
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5">Hardware</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
