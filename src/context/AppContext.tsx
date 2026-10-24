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
import { syncOrderToSupabase, syncWaiterCallToSupabase } from '../utils/supabase';

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
  
  // Navigation / View actions
  setCurrentView: (view: AppViewMode) => void;
  switchRestaurant: (id: string) => void;
  setTableContext: (table: string | null, isNfc?: boolean) => void;
  simulateNfcTap: (tableNumber: string) => void;
  showNotification: (msg: string) => void;

  // Editor Actions
  updateRestaurantMeta: (data: Partial<RestaurantTenant>) => void;
  updateDesign: (design: Partial<MenuBookDesign>) => void;
  applyTemplate: (templateId: MenuTemplateId) => void;
  updatePage: (pageId: string, data: Partial<MenuBookPage>) => void;
  addPage: (layout?: PageLayoutType) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIdx: number, toIdx: number) => void;
  addFoodItem: (pageId: string, item: Omit<FoodItem, 'id'>) => void;
  updateFoodItem: (pageId: string, itemId: string, data: Partial<FoodItem>) => void;
  deleteFoodItem: (pageId: string, itemId: string) => void;
  toggleSoldOut: (pageId: string, itemId: string) => void;

  // Table & NFC Actions
  registerTableTag: (tableNumber: string, label: string, section: string, ntagSerial: string) => void;
  updateTableStatus: (tableId: string, status: NfcStatus) => void;
  replaceDamagedTag: (tableId: string, newSerial: string) => void;

  // Ordering & Waiter Actions
  addToCart: (item: FoodItem, notes?: string, qty?: number) => void;
  updateCartItemQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  placeOrder: (customerName: string) => Order | null;
  callWaiter: (reason: WaiterCall['reason']) => void;
  resolveWaiterCall: (id: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Super Admin
  toggleTenantStatus: (tenantId: string) => void;
  createNewTenant: (name: string, templateId: MenuTemplateId) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_RESTAURANTS = 'dinetap_restaurants_v1';
const STORAGE_KEY_ORDERS = 'dinetap_orders_v1';
const STORAGE_KEY_CALLS = 'dinetap_calls_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESTAURANTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    return INITIAL_RESTAURANTS;
  });

  const [activeRestaurantId, setActiveRestaurantId] = useState<string>('rest-lagos-bites');
  const [currentView, setCurrentView] = useState<AppViewMode>('flipbook');
  const [currentTable, setCurrentTable] = useState<string | null>('Table 04');
  const [isNfcSource, setIsNfcSource] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'ord-101',
        restaurantId: 'rest-lagos-bites',
        tableNumber: 'Table 04',
        customerName: 'Chidi Okafor',
        items: [
          {
            foodItem: INITIAL_RESTAURANTS[0].pages[1].items[0],
            quantity: 2,
            notes: 'Extra yaji pepper on the side'
          },
          {
            foodItem: INITIAL_RESTAURANTS[0].pages[2].items[0],
            quantity: 1,
            notes: 'Well charred chicken please'
          }
        ],
        total: 15500,
        status: 'preparing',
        createdAt: '12 mins ago',
        source: 'nfc'
      }
    ];
  });
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALLS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Check URL query parameters on initial mount (e.g., ?tenant=lagos-bites&table=Table+02&src=nfc)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('tenant');
      const tableParam = params.get('table');
      const srcParam = params.get('src');

      if (tenantParam) {
        const found = restaurants.find(r => r.slug === tenantParam || r.id === tenantParam);
        if (found) setActiveRestaurantId(found.id);
      }
      if (tableParam) {
        setCurrentTable(decodeURIComponent(tableParam));
      }
      if (srcParam === 'nfc') {
        setIsNfcSource(true);
      }
    }
  }, [restaurants]);

  // Persist restaurants
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESTAURANTS, JSON.stringify(restaurants));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [restaurants]);

  // Persist orders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }, [orders]);

  // Active restaurant reference
  const activeRestaurant = restaurants.find(r => r.id === activeRestaurantId) || restaurants[0];

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3800);
  };

  const switchRestaurant = (id: string) => {
    const found = restaurants.find(r => r.id === id);
    if (found) {
      setActiveRestaurantId(id);
      showNotification(`Switched to ${found.name}`);
    }
  };

  const setTableContext = (table: string | null, isNfc = false) => {
    setCurrentTable(table);
    setIsNfcSource(isNfc);
  };

  const simulateNfcTap = (tableNumber: string) => {
    setCurrentTable(tableNumber);
    setIsNfcSource(true);
    setCurrentView('flipbook');
    showNotification(`⚡ NTAG213 Tap Detected! Loaded ${activeRestaurant.name} at ${tableNumber}`);
  };

  const updateRestaurantMeta = (data: Partial<RestaurantTenant>) => {
    setRestaurants(prev => prev.map(r => r.id === activeRestaurantId ? { ...r, ...data } : r));
    showNotification('Restaurant settings saved');
  };

  const updateDesign = (design: Partial<MenuBookDesign>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          design: { ...r.design, ...design }
        };
      }
      return r;
    }));
  };

  const applyTemplate = (templateId: MenuTemplateId) => {
    const preset = TEMPLATE_PRESETS[templateId];
    if (!preset) return;

    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          design: {
            ...preset.design,
            currencySymbol: r.design.currencySymbol || '₦',
          }
        };
      }
      return r;
    }));
    showNotification(`Applied ${preset.name} template style`);
  };

  const updatePage = (pageId: string, data: Partial<MenuBookPage>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          pages: r.pages.map(p => p.id === pageId ? { ...p, ...data } : p)
        };
      }
      return r;
    }));
  };

  const addPage = (layout: PageLayoutType = 'two_column_grid') => {
    const newPage: MenuBookPage = {
      id: `p-${Date.now()}`,
      pageNumber: activeRestaurant.pages.length + 1,
      title: 'New Menu Section',
      subtitle: 'Add culinary specialities to this page',
      layout,
      items: [
        {
          id: `it-${Date.now()}`,
          name: 'House Speciality',
          description: 'Crafted with premium ingredients and seasonal garnish.',
          price: 4500,
          badge: 'Popular',
          prepTime: '15 min'
        }
      ]
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        const pages = [...r.pages, newPage].map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        return { ...r, pages };
      }
      return r;
    }));
    showNotification('New page added to menu book');
  };

  const deletePage = (pageId: string) => {
    if (activeRestaurant.pages.length <= 1) {
      showNotification('Cannot delete the only page in your menu');
      return;
    }
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        const pages = r.pages.filter(p => p.id !== pageId).map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        return { ...r, pages };
      }
      return r;
    }));
    showNotification('Page removed');
  };

  const duplicatePage = (pageId: string) => {
    const targetPage = activeRestaurant.pages.find(p => p.id === pageId);
    if (!targetPage) return;

    const dup: MenuBookPage = {
      ...targetPage,
      id: `p-${Date.now()}`,
      title: `${targetPage.title} (Copy)`,
      items: targetPage.items.map(it => ({ ...it, id: `it-${Date.now()}-${Math.random().toString(36).substring(7)}` }))
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        const index = r.pages.findIndex(p => p.id === pageId);
        const newPages = [...r.pages];
        newPages.splice(index + 1, 0, dup);
        return {
          ...r,
          pages: newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
        };
      }
      return r;
    }));
    showNotification('Page duplicated');
  };

  const reorderPages = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= activeRestaurant.pages.length || toIdx >= activeRestaurant.pages.length) return;
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        const newPages = [...r.pages];
        const [moved] = newPages.splice(fromIdx, 1);
        newPages.splice(toIdx, 0, moved);
        return {
          ...r,
          pages: newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
        };
      }
      return r;
    }));
  };

  const addFoodItem = (pageId: string, itemData: Omit<FoodItem, 'id'>) => {
    const newItem: FoodItem = {
      ...itemData,
      id: `it-${Date.now()}`
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id === pageId) {
              return { ...p, items: [...p.items, newItem] };
            }
            return p;
          })
        };
      }
      return r;
    }));
    showNotification(`Added "${newItem.name}" to page`);
  };

  const updateFoodItem = (pageId: string, itemId: string, data: Partial<FoodItem>) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id === pageId) {
              return {
                ...p,
                items: p.items.map(it => it.id === itemId ? { ...it, ...data } : it)
              };
            }
            return p;
          })
        };
      }
      return r;
    }));
  };

  const deleteFoodItem = (pageId: string, itemId: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id === pageId) {
              return { ...p, items: p.items.filter(it => it.id !== itemId) };
            }
            return p;
          })
        };
      }
      return r;
    }));
    showNotification('Item removed');
  };

  const toggleSoldOut = (pageId: string, itemId: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id === pageId) {
              return {
                ...p,
                items: p.items.map(it => it.id === itemId ? { ...it, isSoldOut: !it.isSoldOut } : it)
              };
            }
            return p;
          })
        };
      }
      return r;
    }));
  };

  const registerTableTag = (tableNumber: string, label: string, section: string, ntagSerial: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newTable = {
      id: `tbl-${Date.now()}`,
      tableNumber,
      label,
      section,
      ntagSerial: ntagSerial || `04:${Math.random().toString(16).substring(2, 4).toUpperCase()}:${Math.random().toString(16).substring(2, 4).toUpperCase()}:11`,
      nfcStatus: 'active' as NfcStatus,
      totalTaps: 0,
      totalScans: 0,
      urlPayload: `${origin}/?tenant=${activeRestaurant.slug}&table=${encodeURIComponent(tableNumber)}&src=nfc`
    };

    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          tables: [...r.tables, newTable]
        };
      }
      return r;
    }));
    showNotification(`Registered NTAG213 for ${tableNumber}`);
  };

  const updateTableStatus = (tableId: string, status: NfcStatus) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          tables: r.tables.map(t => t.id === tableId ? { ...t, nfcStatus: status } : t)
        };
      }
      return r;
    }));
    showNotification(`Table tag status updated to ${status}`);
  };

  const replaceDamagedTag = (tableId: string, newSerial: string) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id === activeRestaurantId) {
        return {
          ...r,
          tables: r.tables.map(t => t.id === tableId ? { ...t, ntagSerial: newSerial, nfcStatus: 'active' } : t)
        };
      }
      return r;
    }));
    showNotification('Replacement NTAG213 tag assigned and activated');
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
          tableNumber: currentTable || 'Table 01'
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

  const placeOrder = (customerName: string): Order | null => {
    if (cart.length === 0) return null;

    const total = cart.reduce((sum, ci) => sum + ci.foodItem.price * ci.quantity, 0);
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      restaurantId: activeRestaurant.id,
      tableNumber: currentTable || 'Table 01',
      customerName: customerName.trim() || 'Guest Diner',
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
    showNotification(`Order #${newOrder.id} placed! Kitchen alerted.`);
    return newOrder;
  };

  const callWaiter = (reason: WaiterCall['reason']) => {
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      restaurantId: activeRestaurant.id,
      tableNumber: currentTable || 'Table 01',
      reason,
      timestamp: 'Just now',
      status: 'active'
    };
    setWaiterCalls(prev => [newCall, ...prev]);
    syncWaiterCallToSupabase(newCall);
    showNotification(`🔔 Waiter called for ${currentTable || 'Table 01'}: ${reason}`);
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
      if (r.id === tenantId) {
        const nextStatus = r.status === 'active' ? 'suspended' : 'active';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const createNewTenant = (name: string, templateId: MenuTemplateId) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const preset = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS.nigerian;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const newRestaurant: RestaurantTenant = {
      id: `rest-${Date.now()}`,
      slug,
      name,
      tagline: 'Modern Dining & Curated Menu',
      logo: '🍽️',
      coverImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
      address: 'Lagos, Nigeria',
      phone: '+234 800 000 0000',
      openingHours: '10:00 AM - 10:00 PM',
      plan: 'Growth QR+Menu',
      status: 'active',
      quickMenuEnabled: true,
      allowOrdering: true,
      tableOrderingEnabled: true,
      design: { ...preset.design },
      tables: [
        {
          id: `tbl-${Date.now()}`,
          tableNumber: 'Table 01',
          label: 'Main Table 01',
          section: 'Dining Room',
          ntagSerial: '04:FA:22:90:81:44:00',
          nfcStatus: 'active',
          totalTaps: 0,
          totalScans: 0,
          urlPayload: `${origin}/?tenant=${slug}&table=Table+01&src=nfc`
        }
      ],
      pages: [
        {
          id: `p-${Date.now()}-1`,
          pageNumber: 1,
          title: 'Cover Page',
          subtitle: `Welcome to ${name}`,
          layout: 'cover',
          backgroundImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
          items: []
        },
        {
          id: `p-${Date.now()}-2`,
          pageNumber: 2,
          title: 'Chef Starters',
          subtitle: 'Artisan appetizers',
          layout: 'hero_three_items',
          items: [
            {
              id: `it-${Date.now()}-1`,
              name: 'House Signature Starter',
              description: 'Freshly prepared with aromatic local spices and herb dressing.',
              price: 3500,
              badge: 'Chef Special',
              prepTime: '10 min'
            }
          ]
        }
      ]
    };

    setRestaurants(prev => [...prev, newRestaurant]);
    setActiveRestaurantId(newRestaurant.id);
    showNotification(`New restaurant "${name}" created with ${preset.name} template!`);
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
        setCurrentView,
        switchRestaurant,
        setTableContext,
        simulateNfcTap,
        showNotification,
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
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
