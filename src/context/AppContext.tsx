import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  RestaurantTenant, 
  MenuBookDesign, 
  MenuBookPage, 
  FoodItem, 
  MenuTemplateId, 
  PageLayoutType, 
  NfcStatus, 
  CartItem, 
  Order, 
  WaiterCall 
} from '../types';
import { INITIAL_RESTAURANTS, TEMPLATE_PRESETS } from '../data/initialData';
import { playKitchenChime } from '../utils/audio';
import { 
  syncOrderToSupabase, 
  syncWaiterCallToSupabase, 
  getActiveSession, 
  setActiveSession as saveActiveSession, 
  OwnerSession,
  getStoredRestaurants,
  saveStoredRestaurants
} from '../utils/supabase';

export type AppViewMode = 'flipbook' | 'quick_menu' | 'editor' | 'nfc_qr' | 'orders' | 'super_admin';

interface AppContextType {
  restaurants: RestaurantTenant[];
  activeRestaurant: RestaurantTenant;
  activeRestaurantId: string;
  currentView: AppViewMode;
  currentTable: string | null;
  isNfcSource: boolean;
  cart: CartItem[];
  orders: Order[];
  waiterCalls: WaiterCall[];
  notificationMsg: string | null;
  
  // Multi-tenant & Routing
  isCustomerRoute: boolean;
  restaurantNotFound: boolean;
  requestedSlug: string | null;
  ownerSession: OwnerSession | null;

  // Setters
  setCurrentView: (view: AppViewMode) => void;
  switchRestaurant: (idOrSlug: string) => void;
  showNotification: (msg: string) => void;
  setCurrentTable: (table: string) => void;
  logoutOwner: () => void;

  // Restaurant Design & Meta
  updateRestaurantMeta: (meta: Partial<RestaurantTenant>) => void;
  updateDesign: (design: Partial<MenuBookDesign>) => void;
  applyTemplate: (templateId: MenuTemplateId) => void;

  // Pages & Items
  updatePage: (pageId: string, updates: Partial<MenuBookPage>) => void;
  addPage: (layout: PageLayoutType) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  addFoodItem: (pageId: string, item: Omit<FoodItem, 'id'>) => void;
  updateFoodItem: (pageId: string, itemId: string, updates: Partial<FoodItem>) => void;
  deleteFoodItem: (pageId: string, itemId: string) => void;
  toggleSoldOut: (pageId: string, itemId: string) => void;

  // NFC & Tables
  registerTableTag: (tableNumber: string, label: string, section: string, nfcSerial: string) => void;
  updateTableStatus: (tableId: string, status: NfcStatus) => void;
  replaceDamagedTag: (tableId: string, newSerial: string) => void;

  // Ordering & Waiter Actions
  addToCart: (item: FoodItem, notes?: string, qty?: number) => void;
  updateCartItemQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  placeOrder: (customerName: string, paymentMethod?: 'pos' | 'cash' | 'transfer') => Order | null;
  callWaiter: (reason: WaiterCall['reason']) => void;
  resolveWaiterCall: (id: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Super Admin
  toggleTenantStatus: (tenantId: string) => void;
  createNewTenant: (name: string, templateId: MenuTemplateId) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_ORDERS = 'dinetap_orders_v2';
const STORAGE_KEY_CALLS = 'dinetap_calls_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load restaurants: check local storage first, then fallback to initial template
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(() => {
    const stored = getStoredRestaurants();
    if (stored.length > 0) return stored;
    return INITIAL_RESTAURANTS;
  });

  const [activeRestaurantId, setActiveRestaurantId] = useState<string>(() => {
    const stored = getStoredRestaurants();
    if (stored.length > 0) return stored[0].id;
    return INITIAL_RESTAURANTS[0]?.id || 'rest-lagos-bites';
  });

  const [currentView, setCurrentView] = useState<AppViewMode>('flipbook');
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [isNfcSource, setIsNfcSource] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Real Orders (NO mock fake data)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALLS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Multi-tenant URL state
  const [isCustomerRoute, setIsCustomerRoute] = useState(false);
  const [restaurantNotFound, setRestaurantNotFound] = useState(false);
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);
  const [ownerSession, setOwnerSessionState] = useState<OwnerSession | null>(() => getActiveSession());

