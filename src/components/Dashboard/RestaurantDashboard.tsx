import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { setActiveSession, fileToDataUrl, saveDishToSupabase } from '../../utils/supabase';
import { generateQrDataUrl } from '../../utils/nfc';
import { 
  ChefHat, 
  Utensils, 
  QrCode, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  AlertCircle,
  Coins,
  CreditCard,
  Building2,
  PhoneCall,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { FoodItem } from '../../types';

export const RestaurantDashboard: React.FC = () => {
  const { 
    activeRestaurant, 
    orders, 
    updateOrderStatus, 
    waiterCalls, 
    resolveWaiterCall,
    addFoodItem, 
    updateFoodItem, 
    deleteFoodItem, 
    toggleSoldOut, 
    registerTableTag,
    bulkGenerateTables,
    deleteTable,
    updateRestaurantMeta,
    showNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'tables' | 'settings'>('kds');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [tableQrMap, setTableQrMap] = useState<Record<string, string>>({});

  // Menu item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(3000);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemBadge, setNewItemBadge] = useState<FoodItem['badge']>('');
  const [newItemPrepTime, setNewItemPrepTime] = useState('15 min');
  const [newItemImage, setNewItemImage] = useState<string>('');

  // Add Table state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [bulkCount, setBulkCount] = useState(5);

  const design = activeRestaurant.design;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerMenuUrl = `${origin}/?r=${activeRestaurant.slug}&table=Table+1`;

  // Filter orders for active restaurant
  const restaurantOrders = orders.filter(o => o.restaurantId === activeRestaurant.id);
  const activeOrders = restaurantOrders.filter(o => o.status !== 'served');
  const completedOrders = restaurantOrders.filter(o => o.status === 'served');

  // Generate QR code for every table
  useEffect(() => {
    let mounted = true;
    const generateAllQrs = async () => {
      const map: Record<string, string> = {};
      for (const tbl of activeRestaurant.tables) {
        try {
          const directUrl = `${origin}/?r=${activeRestaurant.slug}&table=${encodeURIComponent(tbl.tableNumber)}`;
          map[tbl.id] = await generateQrDataUrl(directUrl);
        } catch (e) {
          console.warn('QR error for table', tbl.tableNumber, e);
        }
      }
      if (mounted) setTableQrMap(map);
    };
    generateAllQrs();
    return () => { mounted = false; };
  }, [activeRestaurant.tables, activeRestaurant.slug, origin]);

  const handleCopyMenuLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    showNotification('Direct Table Link copied to clipboard!');
    setTimeout(() => setCopiedSlug(false), 2500);
  };

  const handleLogout = () => {
    setActiveSession(null);
    window.location.href = window.location.pathname;
  };

  const handleDishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setNewItemImage(dataUrl);
      showNotification('Dish photo attached!');
    } catch {
      showNotification('Failed to read image file');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      updateRestaurantMeta({ logo: dataUrl });
      showNotification('Restaurant logo updated!');
    } catch {
      showNotification('Failed to read logo file');
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    // Add to first content page (page 2)
    const targetPage = activeRestaurant.pages.find(p => p.layout !== 'cover') || activeRestaurant.pages[0];
    if (!targetPage) return;

    const dishPayload = {
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      price: Number(newItemPrice) || 1000,
      badge: newItemBadge,
      prepTime: newItemPrepTime.trim() || '15 min',
      imageUrl: newItemImage || undefined,
    };

    addFoodItem(targetPage.id, dishPayload);
    saveDishToSupabase(activeRestaurant.id, {
      id: `it-${Date.now()}`,
      ...dishPayload,
    }, targetPage.title);

    showNotification(`Added "${dishPayload.name}" to menu!`);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemImage('');
    setIsAddItemOpen(false);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newTableNumber.trim();
    if (!cleanNum) return;

    const formatted = cleanNum.toLowerCase().startsWith('table') ? cleanNum : `Table ${cleanNum}`;
    registerTableTag(formatted, `${formatted} Stand`, 'Dining Room', '');
    setNewTableNumber('');
    showNotification(`Registered ${formatted}! Scannable QR code ready.`);
  };

  // Flatten all menu items
  const allDishes = activeRestaurant.pages
    .filter(p => p.layout !== 'cover')
    .flatMap(p => p.items.map(it => ({ ...it, pageId: p.id, pageTitle: p.title })));

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Staff Navigation */}
      <header className="bg-neutral-900 text-white sticky top-0 z-40 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl p-1 bg-neutral-800 rounded-xl shrink-0">
              {activeRestaurant.logo}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold truncate">{activeRestaurant.name}</h1>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                  /?r={activeRestaurant.slug}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 block truncate">
                Staff & Kitchen Management Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={customerMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Customer Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>

            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-xl transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto text-xs pb-2 border-t border-neutral-800/60 pt-2">
          <button
            onClick={() => setActiveTab('kds')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'kds'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Display</span>
            {activeOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'kds' ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-neutral-950 font-extrabold'
              }`}>
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu Dishes ({allDishes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Table QR Codes ({activeRestaurant.tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* ========================================================= */}
        {/* TAB 1: KITCHEN DISPLAY SYSTEM (KDS) */}
        {/* ========================================================= */}
        {activeTab === 'kds' && (
          <div className="space-y-4">
            {/* Waiter Buzzer Banner */}
            {waiterCalls.length > 0 && (
              <div className="p-4 bg-amber-500 text-neutral-950 rounded-2xl shadow flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <div>
                    <span className="font-extrabold text-sm block">Active Table Assistance Buzzer</span>
                    <span className="text-xs">{waiterCalls.map(c => `${c.tableNumber}: ${c.reason}`).join(' | ')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {waiterCalls.map(c => (
                    <button
                      key={c.id}
                      onClick={() => resolveWaiterCall(c.id)}
                      className="px-3 py-1 bg-neutral-950 text-white rounded-lg text-xs font-bold"
                    >
                      Dismiss {c.tableNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900">Live Kitchen Tickets</h2>
                <p className="text-xs text-neutral-500">
                  New orders placed by diners at their tables arrive here instantly with an audio chime.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-700">
                  Active Tickets: {activeOrders.length}
                </span>
              </div>
            </div>

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Live Kitchen Tickets Ready</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  When diners scan any of your table QR stand cards, tickets appear here in real time with an audio alert.
                </p>
                <div className="mt-4">
                  <a
                    href={`${origin}/?r=${activeRestaurant.slug}&table=Table+1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>Open Table 1 Menu &rarr;</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Ticket Header: Prominent Table Number */}
                      <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-neutral-950 text-white font-mono font-black text-sm rounded-lg shadow-xs">
                              {order.tableNumber}
                            </span>
                            <span className="font-mono text-xs text-neutral-400">#{order.id}</span>
                          </div>
                          <div className="text-xs text-neutral-600 mt-1 font-medium">
                            {order.customerName} &middot; <span className="text-neutral-400">{order.createdAt}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          order.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : order.status === 'preparing'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items Ordered */}
                      <div className="py-3 space-y-2">
                        {order.items.map((ci, idx) => (
                          <div key={idx} className="text-xs flex items-start justify-between">
                            <div className="pr-2">
                              <span className="font-mono font-bold text-amber-800 mr-1.5">{ci.quantity}x</span>
                              <span className="font-bold text-neutral-900">{ci.foodItem.name}</span>
                              {ci.notes && (
                                <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 italic">
                                  Note: {ci.notes}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-neutral-500 font-semibold shrink-0">
                              {design.currencySymbol}{(ci.foodItem.price * ci.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Payment info & Status advancement buttons */}
                    <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Total</span>
                        <span className="font-mono font-bold text-sm text-neutral-900">
                          {design.currencySymbol}{order.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-xs font-bold">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className={`py-1.5 rounded-lg transition-colors ${
                            order.status === 'preparing'
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          Cooking
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className={`py-1.5 rounded-lg transition-colors ${
                            order.status === 'ready'
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          Ready
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                          Served
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed orders history */}
            {completedOrders.length > 0 && (
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Completed Orders ({completedOrders.length})
                </h3>
                <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden text-xs">
                  {completedOrders.slice(0, 5).map(o => (
                    <div key={o.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">{o.tableNumber}</span>
                        <span className="text-neutral-400">&middot; {o.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-neutral-900">
                          {design.currencySymbol}{o.total.toLocaleString()}
                        </span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Served & Settled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MENU DISHES MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900">Menu Dishes</h2>
                <p className="text-xs text-neutral-500">
                  Add your restaurant's dishes, adjust prices, or mark items sold out in real-time.
                </p>
              </div>

              <button
                onClick={() => setIsAddItemOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allDishes.map(dish => (
                <div
                  key={dish.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center justify-between gap-3 ${
                    dish.isSoldOut ? 'opacity-65 border-red-200 bg-red-50/20' : 'border-neutral-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-neutral-900 text-sm truncate">{dish.name}</h3>
                      {dish.isSoldOut ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-600 uppercase">
                          Sold Out
                        </span>
                      ) : dish.badge ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800">
                          {dish.badge}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-1 mb-1.5">{dish.description}</p>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-neutral-900">
                        {design.currencySymbol}{dish.price.toLocaleString()}
                      </span>
                      {dish.prepTime && (
                        <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {dish.prepTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleSoldOut(dish.pageId, dish.id)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                        dish.isSoldOut
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {dish.isSoldOut ? 'Restock' : 'Sold Out'}
                    </button>

                    <button
                      onClick={() => deleteFoodItem(dish.pageId, dish.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TABLE QR CODES & PER-TABLE LINKS */}
        {/* ========================================================= */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900">Table QR Codes & Direct Links</h2>
                <p className="text-xs text-neutral-500">
                  Every table gets a unique QR code & link. Orders arrive in the kitchen labelled with the exact table.{' '}
                  You have <strong>{activeRestaurant.tables.length}</strong> table{activeRestaurant.tables.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-50 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Print Stand Cards</span>
                </button>
              </div>
            </div>

            {/* Bulk Generate Panel */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-amber-900 mb-0.5">Bulk Generate Tables</div>
                <div className="text-[11px] text-amber-700">
                  Instantly create numbered tables (starts from Table {activeRestaurant.tables.length + 1}).
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-16 px-2 py-2 text-center bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => bulkGenerateTables(bulkCount)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Generate {bulkCount} Table{bulkCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>

            {/* Quick Add Single Custom Table Form */}
            <form onSubmit={handleAddTable} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex items-center gap-2">
              <input
                type="text"
                required
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Add custom table (e.g. VIP 1, Rooftop 2, Bar)"
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-neutral-800"
              >
                + Add Table
              </button>
            </form>


            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRestaurant.tables.map(tbl => {
                const directUrl = `${origin}/?r=${activeRestaurant.slug}&table=${encodeURIComponent(tbl.tableNumber)}`;
                const qrImage = tableQrMap[tbl.id];

                return (
                  <div
                    key={tbl.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between text-center break-inside-avoid"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-black text-sm font-mono text-neutral-900">
                          {tbl.tableNumber}
                        </div>
                        <button
                          onClick={() => deleteTable(tbl.id)}
                          title="Remove table"
                          className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Scannable QR Code */}
                      <div className="w-36 h-36 mx-auto bg-neutral-50 p-2 rounded-xl border border-neutral-200 my-2 flex items-center justify-center">
                        {qrImage ? (
                          <img src={qrImage} alt={tbl.tableNumber} className="w-full h-full object-contain" />
                        ) : (
                          <QrCode className="w-16 h-16 text-neutral-300" />
                        )}
                      </div>

                      <div className="text-[10px] text-neutral-400 font-mono break-all px-2 line-clamp-2 mb-2">
                        {directUrl}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCopyMenuLink(directUrl)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[11px] font-bold text-neutral-700"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </button>

                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 text-white rounded-lg text-[11px] font-bold hover:bg-neutral-800"
                      >
                        <span>Test &rarr;</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RESTAURANT SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4 text-xs">
              <h2 className="text-sm font-extrabold text-neutral-900">Restaurant Profile & Settings</h2>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Restaurant Logo</label>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl mb-3">
                  {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
                    <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-300" />
                  ) : (
                    <div className="text-3xl p-1 bg-white border border-neutral-200 rounded-xl">{activeRestaurant.logo || '🍽️'}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <div className="text-[10px] text-neutral-400 mt-1">PNG, JPG, or WEBP logo</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={activeRestaurant.name}
                  onChange={(e) => updateRestaurantMeta({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Custom Menu Slug</label>
                <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-500 font-mono font-bold">
                  <span>/?r=</span>
                  <input
                    type="text"
                    value={activeRestaurant.slug}
                    onChange={(e) => updateRestaurantMeta({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                    className="w-full bg-transparent text-neutral-900 focus:outline-none ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Signature Menu Book Leather Color</label>
                <div className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  {[
                    { name: 'Emerald Leather', hex: '#0c2e22', border: '#D4AF37' },
                    { name: 'Burgundy Wine', hex: '#4a0e17', border: '#D4AF37' },
                    { name: 'Midnight Navy', hex: '#0f172a', border: '#eab308' },
                    { name: 'Espresso Leather', hex: '#2b1810', border: '#f59e0b' },
                    { name: 'Warm Terracotta', hex: '#7c2d12', border: '#f59e0b' },
                    { name: 'Charcoal Slate', hex: '#1f2421', border: '#d97706' },
                  ].map(preset => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => updateRestaurantMeta({ design: { ...activeRestaurant.design, coverColor: preset.hex, primaryColor: preset.hex } })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        (activeRestaurant.design.coverColor || activeRestaurant.design.primaryColor) === preset.hex ? 'scale-110 ring-2 ring-amber-400 shadow-md' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                      title={preset.name}
                    />
                  ))}
                  <div className="h-5 w-[1px] bg-neutral-300 mx-1" />
                  <input
                    type="color"
                    value={activeRestaurant.design.coverColor || activeRestaurant.design.primaryColor || '#0c2e22'}
                    onChange={(e) => updateRestaurantMeta({ design: { ...activeRestaurant.design, coverColor: e.target.value, primaryColor: e.target.value } })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Pick custom hex color"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={activeRestaurant.design.currencySymbol}
                  onChange={(e) => updateRestaurantMeta({ design: { ...activeRestaurant.design, currencySymbol: e.target.value } })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={activeRestaurant.address}
                  onChange={(e) => updateRestaurantMeta({ address: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={activeRestaurant.phone}
                  onChange={(e) => updateRestaurantMeta({ phone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add New Food Item */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 text-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Add Dish to Menu</h3>
            <p className="text-[11px] text-neutral-500 mb-3">Item will be live on your table QR menus immediately.</p>

            <form onSubmit={handleCreateDish} className="space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Charcoal Suya Platter"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dish Photo</label>
                {newItemImage ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-neutral-200 mb-2">
                    <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewItemImage('')}
                      className="absolute top-2 right-2 p-1.5 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-lg shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-200 hover:border-amber-500 rounded-xl cursor-pointer bg-neutral-50 transition-colors">
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-700">Attach Photo from Device</span>
                    <input type="file" accept="image/*" onChange={handleDishImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients and culinary notes..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Price ({design.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Badge</label>
                  <select
                    value={newItemBadge || ''}
                    onChange={(e) => setNewItemBadge(e.target.value as FoodItem['badge'])}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  >
                    <option value="">None</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Spicy">Spicy</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
