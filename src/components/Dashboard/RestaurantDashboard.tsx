import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { setActiveSession, fileToDataUrl, saveDishToSupabase, deleteDishFromSupabase } from '../../utils/supabase';
import { generateQrDataUrl } from '../../utils/nfc';
import { getStoredPlans } from '../../utils/pricingConfig';
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
  Pencil,
  Image as ImageIcon
} from 'lucide-react';
import { FoodItem } from '../../types';
import { getDishFallbackImage } from '../Flipbook/FlipPageRenderer';

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
    updatePage,
    deletePage,
    showNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'tables' | 'settings'>('kds');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [tableQrMap, setTableQrMap] = useState<Record<string, string>>({});

  // Category filter & management
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; title: string } | null>(null);
  const [editingCategoryTitle, setEditingCategoryTitle] = useState('');

  // Menu item modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<(FoodItem & { pageId: string; pageTitle?: string }) | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(3000);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemBadge, setNewItemBadge] = useState<FoodItem['badge']>('');
  const [newItemPrepTime, setNewItemPrepTime] = useState('15 min');
  const [newItemImage, setNewItemImage] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('');
  const [isCustomCategoryInput, setIsCustomCategoryInput] = useState(false);

  // Add Table state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [bulkCount, setBulkCount] = useState(5);

  const design = activeRestaurant.design;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerMenuUrl = `${origin}/?r=${activeRestaurant.slug}&table=Table+1`;

  // ── Plan Table Limit Enforcement ─────────────────────────────────────────
  // Priority: restaurant.tableLimit (admin override) → plan.maxTables → unlimited
  const planConfig = (() => {
    const plans = getStoredPlans();
    const planId = (activeRestaurant.plan || '').toLowerCase();
    // Match legacy plan strings too
    if (planId.includes('enterprise')) return plans.find(p => p.id === 'enterprise');
    if (planId.includes('premium'))    return plans.find(p => p.id === 'premium');
    if (planId.includes('standard') || planId.includes('growth')) return plans.find(p => p.id === 'standard');
    return plans.find(p => p.id === planId) || plans.find(p => p.id === 'basic');
  })();

  // null = unlimited
  const effectiveTableLimit: number | null =
    activeRestaurant.tableLimit !== undefined
      ? activeRestaurant.tableLimit  // admin override wins
      : (planConfig?.maxTables ?? null);

  const currentTableCount = activeRestaurant.tables.length;
  const isAtTableLimit = effectiveTableLimit !== null && currentTableCount >= effectiveTableLimit;
  const remainingTables = effectiveTableLimit !== null ? Math.max(0, effectiveTableLimit - currentTableCount) : Infinity;
  const planDisplayName = planConfig?.name || 'Basic';
  // ─────────────────────────────────────────────────────────────────────────

  // Filter orders for active restaurant (matching on id, slug, or if id is empty)
  const restaurantOrders = orders.filter(o => 
    !o.restaurantId ||
    o.restaurantId === activeRestaurant.id ||
    (activeRestaurant.slug && o.restaurantId.toLowerCase() === activeRestaurant.slug.toLowerCase())
  );
  const activeOrders = restaurantOrders.filter(o => o.status !== 'served');
  const completedOrders = restaurantOrders.filter(o => o.status === 'served');

  const restaurantCalls = waiterCalls.filter(c => 
    !c.restaurantId ||
    c.restaurantId === activeRestaurant.id ||
    (activeRestaurant.slug && c.restaurantId.toLowerCase() === activeRestaurant.slug.toLowerCase())
  );

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

  const contentPages = activeRestaurant.pages.filter(p => p.layout !== 'cover');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newCategoryTitle.trim();
    if (!cleanTitle) return;

    if (contentPages.some(p => p.title.toLowerCase() === cleanTitle.toLowerCase())) {
      showNotification(`Category "${cleanTitle}" already exists!`);
      return;
    }

    const newPageNum = activeRestaurant.pages.length + 1;
    const newPage = {
      id: `p-${Date.now()}`,
      pageNumber: newPageNum,
      title: cleanTitle,
      subtitle: `${cleanTitle} prepared fresh to order`,
      layout: 'two_column_grid' as const,
      items: []
    };

    updateRestaurantMeta({
      pages: [...activeRestaurant.pages, newPage]
    });
    setNewCategoryTitle('');
    setIsAddCategoryOpen(false);
    setSelectedCategoryFilter(newPage.id);
    showNotification(`🎉 Category "${cleanTitle}" added to menu!`);
  };

  const handleUpdateCategoryTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategoryTitle.trim()) return;

    updatePage(editingCategory.id, { title: editingCategoryTitle.trim() });
    showNotification(`Renamed section to "${editingCategoryTitle.trim()}"`);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (pageId: string, title: string) => {
    const page = activeRestaurant.pages.find(p => p.id === pageId);
    if (!page) return;

    if (page.items.length > 0) {
      if (!window.confirm(`Category "${title}" contains ${page.items.length} dish(es). Deleting it will remove these dishes. Continue?`)) {
        return;
      }
    }

    if (contentPages.length <= 1) {
      showNotification('Your menu must have at least one category!');
      return;
    }

    deletePage(pageId);
    if (selectedCategoryFilter === pageId) {
      setSelectedCategoryFilter('all');
    }
    showNotification(`Removed section "${title}"`);
  };

  const handleQuickDishPhotoUpload = async (dish: FoodItem & { pageId: string; pageTitle?: string }, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      updateFoodItem(dish.pageId, dish.id, { imageUrl: dataUrl });
      saveDishToSupabase(activeRestaurant.id, {
        ...dish,
        imageUrl: dataUrl
      }, dish.pageTitle || 'Specialities');
      showNotification(`Photo attached to "${dish.name}"!`);
    } catch {
      showNotification('Failed to read image file');
    }
  };

  const handleOpenAddDish = () => {
    setEditingDish(null);
    setNewItemName('');
    setNewItemPrice(3000);
    setNewItemDesc('');
    setNewItemBadge('');
    setNewItemPrepTime('15 min');
    setNewItemImage('');
    const firstContentPage = contentPages[0];
    setNewItemCategory(firstContentPage?.title || 'Specialities');
    setIsCustomCategoryInput(false);
    setIsAddItemOpen(true);
  };

  const handleOpenEditDish = (dish: FoodItem & { pageId: string; pageTitle?: string }) => {
    setEditingDish(dish);
    setNewItemName(dish.name);
    setNewItemPrice(dish.price);
    setNewItemDesc(dish.description || '');
    setNewItemBadge(dish.badge || '');
    setNewItemPrepTime(dish.prepTime || '15 min');
    setNewItemImage(dish.imageUrl || '');
    setNewItemCategory(dish.pageTitle || 'Specialities');
    setIsCustomCategoryInput(false);
    setIsAddItemOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const chosenCat = newItemCategory.trim() || 'Specialities';

    const dishPayload = {
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      price: Number(newItemPrice) || 1000,
      badge: newItemBadge,
      prepTime: newItemPrepTime.trim() || '15 min',
      imageUrl: newItemImage || undefined,
    };

    // Check if category page exists, create if not
    let targetPage = activeRestaurant.pages.find(p => p.layout !== 'cover' && p.title.toLowerCase() === chosenCat.toLowerCase());
    let targetPageId = targetPage?.id;

    if (!targetPage) {
      targetPageId = `p-${Date.now()}`;
      const newPage = {
        id: targetPageId,
        pageNumber: activeRestaurant.pages.length + 1,
        title: chosenCat,
        subtitle: `${chosenCat} prepared fresh to order`,
        layout: 'two_column_grid' as const,
        items: []
      };
      updateRestaurantMeta({
        pages: [...activeRestaurant.pages, newPage]
      });
    }

    if (editingDish) {
      // If moved to a different category
      if (targetPageId && targetPageId !== editingDish.pageId) {
        deleteFoodItem(editingDish.pageId, editingDish.id);
        addFoodItem(targetPageId, {
          ...dishPayload,
          isSoldOut: editingDish.isSoldOut,
          allergens: editingDish.allergens,
        });
      } else {
        updateFoodItem(editingDish.pageId, editingDish.id, dishPayload);
      }

      saveDishToSupabase(activeRestaurant.id, {
        id: editingDish.id,
        isSoldOut: editingDish.isSoldOut,
        allergens: editingDish.allergens,
        ...dishPayload,
      }, chosenCat);
      showNotification(`Updated "${dishPayload.name}"!`);
    } else {
      // Add new dish
      const newDishId = `it-${Date.now()}`;
      if (targetPageId) {
        addFoodItem(targetPageId, dishPayload);
      }
      saveDishToSupabase(activeRestaurant.id, {
        id: newDishId,
        ...dishPayload,
      }, chosenCat);
      showNotification(`Added "${dishPayload.name}" to ${chosenCat}!`);
    }

    setIsAddItemOpen(false);
    setEditingDish(null);
  };

  const handleDeleteDish = (pageId: string, dishId: string) => {
    deleteFoodItem(pageId, dishId);
    deleteDishFromSupabase(dishId);
    showNotification('Dish removed from menu');
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newTableNumber.trim();
    if (!cleanNum) return;

    // ── Plan limit check ──
    if (effectiveTableLimit !== null && currentTableCount >= effectiveTableLimit) {
      showNotification(`🚫 Table limit reached! Your ${planDisplayName} plan allows up to ${effectiveTableLimit} tables. Contact support to upgrade.`);
      return;
    }

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
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center overflow-hidden shrink-0">
              {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
                <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{activeRestaurant.logo || '🍽️'}</span>
              )}
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={customerMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <span className="hidden xs:inline">View Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-xl transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap text-xs pb-2 border-t border-neutral-800/60 pt-2">
          <button
            onClick={() => setActiveTab('kds')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
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
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
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
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
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
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
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
            {restaurantCalls.length > 0 && (
              <div className="p-4 bg-amber-500 text-neutral-950 rounded-2xl shadow flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <div>
                    <span className="font-extrabold text-sm block">Active Table Assistance Buzzer</span>
                    <span className="text-xs">{restaurantCalls.map(c => `${c.tableNumber}: ${c.reason}`).join(' | ')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {restaurantCalls.map(c => (
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
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-neutral-900">Live Kitchen Tickets</h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
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
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Listening for incoming diner orders</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900">Menu Dishes & Sections</h2>
                <p className="text-xs text-neutral-500">
                  Organize dishes into menu sections, attach mouthwatering photos, adjust prices, or toggle sold out.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ New Category</span>
                </button>
                <button
                  onClick={handleOpenAddDish}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Dish</span>
                </button>
              </div>
            </div>

            {/* Category Filter & Manager Strip */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Menu Sections ({contentPages.length})
                </span>
                <span className="text-[10px] text-neutral-400">
                  Click a section to filter dishes or edit its name
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  All Dishes ({allDishes.length})
                </button>

                {contentPages.map(page => {
                  const isSelected = selectedCategoryFilter === page.id;
                  return (
                    <div key={page.id} className="inline-flex items-center rounded-xl overflow-hidden shrink-0 border border-neutral-200">
                      <button
                        onClick={() => setSelectedCategoryFilter(page.id)}
                        className={`px-3 py-1.5 font-bold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-50 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                      >
                        {page.title} ({page.items.length})
                      </button>
                      {isSelected && (
                        <div className="flex items-center bg-amber-600 px-1 py-1">
                          <button
                            onClick={() => { setEditingCategory({ id: page.id, title: page.title }); setEditingCategoryTitle(page.title); }}
                            title="Rename Section"
                            className="p-1 text-amber-950 hover:text-white"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(page.id, page.title)}
                            title="Delete Section"
                            className="p-1 text-amber-950 hover:text-red-900"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dishes Grid */}
            {(() => {
              const displayDishes = allDishes.filter(d => 
                selectedCategoryFilter === 'all' || d.pageId === selectedCategoryFilter
              );

              if (displayDishes.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
                    <Utensils className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <h3 className="font-bold text-neutral-900 text-sm mb-1">No dishes in this section</h3>
                    <p className="text-xs text-neutral-500 mb-4">Add your dishes with photos and prices to build your digital menu book.</p>
                    <button
                      onClick={handleOpenAddDish}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add Dish to Section</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayDishes.map(dish => {
                    const dishImg = dish.imageUrl || getDishFallbackImage(dish.name, dish.pageTitle);

                    return (
                      <div
                        key={dish.id}
                        className={`bg-white rounded-2xl border p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 ${
                          dish.isSoldOut ? 'opacity-65 border-red-200 bg-red-50/20' : 'border-neutral-200'
                        }`}
                      >
                        {/* Dish Thumbnail & Quick Photo Trigger */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs group/thumb">
                          <img src={dishImg} alt={dish.name} className="w-full h-full object-cover" />
                          {dish.isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white bg-red-600 px-1 py-0.5 rounded">SOLD</span>
                            </div>
                          )}
                          <label
                            className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/thumb:opacity-100 cursor-pointer transition-opacity"
                            title="Upload photo from device"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span className="text-[8px] font-bold mt-0.5">Photo</span>
                            <input type="file" accept="image/*" onChange={(e) => handleQuickDishPhotoUpload(dish, e)} className="hidden" />
                          </label>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="font-bold text-neutral-900 text-sm truncate">{dish.name}</h3>
                            {dish.isSoldOut ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-600 uppercase shrink-0">
                                Sold Out
                              </span>
                            ) : dish.badge ? (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 shrink-0">
                                {dish.badge}
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-neutral-500 line-clamp-1 mb-1.5">{dish.description || 'No description'}</p>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-neutral-900">
                              {design.currencySymbol}{dish.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium truncate max-w-[110px]">
                              {dish.pageTitle}
                            </span>
                            {dish.prepTime && (
                              <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {dish.prepTime}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Quick Photo Upload Button */}
                          <label
                            className="p-1.5 text-neutral-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="Attach dish photo from camera roll"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <input type="file" accept="image/*" onChange={(e) => handleQuickDishPhotoUpload(dish, e)} className="hidden" />
                          </label>

                          <button
                            onClick={() => handleOpenEditDish(dish)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit dish"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => toggleSoldOut(dish.pageId, dish.id)}
                            className={`text-[11px] px-2 py-1.5 rounded-lg font-bold transition-colors ${
                              dish.isSoldOut
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {dish.isSoldOut ? 'Restock' : 'Sold Out'}
                          </button>

                          <button
                            onClick={() => handleDeleteDish(dish.pageId, dish.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                  You have <strong>{currentTableCount}</strong> table{currentTableCount !== 1 ? 's' : ''}{' '}
                  {effectiveTableLimit !== null ? (
                    <span className={isAtTableLimit ? 'text-red-600 font-bold' : 'text-neutral-400'}>
                      / {effectiveTableLimit} allowed ({planDisplayName} plan)
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">— Unlimited (Enterprise)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Plan Table Limit Progress Bar */}
            {effectiveTableLimit !== null && (
              <div className={`rounded-2xl p-4 border ${isAtTableLimit ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-neutral-700">
                    Table Usage — <span className="font-mono">{currentTableCount}</span> / <span className="font-mono">{effectiveTableLimit}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isAtTableLimit ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                    {planDisplayName} Plan
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${isAtTableLimit ? 'bg-red-500' : (currentTableCount / effectiveTableLimit > 0.8 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                    style={{ width: `${Math.min(100, (currentTableCount / effectiveTableLimit) * 100)}%` }}
                  />
                </div>
                {isAtTableLimit ? (
                  <p className="text-[11px] text-red-600 font-semibold mt-2">
                    🚫 Table limit reached for your {planDisplayName} plan. Contact TapMenu to upgrade your subscription.
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-2">
                    {remainingTables === 1 ? '1 table slot remaining' : `${remainingTables} table slots remaining`} on your {planDisplayName} plan.
                  </p>
                )}
              </div>
            )}

            {/* Bulk Generate Panel */}
            <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${isAtTableLimit ? 'bg-neutral-100 border-neutral-300 opacity-60' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-amber-900 mb-0.5">Bulk Generate Tables</div>
                <div className="text-[11px] text-amber-700">
                  {isAtTableLimit
                    ? `You've reached the ${planDisplayName} plan limit of ${effectiveTableLimit} tables.`
                    : `Instantly create numbered tables (starts from Table ${currentTableCount + 1}). ${effectiveTableLimit !== null ? `${remainingTables} slot${remainingTables !== 1 ? 's' : ''} remaining.` : ''}`
                  }
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={effectiveTableLimit !== null ? Math.min(100, remainingTables as number) : 100}
                  value={bulkCount}
                  disabled={isAtTableLimit}
                  onChange={(e) => {
                    const max = effectiveTableLimit !== null ? Math.min(100, remainingTables as number) : 100;
                    setBulkCount(Math.max(1, Math.min(max, Number(e.target.value))));
                  }}
                  className="w-16 px-2 py-2 text-center bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  disabled={isAtTableLimit}
                  onClick={() => {
                    if (isAtTableLimit) {
                      showNotification(`🚫 Table limit reached! Your ${planDisplayName} plan allows up to ${effectiveTableLimit} tables.`);
                      return;
                    }
                    const allowed = effectiveTableLimit !== null ? Math.min(bulkCount, remainingTables as number) : bulkCount;
                    if (allowed <= 0) { showNotification('No remaining table slots.'); return; }
                    bulkGenerateTables(allowed);
                    if (effectiveTableLimit !== null && allowed < bulkCount) {
                      showNotification(`Generated ${allowed} table${allowed !== 1 ? 's' : ''} (capped at your ${planDisplayName} plan limit).`);
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-400"
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
                placeholder={isAtTableLimit ? `Plan limit reached (${effectiveTableLimit} tables max)` : 'Add custom table (e.g. VIP 1, Rooftop 2, Bar)'}
                disabled={isAtTableLimit}
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isAtTableLimit}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal: Add or Edit Food Item */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-2xl border border-neutral-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                {editingDish ? 'Edit Menu Dish & Photo' : 'Add Dish to Menu'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setIsAddItemOpen(false); setEditingDish(null); }}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mb-3">
              Changes sync live to all diner mobile flipbooks immediately.
            </p>

            <form onSubmit={handleSaveDish} className="space-y-3">
              {/* Dish Photo Uploader */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dish Photo</label>
                {newItemImage ? (
                  <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-neutral-200 mb-1.5 shadow-xs">
                    <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <label className="p-1.5 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-lg shadow-sm cursor-pointer transition-colors" title="Change photo">
                        <Upload className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*" onChange={handleDishImageUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewItemImage('')}
                        className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-neutral-200 hover:border-amber-500 rounded-xl cursor-pointer bg-neutral-50 transition-colors">
                    <Upload className="w-5 h-5 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-700">Attach Dish Photo</span>
                    <span className="text-[10px] text-neutral-400">Click to upload from camera roll or files</span>
                    <input type="file" accept="image/*" onChange={handleDishImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Charcoal Suya Platter, Jollof Rice Special"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Menu Section / Category *</label>
                {!isCustomCategoryInput ? (
                  <div className="space-y-1.5">
                    <select
                      value={newItemCategory}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsCustomCategoryInput(true);
                          setNewItemCategory('');
                        } else {
                          setNewItemCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs font-semibold bg-white"
                    >
                      {contentPages.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                      <option value="__add_new__">✨ + Create New Section / Category...</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => { setIsCustomCategoryInput(true); setNewItemCategory(''); }}
                      className="text-[11px] text-amber-700 font-bold hover:underline inline-block"
                    >
                      + Create a new section
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        placeholder="e.g. Cocktails, Desserts, Suya & Grill, Sides"
                        className="flex-1 px-3 py-2 border border-amber-400 bg-amber-50/40 rounded-xl focus:outline-none focus:border-neutral-900 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategoryInput(false);
                          setNewItemCategory(contentPages[0]?.title || 'Specialities');
                        }}
                        className="px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      This will automatically create a new section in your 3D flipbook menu!
                    </div>
                  </div>
                )}
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
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={newItemPrepTime}
                    onChange={(e) => setNewItemPrepTime(e.target.value)}
                    placeholder="15 min"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Special Badge</label>
                <select
                  value={newItemBadge || ''}
                  onChange={(e) => setNewItemBadge(e.target.value as FoodItem['badge'])}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs"
                >
                  <option value="">None</option>
                  <option value="Chef Special">👨‍🍳 Chef Special</option>
                  <option value="Bestseller">🔥 Bestseller</option>
                  <option value="Spicy">🌶️ Spicy</option>
                  <option value="Popular">⭐ Popular</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients, seasonings, and dietary notes..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => { setIsAddItemOpen(false); setEditingDish(null); }}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg hover:bg-neutral-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-xs text-xs transition-colors"
                >
                  {editingDish ? 'Update Dish' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Create New Category */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-neutral-900">Add New Menu Section</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <p className="text-[11px] text-neutral-500 mb-3">
              Create a new category in your digital book (e.g. "Cocktails", "Sides", "Suya & Grills", "Desserts").
            </p>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="e.g. Cocktails & Drinks"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Category */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-neutral-900">Rename Menu Section</h3>
              <button onClick={() => setEditingCategory(null)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <form onSubmit={handleUpdateCategoryTitle} className="space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingCategoryTitle}
                  onChange={(e) => setEditingCategoryTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
