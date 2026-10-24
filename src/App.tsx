import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNav } from './components/TopNav';
import { FlipbookViewer } from './components/Flipbook/FlipbookViewer';
import { QuickMenuView } from './components/QuickMenu/QuickMenuView';
import { MenuBookBuilder } from './components/Editor/MenuBookBuilder';
import { NfcQrManager } from './components/NfcQr/NfcQrManager';
import { KitchenOrdersView } from './components/Orders/KitchenOrdersView';
import { SuperAdminView } from './components/SuperAdmin/SuperAdminView';
import { CustomerCartDrawer } from './components/CustomerCartDrawer';
import { WaiterCallModal } from './components/WaiterCallModal';
import { FoodItem } from './types';
import { Sparkles, X, Plus, Minus, CheckCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, notificationMsg, activeRestaurant, addToCart } = useApp();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<FoodItem | null>(null);
  const [modalItemQty, setModalItemQty] = useState(1);
  const [modalItemNotes, setModalItemNotes] = useState('');

  const handleOpenItem = (item: FoodItem) => {
    setModalItem(item);
    setModalItemQty(1);
    setModalItemNotes('');
  };

  const handleConfirmAddToCart = () => {
    if (!modalItem || modalItem.isSoldOut) return;
    addToCart(modalItem, modalItemNotes, modalItemQty);
    setModalItem(null);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Navigation */}
      <TopNav
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenWaiterModal={() => setWaiterModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'flipbook' && <FlipbookViewer />}
        {currentView === 'quick_menu' && <QuickMenuView onSelectItem={handleOpenItem} />}
        {currentView === 'editor' && <MenuBookBuilder />}
        {currentView === 'nfc_qr' && <NfcQrManager />}
        {currentView === 'orders' && <KitchenOrdersView />}
        {currentView === 'super_admin' && <SuperAdminView />}
      </main>

      {/* Slide-Over Cart Drawer */}
      <CustomerCartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />

      {/* Waiter Assistance Buzzer Modal */}
      <WaiterCallModal
        isOpen={waiterModalOpen}
        onClose={() => setWaiterModalOpen(false)}
      />

      {/* Quick Menu Item Detail Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            {modalItem.imageUrl && (
              <div className="w-full h-48 relative overflow-hidden bg-neutral-100">
                <img
                  src={modalItem.imageUrl}
                  alt={modalItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setModalItem(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
                >
                  <X className="w-4 h-4" />
                </button>
                {modalItem.badge && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold text-xs rounded-md shadow">
                    {modalItem.badge}
                  </span>
                )}
              </div>
            )}

            <div className="p-6">
              {!modalItem.imageUrl && (
                <div className="flex justify-end mb-2">
                  <button onClick={() => setModalItem(null)} className="text-neutral-400 hover:text-neutral-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="text-lg font-bold text-neutral-900">{modalItem.name}</h3>
                <span className="font-mono text-lg font-bold text-amber-800">
                  {activeRestaurant.design.currencySymbol}{modalItem.price.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                {modalItem.description}
              </p>

              {(modalItem.prepTime || (modalItem.allergens && modalItem.allergens.length > 0)) && (
                <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                  {modalItem.prepTime && (
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium">
                      ⏱ {modalItem.prepTime}
                    </span>
                  )}
                  {modalItem.allergens && modalItem.allergens.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium">
                      ⚠️ Allergens: {modalItem.allergens.join(', ')}
                    </span>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Kitchen Notes / Special Requests
                </label>
                <input
                  type="text"
                  value={modalItemNotes}
                  onChange={(e) => setModalItemNotes(e.target.value)}
                  placeholder="e.g. Extra hot yaji, sauce on side, no onions..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-3 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
                  <button
                    onClick={() => setModalItemQty(Math.max(1, modalItemQty - 1))}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-sm font-bold text-neutral-900 w-6 text-center">
                    {modalItemQty}
                  </span>
                  <button
                    onClick={() => setModalItemQty(modalItemQty + 1)}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {modalItem.isSoldOut ? (
                  <div className="flex-1 py-3 px-4 bg-neutral-200 text-neutral-500 font-bold rounded-xl text-xs text-center">
                    Currently Sold Out
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmAddToCart}
                    className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>
                      Add to Order · {activeRestaurant.design.currencySymbol}{(modalItem.price * modalItemQty).toLocaleString()}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
