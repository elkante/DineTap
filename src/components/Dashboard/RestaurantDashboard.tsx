import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { setActiveSession, saveStoredRestaurants, fileToDataUrl, saveDishToSupabase, deleteDishFromSupabase, saveShiftToSupabase, syncAllDishesToSupabase } from '../../utils/supabase';
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
  Image as ImageIcon,
  Volume2,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  Phone,
  RotateCcw,
  Receipt,
  Sparkles,
  Menu,
  X,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { FoodItem, Order } from '../../types';
import { getDishFallbackImage } from '../Flipbook/FlipPageRenderer';
import { NotchedBottomBar } from '../Navigation/NotchedBottomBar';
import { playKitchenChime } from '../../utils/audio';
import { KitchenInventoryView } from './KitchenInventoryView';
import { KitchenExpenseView } from './KitchenExpenseView';
import { KitchenArchiveView } from './KitchenArchiveView';
import { OrderSmartCardsModal } from '../Hardware/OrderSmartCardsModal';
import { MultiStoreManagerModal } from './MultiStoreManagerModal';
import { getNetworkVerifiedDate, formatNetworkDate, formatNetworkTime } from '../../utils/networkTime';
import { Package, DollarSign, Store, Lock, ShieldAlert } from 'lucide-react';

export const RestaurantDashboard: React.FC = () => {
  const { 
    restaurants,
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

  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'inventory' | 'expenses' | 'archive' | 'tables' | 'settings'>('kds');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [tableQrMap, setTableQrMap] = useState<Record<string, string>>({});
  const [isOrderCardsOpen, setIsOrderCardsOpen] = useState(false);
  const [isMultiStoreOpen, setIsMultiStoreOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Live Digital Kitchen Date & Clock (Network-verified from API, immune to device tampering)
  const [liveDate, setLiveDate] = useState(() => formatNetworkDate());
  const [liveClock, setLiveClock] = useState(() => formatNetworkTime());
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = getNetworkVerifiedDate();
      setLiveDate(formatNetworkDate(d));
      setLiveClock(formatNetworkTime(d));
      setClockTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Buzzer Audio Test Feedback
  const [testingChime, setTestingChime] = useState(false);
  const handleTestChime = () => {
    setTestingChime(true);
    playKitchenChime();
    showNotification('🔔 Kitchen buzzer alert tested!');
    setTimeout(() => setTestingChime(false), 1200);
  };

  // Interactive Item Scratch-off / Checkmarks (per order item key)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Day Shift Management (Start Day / End Day Daily Register)
  const shiftKey = `tapmenu_shift_${activeRestaurant.id || 'default'}`;
  const [shiftData, setShiftData] = useState<{
    isActive: boolean;
    startedAt: string;
    startedAtTs: number;
    endedAt?: string;
    endedAtTs?: number;
  }>(() => {
    try {
      const saved = localStorage.getItem(shiftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isActive: parsed.isActive ?? true,
          startedAt: parsed.startedAt || '8:00 AM',
          startedAtTs: parsed.startedAtTs || Date.now() - 3600000,
          endedAt: parsed.endedAt,
          endedAtTs: parsed.endedAtTs
        };
      }
    } catch {}
    const now = Date.now();
    return {
      isActive: true,
      startedAt: '8:00 AM',
      startedAtTs: now - 3600000
    };
  });

  const isDayActive = shiftData.isActive;
  const dayStartTime = shiftData.startedAt;
  const [isEndDayModalOpen, setIsEndDayModalOpen] = useState(false);

  const handleStartDay = () => {
    const verifiedDate = getNetworkVerifiedDate();
    const nowTime = formatNetworkTime(verifiedDate);
    const nowTs = verifiedDate.getTime();
    const newShift = {
      isActive: true,
      startedAt: nowTime,
      startedAtTs: nowTs
    };
    setShiftData(newShift);
    localStorage.setItem(shiftKey, JSON.stringify(newShift));
    showNotification(`🌅 Fresh Day Shift Started at ${nowTime}! Previous orders archived.`);
  };

  const handleConfirmEndDay = () => {
    const verifiedDate = getNetworkVerifiedDate();
    const endedTime = formatNetworkTime(verifiedDate);
    const endedTs = verifiedDate.getTime();
    const closedShift = {
      ...shiftData,
      isActive: false,
      endedAt: endedTime,
      endedAtTs: endedTs
    };
    setShiftData(closedShift);
    localStorage.setItem(shiftKey, JSON.stringify(closedShift));

    // Archive this shift's reconciliation report permanently to shift history and Supabase Cloud
    const shiftRecord = {
      shiftId: `sh-${endedTs}`,
      startedAt: shiftData.startedAt,
      startedAtTs: shiftData.startedAtTs,
      endedAt: endedTime,
      endedAtTs: endedTs,
      date: formatNetworkDate(verifiedDate),
      totalRevenue: totalDayRevenue,
      totalOrders: currentShiftOrders.length,
      servedOrders: servedOrdersCount,
      vat: totalDayVat,
      payments: paymentBreakdown
    };

    saveShiftToSupabase(activeRestaurant.id, shiftRecord);

    setIsEndDayModalOpen(false);
    showNotification(`🌙 Day Shift Closed & Reconciled! All orders archived to Cloud.`);
  };

  // Print Thermal Ticket Slip (ESC/POS Kitchen Slip emulation)
  const handlePrintTicket = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Ticket #${order.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; margin: 10px; color: #000; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: bold; }
          .table { font-size: 22px; font-weight: bold; margin: 4px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .notes { font-size: 11px; font-style: italic; margin-left: 10px; }
          .totals { border-top: 1px dashed #000; margin-top: 8px; padding-top: 6px; }
          .footer { text-align: center; margin-top: 15px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${activeRestaurant.name}</div>
          <div class="table">${order.orderType === 'takeaway' ? '🥡 TAKEOUT PACK' : order.orderType === 'both' ? `🍽️🥡 DINE-IN + TAKEOUT – ${order.tableNumber}` : order.tableNumber}</div>
          <div>Ticket #${order.id}</div>
          <div>${order.createdAt}</div>
          <div>Guest: ${order.customerName}</div>
          ${order.customerPhone ? `<div>Tel: ${order.customerPhone}</div>` : ''}
          ${order.paymentMethod ? `<div>Pay: ${order.paymentMethod.toUpperCase()}</div>` : ''}
          ${order.orderType === 'takeaway' || order.orderType === 'both' ? `<div style="font-weight:bold; margin-top:4px;">* TAKEOUT PACKAGING (${order.packCount || 1}x)</div>` : ''}
        </div>
        <div>
          ${order.items.map(i => `
            <div class="item-row">
              <span><strong>${i.quantity}x</strong> ${i.foodItem.name}</span>
              <span>${activeRestaurant.design.currencySymbol}${(i.foodItem.price * i.quantity).toLocaleString()}</span>
            </div>
            ${i.notes ? `<div class="notes">* Note: ${i.notes}</div>` : ''}
          `).join('')}
        </div>
        <div class="totals">
          ${order.subtotal ? `<div class="item-row"><span>Dishes Subtotal:</span><span>${activeRestaurant.design.currencySymbol}${order.subtotal.toLocaleString()}</span></div>` : ''}
          ${order.packagingFee ? `<div class="item-row"><span>Takeout Packaging:</span><span>${activeRestaurant.design.currencySymbol}${order.packagingFee.toLocaleString()}</span></div>` : ''}
          ${order.vat ? `<div class="item-row"><span>VAT (7.5%):</span><span>${activeRestaurant.design.currencySymbol}${order.vat.toLocaleString()}</span></div>` : ''}
          <div class="item-row" style="font-size: 15px; font-weight: bold;">
            <span>TOTAL:</span>
            <span>${activeRestaurant.design.currencySymbol}${order.total.toLocaleString()}</span>
          </div>
        </div>
        <div class="footer">
          *** KITCHEN PRODUCTION TICKET ***
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Print Clean Z-Report Slip (Thermal Slip emulation instead of full browser screen capture)
  const handlePrintZReport = () => {
    const printWindow = window.open('', '_blank', 'width=380,height=700');
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Z-Report - ${activeRestaurant.name}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; margin: 12px; color: #000; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: bold; }
          .subtitle { font-size: 11px; margin-top: 2px; }
          .bold-title { font-size: 14px; font-weight: bold; text-align: center; margin: 6px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .section { border-top: 1px dashed #000; margin-top: 8px; padding-top: 6px; }
          .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; margin: 8px 0; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${activeRestaurant.name}</div>
          <div class="subtitle">${activeRestaurant.tagline || 'Daily Shift Closeout'}</div>
          <div class="bold-title">*** END OF DAY Z-REPORT ***</div>
          <div class="subtitle">Date: ${liveDate}</div>
          <div class="subtitle">Shift Time: ${dayStartTime} - ${liveClock}</div>
        </div>

        <div>
          <div class="item-row"><span>Total Diners / Guests:</span><span><strong>${totalDinersCount}</strong></span></div>
          <div class="item-row"><span>Orders Completed / Served:</span><span><strong>${servedOrdersCount} / ${restaurantOrders.length}</strong></span></div>
        </div>

        <div class="section">
          <div class="item-row"><span>Dishes Subtotal:</span><span>${activeRestaurant.design.currencySymbol}${totalDaySubtotal.toLocaleString()}</span></div>
          <div class="item-row"><span>VAT Collected (7.5%):</span><span>${activeRestaurant.design.currencySymbol}${totalDayVat.toLocaleString()}</span></div>
        </div>

        <div class="grand-total">
          <span>TOTAL GROSS SALES:</span>
          <span>${activeRestaurant.design.currencySymbol}${totalDayRevenue.toLocaleString()}</span>
        </div>

        <div class="section">
          <div style="font-weight: bold; margin-bottom: 4px;">SETTLEMENT BREAKDOWN:</div>
          <div class="item-row"><span>💳 Card / POS at Table:</span><span>${activeRestaurant.design.currencySymbol}${paymentBreakdown.pos.toLocaleString()}</span></div>
          <div class="item-row"><span>💵 Cash to Waiters:</span><span>${activeRestaurant.design.currencySymbol}${paymentBreakdown.cash.toLocaleString()}</span></div>
          <div class="item-row"><span>🏦 Direct Bank Transfer:</span><span>${activeRestaurant.design.currencySymbol}${paymentBreakdown.transfer.toLocaleString()}</span></div>
        </div>

        <div class="footer">
          <div>Verified via TapMenu Network Time (Tamper-Proof)</div>
          <div>*** END OF DAILY SHIFT REGISTER ***</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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

  // Filter all orders for active restaurant (matching on id, slug, or if id is empty)
  const restaurantOrders = orders.filter(o => 
    !o.restaurantId ||
    o.restaurantId === activeRestaurant.id ||
    (activeRestaurant.slug && o.restaurantId.toLowerCase() === activeRestaurant.slug.toLowerCase())
  );

  // Active Daily Shift Filter:
  // When a shift is active, only show tickets placed during the active shift!
  // Orders from prior closed shifts are preserved and accessible in the "Archive & Reports" tab.
  const currentShiftOrders = restaurantOrders.filter(o => {
    if (!shiftData.isActive) return false;
    const orderTs = o.createdAtTimestamp || 0;
    return orderTs >= (shiftData.startedAtTs - 60000); // 1 min grace buffer
  });

  const activeOrders = currentShiftOrders.filter(o => o.status !== 'served');
  const completedOrders = currentShiftOrders.filter(o => o.status === 'served');

  const restaurantCalls = waiterCalls.filter(c => 
    !c.restaurantId ||
    c.restaurantId === activeRestaurant.id ||
    (activeRestaurant.slug && c.restaurantId.toLowerCase() === activeRestaurant.slug.toLowerCase())
  );

  // ── Cumulative Day Shift Accumulator (Current Shift Only) ───────────────
  const totalDayRevenue = currentShiftOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDaySubtotal = currentShiftOrders.reduce((sum, o) => sum + (o.subtotal || Math.round(o.total / 1.075)), 0);
  const totalDayVat = currentShiftOrders.reduce((sum, o) => sum + (o.vat || (o.total - Math.round(o.total / 1.075))), 0);
  const totalDinersCount = currentShiftOrders.length;
  const servedOrdersCount = completedOrders.length;

  const paymentBreakdown = {
    pos: currentShiftOrders.filter(o => o.paymentMethod === 'pos' || !o.paymentMethod).reduce((sum, o) => sum + o.total, 0),
    cash: currentShiftOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0),
    transfer: currentShiftOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0),
  };

  // Live ticket elapsed age with color-coded urgency
  const getTicketAge = (order: Order) => {
    const ts = order.createdAtTimestamp || Date.now();
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;

    let urgency: 'fresh' | 'warning' | 'urgent' = 'fresh';
    if (mins >= 20) {
      urgency = 'urgent';
    } else if (mins >= 10) {
      urgency = 'warning';
    }

    const timeLabel = mins > 0 ? `${mins}m ago` : `${secs}s ago`;
    return { mins, timeLabel, urgency };
  };

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
    try {
      saveStoredRestaurants(restaurants);
    } catch {}
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
      const dishCat = dish.pageTitle || activeRestaurant.pages.find(p => p.id === dish.pageId)?.title || 'Main Menu';
      updateFoodItem(dish.pageId, dish.id, { imageUrl: dataUrl }, dishCat);
      saveDishToSupabase(activeRestaurant.id, {
        ...dish,
        imageUrl: dataUrl
      }, dishCat);
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
    setNewItemCategory(firstContentPage?.title || 'Main Menu');
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
    const dishCat = dish.pageTitle || activeRestaurant.pages.find(p => p.id === dish.pageId)?.title || 'Main Menu';
    setNewItemCategory(dishCat);
    setIsCustomCategoryInput(false);
    setIsAddItemOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const chosenCat = newItemCategory.trim() || contentPages[0]?.title || 'Main Menu';

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
        }, editingDish.id, chosenCat);
      } else {
        updateFoodItem(editingDish.pageId, editingDish.id, dishPayload, chosenCat);
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
        addFoodItem(targetPageId, dishPayload, newDishId, chosenCat);
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

  const [isSyncingDishes, setIsSyncingDishes] = useState(false);

  // Auto-sync dishes to Supabase on mount/change so mobile phone sees all items
  useEffect(() => {
    if (!activeRestaurant.id || allDishes.length === 0) return;
    const syncDishes = async () => {
      try {
        const dishPayloads = allDishes.map(d => ({
          item: d,
          category: d.pageTitle || 'Main Menu'
        }));
        await syncAllDishesToSupabase(activeRestaurant.id, dishPayloads);
      } catch (e) {
        console.warn('Auto dish sync notice:', e);
      }
    };
    syncDishes();
  }, [activeRestaurant.id, allDishes.length]);

  const handleManualSyncDishes = async () => {
    setIsSyncingDishes(true);
    try {
      const dishPayloads = allDishes.map(d => ({
        item: d,
        category: d.pageTitle || 'Main Menu'
      }));
      const count = await syncAllDishesToSupabase(activeRestaurant.id, dishPayloads);
      showNotification(`Synced ${count} dishes to Supabase Cloud! Live on all devices.`);
    } catch {
      showNotification('Dish sync completed');
    } finally {
      setIsSyncingDishes(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Staff Navigation */}
      <header className="bg-neutral-900 text-white sticky top-0 z-40 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Toggle (Matches PC Left Panel) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-amber-400 border border-neutral-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer z-10"
              aria-label="Open Kitchen Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center overflow-hidden shrink-0">
              {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
                <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl">{activeRestaurant.logo || '🍽️'}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold truncate text-white">{activeRestaurant.name}</h1>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">
                Staff & Kitchen Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Kitchen Real-time Date & Clock (Network-verified from API) */}
            <div className="flex flex-col items-end px-2 sm:px-3 py-1 bg-neutral-800/90 border border-neutral-700/80 rounded-xl text-neutral-200 font-mono text-xs font-bold shrink-0" title="Tamper-proof live time synced with Network Time Protocol API (Africa/Lagos)">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white text-xs sm:text-sm font-extrabold tracking-tight">{liveClock}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-amber-300 font-sans font-medium">
                <span>{liveDate}</span>
                <span className="text-[9px] text-emerald-400 font-mono font-normal">● Live</span>
              </div>
            </div>

            {/* Desktop Only header buttons (On Mobile, these live inside the Hamburger Side Drawer) */}
            <button
              onClick={() => setIsMultiStoreOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors border border-neutral-700"
              title="Multi-Store Restaurant Branches"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Branches</span>
              {!(activeRestaurant.plan || '').toLowerCase().includes('standard') && !(activeRestaurant.plan || '').toLowerCase().includes('premium') && (
                <Lock className="w-3 h-3 text-amber-500" />
              )}
            </button>

            <a
              href={customerMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 hover:border-red-600 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Sign out of owner dashboard"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-white shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Desktop Left Sidebar + Central Panel Layout */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Desktop Left Side Panel Navigation */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-neutral-900 border-r border-neutral-800 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto z-30 select-none">
          {/* Restaurant identity quick info */}
          <div className="p-4 border-b border-neutral-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium truncate">Active Portal</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {planDisplayName}
              </span>
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-1 truncate">
              {allDishes.length} Dishes · {activeRestaurant.tables.length} Tables
            </div>
          </div>

          {/* Vertical Menu Tabs */}
          <nav className="p-3 space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('kds')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'kds'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 shrink-0" />
                <span>Kitchen Display</span>
              </div>
              {activeOrders.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                  activeTab === 'kds' ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-neutral-950'
                }`}>
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 shrink-0" />
                <span>Menu Dishes</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">({allDishes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Inventory Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'expenses'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Expense Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'archive'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Archive & Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Table QR Codes</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">({activeRestaurant.tables.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Hardware Card Order CTA in Sidebar */}
          <div className="p-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsOrderCardsOpen(true)}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Order Smart Cards</span>
            </button>
          </div>
        </aside>

        {/* Main Body */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-28 md:pb-8 overflow-y-auto">
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

            {/* Kitchen Operations Command Bar: Live Clock, Day Shift Controls & Loud Buzzer */}
            <div className="bg-white border border-neutral-200 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Live Real-time Kitchen Clock */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-xl font-mono text-xs font-black shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{liveClock}</span>
                </div>

                {/* Day Shift Status Badge */}
                {isDayActive ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Day Active (from {dayStartTime})</span>
                    <span className="text-emerald-700 font-mono text-[11px] font-bold">· {totalDinersCount} Diners · {design.currencySymbol}{totalDayRevenue.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span>Shift Closed / Reconciled</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Test Loud Kitchen Buzzer */}
                <button
                  type="button"
                  onClick={handleTestChime}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    testingChime 
                      ? 'bg-amber-500 text-neutral-950 scale-105 ring-2 ring-amber-300' 
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/70'
                  }`}
                  title="Test loud kitchen buzzer chime"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${testingChime ? 'animate-bounce text-neutral-950' : 'text-amber-800'}`} />
                  <span>{testingChime ? 'Buzzer Fired!' : 'Test Buzzer'}</span>
                </button>

                {/* Start Day / End Day Action */}
                {isDayActive ? (
                  <button
                    type="button"
                    onClick={() => setIsEndDayModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="End Day Shift: Accumulate all orders, customers, and revenue into Z-Report"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>End Day Shift (Z-Report)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartDay}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-white" />
                    <span>Start Day Shift</span>
                  </button>
                )}
              </div>
            </div>

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
                  Orders placed by diners at tables arrive with instant sound alert, table details, and customer phone.
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
                  When diners scan table QR stands or tap NFC cards, tickets appear here in real time with an audio alert.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Listening for incoming diner orders</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map(order => {
                  const age = getTicketAge(order);
                  const isUrgent = age.urgency === 'urgent';
                  const isWarning = age.urgency === 'warning';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${
                        isUrgent
                          ? 'border-2 border-red-500 ring-2 ring-red-400/30'
                          : isWarning
                          ? 'border-2 border-amber-400 shadow-amber-500/10'
                          : 'border border-neutral-200'
                      }`}
                    >
                      <div>
                        {/* Ticket Header: Prominent Table Number, ID, Source & Elapsed Timer */}
                        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-neutral-950 text-white font-mono font-black text-sm rounded-lg shadow-xs">
                                {order.tableNumber}
                              </span>
                              <span className="font-mono text-xs text-neutral-400">#{order.id}</span>
                              <span className="text-[10px] text-neutral-400 font-semibold uppercase">
                                {order.source === 'nfc' ? '📱 NFC' : '📷 QR'}
                              </span>
                            </div>

                            {/* Takeout / Both Packaging Badge */}
                            {(order.orderType === 'takeaway' || order.orderType === 'both') && (
                              <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-[11px] font-black tracking-wide w-fit animate-pulse">
                                <span>{order.orderType === 'both' ? '🍽️🥡 DINE-IN + TAKEOUT' : '🥡 TAKEAWAY PACK'}</span>
                                {order.packCount && <span>({order.packCount}x packs)</span>}
                                {order.packagingFee && <span className="opacity-75">· +₦{order.packagingFee.toLocaleString()}</span>}
                              </div>
                            )}

                            {/* Customer Name & Phone */}
                            <div className="text-xs text-neutral-800 mt-1.5 font-bold flex flex-wrap items-center gap-2">
                              <span>{order.customerName}</span>
                              {order.customerPhone && (
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                                  title="Call customer"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{order.customerPhone}</span>
                                </a>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              Placed at {order.createdAt}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {/* Live Elapsed Age Badge */}
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold flex items-center gap-1 ${
                              isUrgent 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : isWarning 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{age.timeLabel}</span>
                            </span>

                            {/* Print Slip Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintTicket(order)}
                              className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Print thermal order slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Items Checklist (Chef can tap to scratch off prepared dishes) */}
                        <div className="py-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            <span>Dishes Ordered</span>
                            <span>Tap to check off</span>
                          </div>
                          {order.items.map((ci, idx) => {
                            const isChecked = !!checkedItems[`${order.id}-${idx}`];
                            return (
                              <div 
                                key={idx} 
                                onClick={() => toggleItemCheck(order.id, idx)}
                                className={`text-xs flex items-start justify-between cursor-pointer p-1.5 rounded-lg transition-all ${
                                  isChecked ? 'bg-emerald-50/70 text-neutral-400' : 'hover:bg-neutral-50 text-neutral-900'
                                }`}
                              >
                                <div className="flex items-start gap-2 pr-2">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                                  )}
                                  <div className={isChecked ? 'line-through text-neutral-400' : ''}>
                                    <span className="font-mono font-bold text-amber-800 mr-1.5">{ci.quantity}x</span>
                                    <span className="font-bold">{ci.foodItem.name}</span>
                                    {ci.notes && (
                                      <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 italic no-underline">
                                        Note: {ci.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className={`font-mono font-semibold shrink-0 ${isChecked ? 'line-through text-neutral-400' : 'text-neutral-500'}`}>
                                  {design.currencySymbol}{(ci.foodItem.price * ci.quantity).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer: Subtotal, VAT, Payment Choice & Status advancement buttons */}
                      <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                        {/* Cost & Payment Details */}
                        <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-neutral-500">
                            <span>Subtotal</span>
                            <span className="font-mono">{design.currencySymbol}{(order.subtotal || Math.round(order.total / 1.075)).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-500">
                            <span>VAT (7.5%)</span>
                            <span className="font-mono text-amber-800 font-bold">
                              {design.currencySymbol}{(order.vat || (order.total - Math.round(order.total / 1.075))).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 font-bold text-xs text-neutral-900">
                            <span>Total Due</span>
                            <span className="font-mono text-sm text-neutral-950 font-black">
                              {design.currencySymbol}{order.total.toLocaleString()}
                            </span>
                          </div>

                          {/* Payment Choice Badge */}
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="text-neutral-400">Settlement Method:</span>
                            <span className="px-2 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-900">
                              {order.paymentMethod === 'pos' 
                                ? '💳 Card / POS' 
                                : order.paymentMethod === 'cash' 
                                ? '💵 Cash' 
                                : order.paymentMethod === 'transfer' 
                                ? '🏦 Transfer' 
                                : '💳 Card / POS'}
                            </span>
                          </div>
                        </div>

                        {/* Status Advancement Actions */}
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
                  );
                })}
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
                  onClick={handleManualSyncDishes}
                  disabled={isSyncingDishes}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Push all local dishes to Supabase Cloud so phone and PC display the identical 8 dishes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingDishes ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDishes ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ New Category</span>
                </button>
                <button
                  onClick={handleOpenAddDish}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
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

            {/* Hardware Smart Cards Order Banner */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Order More Smart NFC Cards & Acrylic Stands</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    ₦7,000 / custom pre-encoded card. Can be encoded for Dining Tables, Google 5-Star Reviews, or WhatsApp Concierge.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderCardsOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Order Cards (₦7k ea)</span>
              </button>
            </div>

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
        {/* TAB: KITCHEN INVENTORY MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'inventory' && (
          <KitchenInventoryView 
            restaurant={activeRestaurant} 
            showNotification={showNotification} 
          />
        )}

        {/* ========================================================= */}
        {/* TAB: KITCHEN EXPENSES MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'expenses' && (
          <KitchenExpenseView 
            restaurant={activeRestaurant} 
            showNotification={showNotification} 
          />
        )}

        {/* ========================================================= */}
        {/* TAB: FINANCIAL ARCHIVE & HISTORICAL RECONCILIATION */}
        {/* ========================================================= */}
        {activeTab === 'archive' && (
          <KitchenArchiveView 
            orders={restaurantOrders} 
            restaurant={activeRestaurant} 
            onPrintOrderReceipt={handlePrintTicket} 
          />
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

              {/* Account & Session Management */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <label className="block font-bold text-neutral-900 text-xs">Account Session</label>
                <p className="text-[11px] text-neutral-500">
                  Signed in as owner of <strong className="text-neutral-800">{activeRestaurant.name}</strong>. You will remain logged in on this browser until you manually sign out.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Restaurant</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

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
                          setNewItemCategory(contentPages[0]?.title || 'Main Menu');
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
      {/* ========================================================= */}
      {/* MODAL: END DAY SHIFT RECONCILIATION & Z-REPORT */}
      {/* ========================================================= */}
      {isEndDayModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 text-xs animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">End Day Shift · Z-Report</h3>
                  <p className="text-[11px] text-neutral-500">{activeRestaurant.name} · Cumulative Reconciliation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEndDayModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Shift Summary Cards */}
            <div className="my-4 space-y-3">
              <div className="p-3 bg-neutral-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Total Accumulated Sales Today</span>
                  <span className="font-mono text-2xl font-black text-amber-400">{design.currencySymbol}{totalDayRevenue.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Shift Duration</span>
                  <span className="font-mono text-xs text-neutral-200">{dayStartTime} — {liveClock}</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase">Total Diners</span>
                  <span className="font-mono text-base font-black text-neutral-900">{totalDinersCount}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase">Orders Served</span>
                  <span className="font-mono text-base font-black text-emerald-700">{servedOrdersCount} / {restaurantOrders.length}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase">VAT Collected</span>
                  <span className="font-mono text-base font-black text-amber-800">{design.currencySymbol}{totalDayVat.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-neutral-800 block">Settlement Breakdown</span>
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-blue-600" /> POS / Card at Table:</span>
                  <span className="font-mono font-bold text-neutral-900">{design.currencySymbol}{paymentBreakdown.pos.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-600" /> Cash to Waiters:</span>
                  <span className="font-mono font-bold text-neutral-900">{design.currencySymbol}{paymentBreakdown.cash.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-emerald-600" /> Direct Bank Transfer:</span>
                  <span className="font-mono font-bold text-neutral-900">{design.currencySymbol}{paymentBreakdown.transfer.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleConfirmEndDay}
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Close Day & Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Smart Cards Hardware Modal */}
      <OrderSmartCardsModal
        isOpen={isOrderCardsOpen}
        onClose={() => setIsOrderCardsOpen(false)}
        restaurant={activeRestaurant}
        showNotification={showNotification}
      />

      {/* Multi-Store Chain Management Hub Modal */}
      <MultiStoreManagerModal
        isOpen={isMultiStoreOpen}
        onClose={() => setIsMultiStoreOpen(false)}
        onOpenPricing={() => setActiveTab('settings')}
      />

      {/* Mobile Slide-Over Navigation Drawer (Equivalent to Desktop Left Side Panel) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[70] md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-neutral-900 border-r border-neutral-800 text-white flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                    {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
                      <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{activeRestaurant.logo || '🍽️'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-white truncate">{activeRestaurant.name}</h3>
                    <span className="text-[10px] text-amber-300 font-bold block">{planDisplayName} Plan</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => { setActiveTab('kds'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'kds'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ChefHat className="w-4 h-4 shrink-0" />
                    <span>Kitchen Display</span>
                  </div>
                  {activeOrders.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                      activeTab === 'kds' ? 'bg-neutral-950 text-white' : 'bg-amber-500 text-neutral-950'
                    }`}>
                      {activeOrders.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('menu'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'menu'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4 shrink-0" />
                    <span>Menu Dishes</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">({allDishes.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('inventory'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'inventory'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  <span>Inventory Manager</span>
                </button>

                <button
                  onClick={() => { setActiveTab('expenses'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'expenses'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>Expense Ledger</span>
                </button>

                <button
                  onClick={() => { setActiveTab('archive'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'archive'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Archive & Reports</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tables'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'tables'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Table QR Codes</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">({activeRestaurant.tables.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </button>
              </nav>

              {/* Mobile Quick Utility Actions */}
              <div className="px-3 pt-2 pb-3 space-y-1 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setIsMultiStoreOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <span>Branches</span>
                  </div>
                  {!(activeRestaurant.plan || '').toLowerCase().includes('standard') && !(activeRestaurant.plan || '').toLowerCase().includes('premium') && (
                    <Lock className="w-3 h-3 text-amber-500" />
                  )}
                </button>

                <a
                  href={customerMenuUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>View Customer Menu</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Bottom Actions inside Drawer (Safe pb-24 clearance above bottom navigation) */}
            <div className="p-3 pb-24 border-t border-neutral-800 space-y-2 bg-neutral-900/95 backdrop-blur-sm shrink-0">
              <button
                type="button"
                onClick={() => { setIsOrderCardsOpen(true); setIsMobileDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Order Smart Cards</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notched Bottom Navigation for Mobile (Replacing the top tab bar) */}
      <NotchedBottomBar
        variant="kitchen_dashboard"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        activeOrdersCount={activeOrders.length}
        waiterCallsCount={restaurantCalls.length}
        totalDishesCount={allDishes.length}
        totalTablesCount={activeRestaurant.tables.length}
        isTestingChime={testingChime}
        onTestChime={handleTestChime}
      />
    </div>
  );
};