  // URL Query Routing on initial mount & search change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('r') || params.get('tenant') || params.get('restaurant');
    const tableParam = params.get('table');
    const srcParam = params.get('src');

    if (slugParam) {
      setIsCustomerRoute(true);
      setRequestedSlug(slugParam);

      // Find matching restaurant
      const match = restaurants.find(r => 
        r.slug.toLowerCase() === slugParam.toLowerCase() || 
        r.id === slugParam
      );

      if (match) {
        setActiveRestaurantId(match.id);
        setRestaurantNotFound(false);
      } else {
        setRestaurantNotFound(true);
      }

      if (tableParam) {
        setCurrentTable(decodeURIComponent(tableParam));
      } else {
        setCurrentTable('Table 1');
      }

      if (srcParam === 'nfc') {
        setIsNfcSource(true);
      }
    } else {
      setIsCustomerRoute(false);
      setRestaurantNotFound(false);

      // If owner session exists, lock active restaurant to their restaurant
      const session = getActiveSession();
      if (session) {
        setOwnerSessionState(session);
        const owned = restaurants.find(r => r.id === session.restaurantId || r.slug === session.restaurantSlug);
        if (owned) {
          setActiveRestaurantId(owned.id);
        }
      }
    }
  }, [restaurants]);

  // Persist restaurants
  useEffect(() => {
    saveStoredRestaurants(restaurants);
  }, [restaurants]);

  // Persist orders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Orders storage write error', e);
    }
  }, [orders]);

  // Active restaurant reference
  const activeRestaurant = restaurants.find(r => r.id === activeRestaurantId) || restaurants[0] || INITIAL_RESTAURANTS[0];

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3200);
  };

  const switchRestaurant = (idOrSlug: string) => {
    const found = restaurants.find(r => r.id === idOrSlug || r.slug.toLowerCase() === idOrSlug.toLowerCase());
    if (found) {
      setActiveRestaurantId(found.id);
      showNotification(`Switched to ${found.name}`);
    }
  };

  const logoutOwner = () => {
    saveActiveSession(null);
    setOwnerSessionState(null);
    window.location.href = window.location.pathname;
  };

  const updateRestaurantMeta = (meta: Partial<RestaurantTenant>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return { ...r, ...meta };
    }));
    showNotification('Restaurant profile updated');
  };

  const updateDesign = (designUpdates: Partial<MenuBookDesign>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        design: { ...r.design, ...designUpdates }
      };
    }));
  };

  const applyTemplate = (templateId: MenuTemplateId) => {
    const preset = TEMPLATE_PRESETS[templateId];
    if (!preset) return;
    updateDesign({
      ...preset.design,
      currencySymbol: activeRestaurant.design.currencySymbol,
    });
    showNotification(`Applied "${preset.name}" visual theme`);
  };

  const updatePage = (pageId: string, updates: Partial<MenuBookPage>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        pages: r.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
      };
    }));
  };

  const addPage = (layout: PageLayoutType) => {
    const newPageNum = activeRestaurant.pages.length + 1;
    const newPage: MenuBookPage = {
      id: `p-${Date.now()}`,
      pageNumber: newPageNum,
      title: `Page ${newPageNum}`,
      subtitle: 'Delicious courses crafted fresh daily',
      layout,
      items: []
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return { ...r, pages: [...r.pages, newPage] };
    }));
    showNotification(`Added new ${layout} page`);
  };

  const deletePage = (pageId: string) => {
    if (activeRestaurant.pages.length <= 1) {
      showNotification('Cannot delete the only page in your menu');
      return;
    }
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      const filtered = r.pages.filter(p => p.id !== pageId);
      const renumbered = filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      return { ...r, pages: renumbered };
    }));
    showNotification('Page removed');
  };

  const duplicatePage = (pageId: string) => {
    const target = activeRestaurant.pages.find(p => p.id === pageId);
    if (!target) return;

    const duplicated: MenuBookPage = {
      ...target,
      id: `p-${Date.now()}`,
      title: `${target.title} (Copy)`,
      items: target.items.map(it => ({ ...it, id: `it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      const idx = r.pages.findIndex(p => p.id === pageId);
      const newPages = [...r.pages];
      newPages.splice(idx + 1, 0, duplicated);
      return {
        ...r,
        pages: newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }))
      };
    }));
    showNotification('Page duplicated');
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      const pagesCopy = [...r.pages];
      const [moved] = pagesCopy.splice(fromIndex, 1);
      pagesCopy.splice(toIndex, 0, moved);
      return {
        ...r,
        pages: pagesCopy.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
      };
    }));
  };

  const addFoodItem = (pageId: string, itemData: Omit<FoodItem, 'id'>) => {
    const newItem: FoodItem = {
      ...itemData,
      id: `it-${Date.now()}`
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        pages: r.pages.map(p => {
          if (p.id !== pageId) return p;
          return { ...p, items: [...p.items, newItem] };
        })
      };
    }));
    showNotification(`Added "${newItem.name}" to menu`);
  };

  const updateFoodItem = (pageId: string, itemId: string, updates: Partial<FoodItem>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        pages: r.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            items: p.items.map(it => it.id === itemId ? { ...it, ...updates } : it)
          };
        })
      };
    }));
  };

  const deleteFoodItem = (pageId: string, itemId: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        pages: r.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            items: p.items.filter(it => it.id !== itemId)
          };
        })
      };
    }));
    showNotification('Item removed from menu');
  };

  const toggleSoldOut = (pageId: string, itemId: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        pages: r.pages.map(p => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            items: p.items.map(it => {
              if (it.id !== itemId) return it;
              const nextState = !it.isSoldOut;
              showNotification(`"${it.name}" marked ${nextState ? 'Sold Out' : 'Available'}`);
              return { ...it, isSoldOut: nextState };
            })
          };
        })
      };
    }));
  };

  const registerTableTag = (tableNumber: string, label: string, section: string, nfcSerial: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newTag: TableNfcTag = {
      id: `tbl-${Date.now()}`,
      tableNumber,
      label,
      section,
      ntagSerial: nfcSerial || `04:${Math.floor(Math.random() * 89 + 10)}:FF:${Math.floor(Math.random() * 89 + 10)}`,
      nfcStatus: 'active',
      totalTaps: 0,
      totalScans: 0,
      urlPayload: `${origin}/?r=${activeRestaurant.slug}&table=${encodeURIComponent(tableNumber)}`
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return { ...r, tables: [...r.tables, newTag] };
    }));
  };

  const updateTableStatus = (tableId: string, status: NfcStatus) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        tables: r.tables.map(t => t.id === tableId ? { ...t, nfcStatus: status } : t)
      };
    }));
  };

  const replaceDamagedTag = (tableId: string, newSerial: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== activeRestaurantId) return r;
      return {
        ...r,
        tables: r.tables.map(t => {
          if (t.id !== tableId) return t;
          return { ...t, ntagSerial: newSerial, nfcStatus: 'active' };
        })
      };
    }));
  };

  // Cart & Ordering
  const addToCart = (item: FoodItem, notes?: string, qty: number = 1) => {
    setCart(prev => {
      const cleanNotes = (notes || '').trim();
      const existingIdx = prev.findIndex(ci => ci.foodItem.id === item.id && (ci.notes || '').trim() === cleanNotes);
      if (existingIdx !== -1) {
        return prev.map((ci, idx) => idx === existingIdx ? { ...ci, quantity: ci.quantity + qty } : ci);
      }
      return [
        ...prev,
        {
          foodItem: item,
          quantity: qty,
          notes: cleanNotes || undefined,
          tableNumber: currentTable || 'Table 1'
        }
      ];
    });
    showNotification(`Added "${item.name}" to cart`);
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => prev.map((ci, idx) => idx === index ? { ...ci, quantity } : ci));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (customerName: string, paymentMethod: 'pos' | 'cash' | 'transfer' = 'pos'): Order | null => {
    if (cart.length === 0) return null;

    const total = cart.reduce((sum, ci) => sum + ci.foodItem.price * ci.quantity, 0);
    const orderTable = currentTable || 'Table 1';

    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      restaurantId: activeRestaurant.id,
      tableNumber: orderTable,
      customerName: customerName.trim() || `Diner at ${orderTable}`,
      items: [...cart],
      total,
      status: 'pending',
      createdAt: 'Just now',
      source: isNfcSource ? 'nfc' : 'qr'
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    playKitchenChime();
    syncOrderToSupabase(newOrder);
    showNotification(`🎉 Order sent to ${activeRestaurant.name}'s kitchen from ${orderTable}!`);
    return newOrder;
  };

  const callWaiter = (reason: WaiterCall['reason']) => {
    const tableNum = currentTable || 'Table 1';
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      restaurantId: activeRestaurant.id,
      tableNumber: tableNum,
      reason,
      timestamp: 'Just now',
      status: 'active'
    };
    setWaiterCalls(prev => [newCall, ...prev]);
    syncWaiterCallToSupabase(newCall);
    showNotification(`🔔 Waiter buzzed for ${tableNum}: ${reason}`);
  };

  const resolveWaiterCall = (id: string) => {
    setWaiterCalls(prev => prev.filter(c => c.id !== id));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    showNotification(`Order #${orderId} marked as ${status}`);
  };

  const toggleTenantStatus = (tenantId: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== tenantId) return r;
      const nextStatus = r.status === 'active' ? 'suspended' : 'active';
      return { ...r, status: nextStatus };
    }));
  };

  const createNewTenant = (name: string, templateId: MenuTemplateId) => {
    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newId = `rest-${Date.now()}`;
    const preset = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS.nigerian;

    const newRest: RestaurantTenant = {
      id: newId,
      slug: cleanSlug,
      name,
      tagline: 'Fresh Flavours & Quality Dining',
      logo: '🍽️',
      coverImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
      address: 'Main Street',
      phone: '+234 800 000 0000',
      openingHours: '10:00 AM - 10:00 PM',
      plan: 'Growth QR+Menu',
      status: 'active',
      quickMenuEnabled: true,
      allowOrdering: true,
      tableOrderingEnabled: true,
      design: { ...preset.design },
      tables: [],
      pages: []
    };

    setRestaurants(prev => [...prev, newRest]);
    setActiveRestaurantId(newId);
  };

  return (
    <AppContext.Provider
      value={{
        restaurants,
        activeRestaurant,
        activeRestaurantId,
        currentView,
        currentTable,
        isNfcSource,
        cart,
        orders,
        waiterCalls,
        notificationMsg,
        isCustomerRoute,
        restaurantNotFound,
        requestedSlug,
        ownerSession,
        setCurrentView,
        switchRestaurant,
        showNotification,
        setCurrentTable,
        logoutOwner,
        updateRestaurantMeta,
        updateDesign,
        applyTemplate,
        updatePage,
        addPage,
        deletePage,
        duplicatePage,
        reorderPages,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        toggleSoldOut,
        registerTableTag,
        updateTableStatus,
        replaceDamagedTag,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        callWaiter,
        resolveWaiterCall,
        updateOrderStatus,
        toggleTenantStatus,
        createNewTenant,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
