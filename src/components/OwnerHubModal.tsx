import React from 'react';
import { useApp, AppViewMode } from '../context/AppContext';
import { 
  Palette, 
  Nfc, 
  ChefHat, 
  X, 
  Building2, 
  Sparkles, 
  QrCode, 
  ChevronRight,
  BookOpen,
  ListOrdered
} from 'lucide-react';

export const OwnerHubModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    currentView, 
    setCurrentView, 
    restaurants, 
    activeRestaurant, 
    activeRestaurantId, 
    switchRestaurant, 
    simulateNfcTap, 
    orders, 
    waiterCalls 
  } = useApp();

  if (!isOpen) return null;

  const handleSelectView = (view: AppViewMode) => {
    setCurrentView(view);
    onClose();
  };

  const activeOrdersCount = orders.filter(o => o.status !== 'served').length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center text-sm shadow">
              ⚙️
            </div>
            <div>
              <h2 className="text-sm font-bold">Restaurant Management Hub</h2>
              <p className="text-[11px] text-neutral-400">Owner, Staff & Hardware Controls</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Active Restaurant Tenant Switcher */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Active Restaurant Tenant
            </label>
            <div className="space-y-1.5">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => switchRestaurant(r.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    r.id === activeRestaurantId
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-sm'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xl">{r.logo}</span>
                    <div className="truncate">
                      <div className="truncate">{r.name}</div>
                      <div className={`text-[10px] font-normal truncate ${r.id === activeRestaurantId ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {r.tables.length} tables · {r.pages.length} menu pages
                      </div>
                    </div>
                  </div>
                  {r.id === activeRestaurantId && (
                    <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Management Portals
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Menu Book Builder */}
              <button
                onClick={() => handleSelectView('editor')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                  currentView === 'editor'
                    ? 'border-amber-500 bg-amber-50/60'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 group-hover:text-amber-800 text-xs">
                      Menu Book Builder
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Customize pages, food photos, prices & templates
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
              </button>

              {/* QR & Digital Card Manager */}
              <button
                onClick={() => handleSelectView('nfc_qr')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                  currentView === 'nfc_qr'
                    ? 'border-amber-500 bg-amber-50/60'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Nfc className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 group-hover:text-blue-800 text-xs">
                      QR Codes & Digital Cards
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Program digital cards, print tent cards & manage tables
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
              </button>

              {/* Kitchen KDS & Live Orders */}
              <button
                onClick={() => handleSelectView('orders')}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                  currentView === 'orders'
                    ? 'border-amber-500 bg-amber-50/60'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 group-hover:text-emerald-800 text-xs flex items-center gap-2">
                      <span>Kitchen Display & Orders</span>
                      {activeOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-mono text-[10px] rounded-full">
                          {activeOrdersCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Live incoming tickets & waiter buzzer alerts
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
              </button>
            </div>
          </div>

          {/* Quick Tap Simulation */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Simulate Customer Table Tap
            </label>
            <div className="flex items-center gap-2">
              {activeRestaurant.tables.slice(0, 3).map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => {
                    simulateNfcTap(tbl.tableNumber);
                    onClose();
                  }}
                  className="flex-1 py-2 px-2 bg-neutral-100 hover:bg-amber-100 text-neutral-800 hover:text-amber-900 rounded-xl font-medium text-[11px] transition-colors truncate"
                >
                  ⚡ {tbl.tableNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <button
            onClick={() => handleSelectView('flipbook')}
            className="text-neutral-600 hover:text-neutral-900 font-semibold flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Return to Diner Menu</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
