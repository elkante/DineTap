import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  WaiterCall,
  TableNfcTag
} from '../types';
import { INITIAL_RESTAURANTS, TEMPLATE_PRESETS, createDefaultRestaurantTenant } from '../data/initialData';
import { playKitchenChime } from '../utils/audio';
import { notifyKitchenNewTicket, setAppBadgeCount } from '../utils/pwaNotifications';
import { 
  syncOrderToSupabase, 
  syncWaiterCallToSupabase, 
  fetchRestaurantBySlug,
  fetchOrdersFromSupabase,
  fetchWaiterCallsFromSupabase,
  updateOrderStatusInSupabase,
  resolveWaiterCallInSupabase,
  saveDishToSupabase,
  deleteDishFromSupabase,
  renameCategoryInSupabase,
  getActiveSession, 
  setActiveSession as saveActiveSession, 
  OwnerSession,
  getStoredRestaurants,
  saveStoredRestaurants,
  syncRestaurantTablesToSupabase,
  syncRestaurantMetaToSupabase,
  KEY_RESTAURANTS,
  supabase
} from '../utils/supabase';
import { getStoredPlans } from '../utils/pricingConfig';
import { getNetworkVerifiedDate, formatNetworkTime } from '../utils/networkTime';

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
  addPage: (layout: PageLayoutType, categoryTitle?: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  addFoodItem: (pageId: string, item: Omit<FoodItem, 'id'>, customId?: string, categoryName?: string) => FoodItem | void;
  updateFoodItem: (pageId: string, itemId: string, updates: Partial<FoodItem>, categoryName?: string) => void;
  deleteFoodItem: (pageId: string, itemId: string) => void;
  toggleSoldOut: (pageId: string, itemId: string) => void;

  // NFC & Tables
  registerTableTag: (tableNumber: string, label: string, section: string, nfcSerial: string) => void;
  bulkGenerateTables: (count: number) => void;
  deleteTable: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: NfcStatus) => void;
  replaceDamagedTag: (tableId: string, newSerial: string) => void;
  simulateNfcTap: (tableNumber: string) => void;

  // Ordering & Waiter Actions
  addToCart: (item: FoodItem, notes?: string, qty?: number) => void;
  updateCartItemQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  placeOrder: (
    customerName: string, 
    paymentMethod?: 'pos' | 'cash' | 'transfer', 
    extraDetails?: { 
      customerPhone?: string; 
      subtotal?: number; 
      vat?: number;
      orderType?: 'dine_in' | 'takeaway' | 'both';
      packagingFee?: number;
      packCount?: number;
    }
  ) => Order | null;
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

const EMPTY_RESTAURANT: RestaurantTenant = {
  id: '',
  slug: '',
  name: 'Restaurant Menu',
  tagline: 'Kitchen & Bar',
  logo: '🛡️',
  coverImage: '',
  address: '',
  phone: '',
  openingHours: 'Open Daily: 11:00 AM - 11:00 PM',
  plan: 'Growth QR+Menu',
  status: 'active',
  quickMenuEnabled: true,
  allowOrdering: true,
  tableOrderingEnabled: true,
  design: {
    templateId: 'emerald_gold',
    paperTexture: 'emerald_leather',
    fontStyle: 'serif_luxury',
    primaryColor: '#0c2e22',
    accentColor: '#d4af37',
    coverColor: '#0c2e22',
    textColor: '#1c1917',
    secondaryTextColor: '#78716c',
    borderColor: '#e7e5e4',
    showPageNumbers: true,
    enableAudioEffect: true,
    showPriceSymbols: true,
    currencySymbol: '₦',
  },
  tables: [],
  pages: []
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load restaurants: check local storage first (NO mock fallback)
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(() => {
    return getStoredRestaurants();
  });

  const [activeRestaurantId, setActiveRestaurantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const slugParam = params.get('r') || params.get('tenant') || params.get('restaurant');
      if (slugParam) {
        const stored = getStoredRestaurants();
        const found = stored.find(r => r.slug.toLowerCase() === slugParam.toLowerCase() || r.id === slugParam);
        return found ? found.id : '';
      }
    }
    const sess = getActiveSession();
    if (sess?.restaurantId) return sess.restaurantId;
    return '';
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

      // 1. Immediate match in local state if available
      const localMatch = restaurants.find(r => 
        r.slug.toLowerCase() === slugParam.toLowerCase() || 
        r.id === slugParam
      );

      if (localMatch) {
        setActiveRestaurantId(localMatch.id);
        setRestaurantNotFound(false);
      }

      // 2. Query Supabase so ANY phone or external device gets the real restaurant
      fetchRestaurantBySlug(slugParam).then(remote => {
        if (remote) {
          setRestaurants(prev => {
            const rest = prev.filter(r => r.id !== remote.id && r.slug !== remote.slug);
            // If remote has fewer items than local cache due to async lag, preserve local items
            const currLocal = prev.find(r => r.id === remote.id || r.slug.toLowerCase() === remote.slug.toLowerCase());
            const localHasItems = currLocal && currLocal.pages.some(p => p.items.length > 0);
            const remoteHasItems = remote.pages.some(p => p.items.length > 0);

            const toSave = (!remoteHasItems && localHasItems && currLocal) ? { ...remote, pages: currLocal.pages } : remote;
            return [toSave, ...rest];
          });
          setActiveRestaurantId(remote.id);
          setRestaurantNotFound(false);
        } else if (!localMatch) {
          setRestaurantNotFound(true);
        }
      }).catch(err => {
        console.warn('Error fetching restaurant by slug:', err);
        if (!localMatch) setRestaurantNotFound(true);
      });

      if (tableParam) {
        setCurrentTable(decodeURIComponent(tableParam));
      }
      // No fallback: only show a table badge when explicitly arriving via a table-specific link

      if (srcParam === 'nfc') {
        setIsNfcSource(true);
      }
    } else {
      setIsCustomerRoute(false);
      setRestaurantNotFound(false);

      // Persistent Owner Session: KEEP USER LOGGED IN until they manually click Log Out!
      const session = getActiveSession();
      if (session) {
        setOwnerSessionState(session);
        if (session.restaurantId) {
          setActiveRestaurantId(session.restaurantId);
        }
        // Graceful non-destructive background sync from Supabase
        if (supabase) {
          (async () => {
            try {
              const { data: rRow } = await supabase
                .from('restaurants')
                .select('id, slug, status')
                .or(`id.eq.${session.restaurantId},slug.eq.${session.restaurantSlug}`)
                .maybeSingle();

              if (rRow) {
                const remote = await fetchRestaurantBySlug(rRow.slug);
                if (remote) {
                  setRestaurants(prev => [remote, ...prev.filter(r => r.id !== remote.id)]);
                  setActiveRestaurantId(remote.id);
                }
              }
            } catch (err) {
              console.debug('Background sync notice (session maintained):', err);
            }
          })();
        }
      }
    }

    const handleSessionUpdated = (e: any) => {
      const sess = e.detail || getActiveSession();
      setOwnerSessionState(sess);
      if (sess?.restaurantId) {
        setActiveRestaurantId(sess.restaurantId);
      }
    };
    window.addEventListener('tapmenu_session_updated', handleSessionUpdated);

    const handlePlanUpdated = (e: any) => {
      const { restaurantId, plan, tableLimit } = e.detail || {};
      if (restaurantId) {
        setRestaurants(prev => prev.map(r => 
          r.id === restaurantId ? { ...r, plan, tableLimit: tableLimit !== undefined ? tableLimit : r.tableLimit } : r
        ));
      }
    };
    window.addEventListener('tapmenu_plan_updated', handlePlanUpdated);

    const handleTablesUpdated = (e: any) => {
      const { restaurantId, tables } = e.detail || {};
      if (restaurantId && Array.isArray(tables)) {
        setRestaurants(prev => prev.map(r => 
          r.id === restaurantId ? { ...r, tables } : r
        ));
      }
    };
    window.addEventListener('tapmenu_tables_updated', handleTablesUpdated);

    const handleStatusUpdated = (e: any) => {
      const { restaurantId, status } = e.detail || {};
      if (restaurantId && status) {
        setRestaurants(prev => prev.map(r => 
          r.id === restaurantId ? { ...r, status } : r
        ));
      }
    };
    window.addEventListener('tapmenu_status_updated', handleStatusUpdated);

    const handleRestaurantDeleted = (e: any) => {
      const deletedId = e.detail?.restaurantId;
      setRestaurants(prev => prev.filter(r => r.id !== deletedId));
    };
    window.addEventListener('tapmenu_restaurant_deleted', handleRestaurantDeleted);

    return () => {
      window.removeEventListener('tapmenu_session_updated', handleSessionUpdated);
      window.removeEventListener('tapmenu_plan_updated', handlePlanUpdated);
      window.removeEventListener('tapmenu_tables_updated', handleTablesUpdated);
      window.removeEventListener('tapmenu_status_updated', handleStatusUpdated);
      window.removeEventListener('tapmenu_restaurant_deleted', handleRestaurantDeleted);
    };
  }, []);

  // Active restaurant reference: strictly match customer requested slug or owner session, NEVER leak stale cached restaurants
  const activeRestaurant = useMemo(() => {
    if (isCustomerRoute && requestedSlug) {
      const match = restaurants.find(r => 
        r.slug.toLowerCase() === requestedSlug.toLowerCase() || 
        r.id === requestedSlug
      );
      if (match) return match;

      // ── Instant Customer View (0ms feedback) ──
      // Derive restaurant name immediately from URL slug so customer sees the restaurant name at 0ms!
      const humanizedName = requestedSlug
        .split(/[-_+]+/)
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      return {
        ...EMPTY_RESTAURANT,
        id: requestedSlug,
        slug: requestedSlug,
        name: humanizedName || 'Restaurant Menu',
        tagline: 'Fresh Kitchen & Bar',
        logo: '🍽️',
        pages: []
      };
    }
    if (ownerSession?.restaurantId || ownerSession?.restaurantSlug) {
      const owned = restaurants.find(r => 
        (ownerSession.restaurantId && r.id === ownerSession.restaurantId) ||
        (ownerSession.restaurantSlug && r.slug.toLowerCase() === ownerSession.restaurantSlug.toLowerCase())
      );
      if (owned) return owned;
    }
    if (activeRestaurantId) {
      const found = restaurants.find(r => r.id === activeRestaurantId);
      if (found) return found;
    }
    return restaurants[0] || EMPTY_RESTAURANT;
  }, [restaurants, activeRestaurantId, isCustomerRoute, requestedSlug, ownerSession]);

  // Real-time synchronization: Supabase Realtime + Multi-tab BroadcastChannel + Local Storage + Polling fallback
  useEffect(() => {
    const targetRestId = activeRestaurant.id || activeRestaurantId || (
      ownerSession?.restaurantId || ''
    );
    const targetSlug = activeRestaurant.slug || requestedSlug || ownerSession?.restaurantSlug || '';

    if (!targetRestId && !targetSlug) return;

    let isMounted = true;

    // Helper to dispatch loud kitchen chime, OS App Badge count (e.g. 2 for 2 orders), and push notifications
    const triggerKitchenAlert = (ticket: {
      title: string;
      body: string;
      type: 'order' | 'waiter';
      tableNumber?: string;
    }) => {
      if (isCustomerRoute) return;
      const currentPending = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
      const currentCalls = waiterCalls.length;
      const count = currentPending + currentCalls + 1;
      notifyKitchenNewTicket({
        title: ticket.title,
        body: ticket.body,
        badgeCount: count,
        ticketType: ticket.type,
        tableNumber: ticket.tableNumber,
      });
    };

    // 1. Cross-tab BroadcastChannel listener for instant same-browser updates
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcast = new BroadcastChannel('tapmenu_live_sync');
        broadcast.onmessage = (event) => {
          if (!isMounted) return;
          const { type, order, call, orderId, status } = event.data || {};
          if (type === 'NEW_ORDER' && order) {
            setOrders(prev => {
              if (prev.some(o => o.id === order.id)) return prev;
              triggerKitchenAlert({
                title: `🍽️ New Order (Table ${order.tableNumber})`,
                body: order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
                type: 'order',
                tableNumber: order.tableNumber,
              });
              return [order, ...prev];
            });
          } else if (type === 'ORDER_STATUS_UPDATE' && orderId) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
          } else if (type === 'NEW_WAITER_CALL' && call) {
            setWaiterCalls(prev => {
              if (prev.some(c => c.id === call.id)) return prev;
              triggerKitchenAlert({
                title: `🛎️ Table ${call.tableNumber} Calling Waiter!`,
                body: `Table ${call.tableNumber} requested assistance (${call.reason || 'Service'}).`,
                type: 'waiter',
                tableNumber: call.tableNumber,
              });
              return [call, ...prev];
            });
          } else if (type === 'WAITER_CALL_RESOLVED' && event.data.callId) {
            setWaiterCalls(prev => prev.filter(c => c.id !== event.data.callId));
          } else if (type === 'PLAN_UPDATED' && event.data.restaurantId) {
            setRestaurants(prev => prev.map(r => 
              r.id === event.data.restaurantId
                ? { ...r, plan: event.data.plan, tableLimit: event.data.tableLimit !== undefined ? event.data.tableLimit : r.tableLimit }
                : r
            ));
          } else if (type === 'TABLES_UPDATED' && event.data.restaurantId && Array.isArray(event.data.tables)) {
            setRestaurants(prev => prev.map(r => 
              r.id === event.data.restaurantId
                ? { ...r, tables: event.data.tables }
                : r
            ));
          } else if (type === 'STATUS_UPDATED' && event.data.restaurantId && event.data.status) {
            setRestaurants(prev => prev.map(r => 
              r.id === event.data.restaurantId
                ? { ...r, status: event.data.status }
                : r
            ));
          }
        };
      }
    } catch {}

    // 2. Storage event listener (standard cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (!isMounted) return;
      if (e.key === STORAGE_KEY_ORDERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(prev => {
              const prevIds = new Set(prev.map(o => o.id));
              const hasNew = parsed.some(o => !prevIds.has(o.id));
              if (hasNew && !isCustomerRoute) playKitchenChime();
              return parsed;
            });
          }
        } catch {}
      } else if (e.key === STORAGE_KEY_CALLS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWaiterCalls(parsed);
          }
        } catch {}
      } else if (e.key === KEY_RESTAURANTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRestaurants(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Supabase Realtime Channel
    let supabaseChannel: any = null;
    if (supabase && targetRestId) {
      try {
        supabaseChannel = supabase
          .channel(`kds-sync-${targetRestId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'restaurants' },
            (payload: any) => {
              if (!isMounted || !payload.new) return;
              const row = payload.new;
              setRestaurants(prev => prev.map(r => {
                if (r.id === row.id || r.slug === row.slug) {
                  return {
                    ...r,
                    plan: row.plan || r.plan,
                    tableLimit: row.table_limit !== undefined ? (row.table_limit === null ? undefined : Number(row.table_limit)) : r.tableLimit,
                    status: row.status || r.status,
                    name: row.name || r.name,
                    tagline: row.tagline || r.tagline
                  };
                }
                return r;
              }));
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload: any) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT' && payload.new) {
                const row = payload.new;
                const matchesRest = row.restaurant_id === targetRestId || (targetSlug && row.restaurant_id === targetSlug);
                if (!matchesRest) return;

                const rawDate = row.created_at;
                const normalizedDate = typeof rawDate === 'string' && rawDate.includes(' ') && !rawDate.includes('T')
                  ? rawDate.replace(' ', 'T')
                  : rawDate;
                const d = normalizedDate ? new Date(normalizedDate) : new Date();
                const safeTime = !isNaN(d.getTime()) 
                  ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const safeTs = !isNaN(d.getTime()) ? d.getTime() : Date.now();

                const mapped: Order = {
                  id: row.id,
                  restaurantId: row.restaurant_id,
                  tableNumber: row.table_number,
                  customerName: row.customer_name || 'Guest Diner',
                  customerPhone: row.customer_phone || undefined,
                  items: row.items || [],
                  subtotal: row.subtotal ? Number(row.subtotal) : undefined,
                  vat: row.vat ? Number(row.vat) : undefined,
                  total: Number(row.total) || 0,
                  paymentMethod: row.payment_method || row.paymentMethod || undefined,
                  status: row.status || 'pending',
                  createdAt: safeTime,
                  createdAtTimestamp: safeTs,
                  source: row.source || 'qr',
                  orderType: row.order_type || row.orderType || 'dine_in',
                  packagingFee: row.packaging_fee ? Number(row.packaging_fee) : undefined,
                  packCount: row.pack_count ? Number(row.pack_count) : undefined
                };

                setOrders(prev => {
                  if (prev.some(o => o.id === mapped.id)) return prev;
                  triggerKitchenAlert({
                    title: `🍽️ New Order (Table ${mapped.tableNumber})`,
                    body: mapped.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
                    type: 'order',
                    tableNumber: mapped.tableNumber,
                  });
                  return [mapped, ...prev];
                });
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const row = payload.new;
                setOrders(prev => prev.map(o => o.id === row.id ? { ...o, status: row.status } : o));
              } else if (payload.eventType === 'DELETE' && payload.old) {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'waiter_calls' },
            (payload: any) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT' && payload.new) {
                const row = payload.new;
                const matchesRest = row.restaurant_id === targetRestId || (targetSlug && row.restaurant_id === targetSlug);
                if (!matchesRest) return;

                const mapped: WaiterCall = {
                  id: row.id,
                  restaurantId: row.restaurant_id,
                  tableNumber: row.table_number,
                  reason: row.reason,
                  timestamp: new Date(row.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: row.status
                };

                setWaiterCalls(prev => {
                  if (prev.some(c => c.id === mapped.id)) return prev;
                  triggerKitchenAlert({
                    title: `🛎️ Table ${mapped.tableNumber} Calling Waiter!`,
                    body: `Table ${mapped.tableNumber} requested assistance (${mapped.reason || 'Service'}).`,
                    type: 'waiter',
                    tableNumber: mapped.tableNumber,
                  });
                  return [mapped, ...prev];
                });
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const row = payload.new;
                if (row.status === 'resolved') {
                  setWaiterCalls(prev => prev.filter(c => c.id !== row.id));
                }
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menu_items' },
            (payload: any) => {
              if (!isMounted) return;
              const row = payload.new || payload.old;
              if (!row) return;
              const matchesRest = row.restaurant_id === targetRestId || (targetSlug && row.restaurant_id === targetSlug);
              if (!matchesRest) return;

              const slugToFetch = targetSlug || activeRestaurant.slug;
              if (slugToFetch) {
                fetchRestaurantBySlug(slugToFetch).then(remote => {
                  if (remote && isMounted) {
                    setRestaurants(prev => [remote, ...prev.filter(r => r.id !== remote.id && r.slug !== remote.slug)]);
                  }
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel subscription notice:', err);
      }
    }

    // 4. Reliable Polling Loop (every 2.5 seconds)
    const pollSupabase = async () => {
      try {
        const queryId = targetRestId || targetSlug;
        const [remoteOrders, remoteCalls] = await Promise.all([
          fetchOrdersFromSupabase(queryId, targetSlug),
          fetchWaiterCallsFromSupabase(queryId, targetSlug)
        ]);

        if (!isMounted) return;

        if (Array.isArray(remoteOrders)) {
          setOrders(prev => {
            const prevMap = new Map(prev.map(o => [o.id, o]));
            const newOrders = remoteOrders.filter(ro => !prevMap.has(ro.id));

            if (newOrders.length > 0 && !isCustomerRoute) {
              const latest = newOrders[0];
              triggerKitchenAlert({
                title: `🍽️ New Order (Table ${latest.tableNumber})`,
                body: latest.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
                type: 'order',
                tableNumber: latest.tableNumber,
              });
            }

            // Merge: remote orders are authoritative, but preserve optimistic local fields (like paymentMethod if missing in remote)
            const mergedMap = new Map<string, Order>();
            remoteOrders.forEach(o => {
              const local = prevMap.get(o.id);
              mergedMap.set(o.id, {
                ...o,
                paymentMethod: o.paymentMethod || local?.paymentMethod || undefined,
                orderType: o.orderType || local?.orderType || 'dine_in',
                packagingFee: o.packagingFee ?? local?.packagingFee,
                packCount: o.packCount ?? local?.packCount,
              });
            });
            prev.forEach(o => {
              if (!mergedMap.has(o.id)) {
                mergedMap.set(o.id, o);
              }
            });
            return Array.from(mergedMap.values());
          });
        }

        if (Array.isArray(remoteCalls)) {
          setWaiterCalls(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            const newCalls = remoteCalls.filter(c => !prevIds.has(c.id));
            if (newCalls.length > 0 && !isCustomerRoute) {
              const latest = newCalls[0];
              triggerKitchenAlert({
                title: `🛎️ Table ${latest.tableNumber} Calling Waiter!`,
                body: `Table ${latest.tableNumber} requested assistance (${latest.reason || 'Service'}).`,
                type: 'waiter',
                tableNumber: latest.tableNumber,
              });
            }
            return remoteCalls;
          });
        }
      } catch {}
    };

    pollSupabase();
    const interval = setInterval(pollSupabase, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      try { broadcast?.close(); } catch {}
      try { if (supabaseChannel) supabase.removeChannel(supabaseChannel); } catch {}
    };
  }, [activeRestaurant.id, activeRestaurant.slug, activeRestaurantId, isCustomerRoute, ownerSession]);

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

  // Synchronize OS App Badge count (e.g. 2 if 2 active tickets received) on installed PWA icon
  useEffect(() => {
    if (isCustomerRoute) return;
    const targetRestId = activeRestaurant.id || activeRestaurantId || (ownerSession?.restaurantId || '');
    const targetSlug = activeRestaurant.slug || requestedSlug || ownerSession?.restaurantSlug || '';

    const pendingOrders = orders.filter(o => {
      const match = !o.restaurantId || o.restaurantId === targetRestId || (targetSlug && o.restaurantId.toLowerCase() === targetSlug.toLowerCase());
      return match && (o.status === 'pending' || o.status === 'preparing');
    });

    const activeCalls = waiterCalls.filter(c => {
      return !c.restaurantId || c.restaurantId === targetRestId || (targetSlug && c.restaurantId.toLowerCase() === targetSlug.toLowerCase());
    });

    const activeTicketCount = pendingOrders.length + activeCalls.length;
    setAppBadgeCount(activeTicketCount);
  }, [orders, waiterCalls, isCustomerRoute, activeRestaurant.id, activeRestaurant.slug, activeRestaurantId, requestedSlug, ownerSession]);


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
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return { ...r, ...meta };
      });
      saveStoredRestaurants(updated);
      return updated;
    });
    if (activeRestaurantId) {
      syncRestaurantMetaToSupabase(activeRestaurantId, meta);
    }
    showNotification('Restaurant profile updated');
  };

  const updateDesign = (designUpdates: Partial<MenuBookDesign>) => {
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return {
          ...r,
          design: { ...r.design, ...designUpdates }
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });
    if (activeRestaurantId) {
      syncRestaurantMetaToSupabase(activeRestaurantId, { design: { ...activeRestaurant.design, ...designUpdates } });
    }
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
    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    const targetPage = targetRest?.pages?.find(p => p.id === pageId);
    const oldTitle = targetPage?.title || '';

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return {
          ...r,
          pages: r.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    // If section title / category was renamed, update all associated dishes in Supabase!
    if (updates.title && oldTitle && updates.title.trim().toLowerCase() !== oldTitle.trim().toLowerCase() && targetRest?.id) {
      renameCategoryInSupabase(targetRest.id, oldTitle.trim(), updates.title.trim());
    }
  };

  const addPage = (layout: PageLayoutType, categoryTitle?: string) => {
    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    const newPageNum = (targetRest?.pages?.length || 0) + 1;
    const title = categoryTitle?.trim() || `Page ${newPageNum}`;
    const newPage: MenuBookPage = {
      id: `p-${Date.now()}`,
      pageNumber: newPageNum,
      title,
      subtitle: `${title} crafted fresh daily`,
      layout,
      items: []
    };

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return { ...r, pages: [...r.pages, newPage] };
      });
      saveStoredRestaurants(updated);
      return updated;
    });
    showNotification(`Added new "${title}" page`);
  };

  const deletePage = (pageId: string) => {
    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    if (targetRest && targetRest.pages.length <= 1) {
      showNotification('Cannot delete the only page in your menu');
      return;
    }
    const targetPage = targetRest?.pages.find(p => p.id === pageId);

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        const filtered = r.pages.filter(p => p.id !== pageId);
        const renumbered = filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        return { ...r, pages: renumbered };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    // Delete any dishes on that page from Supabase
    if (targetPage && targetPage.items.length > 0) {
      targetPage.items.forEach(it => {
        deleteDishFromSupabase(it.id);
      });
    }

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

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        const idx = r.pages.findIndex(p => p.id === pageId);
        const newPages = [...r.pages];
        newPages.splice(idx + 1, 0, duplicated);
        return {
          ...r,
          pages: newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }))
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });
    showNotification('Page duplicated');
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        const pagesCopy = [...r.pages];
        const [moved] = pagesCopy.splice(fromIndex, 1);
        pagesCopy.splice(toIndex, 0, moved);
        return {
          ...r,
          pages: pagesCopy.map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });
  };

  const addFoodItem = (pageId: string, itemData: Omit<FoodItem, 'id'>, customId?: string, categoryName?: string): FoodItem => {
    const newItem: FoodItem = {
      ...itemData,
      id: customId || `it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };

    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    const targetPage = targetRest.pages.find(p => p.id === pageId);
    const resolvedCatTitle = (categoryName || targetPage?.title || 'Main Menu').trim();

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        const pageExists = r.pages.some(p => p.id === pageId);
        if (!pageExists) {
          const newPage: MenuBookPage = {
            id: pageId,
            pageNumber: r.pages.length + 1,
            title: resolvedCatTitle,
            subtitle: `${resolvedCatTitle} prepared fresh to order`,
            layout: 'two_column_grid',
            items: [newItem]
          };
          return { ...r, pages: [...r.pages, newPage] };
        }
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id !== pageId) return p;
            return { ...p, items: [...p.items, newItem] };
          })
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    // Auto-persist directly to Supabase & local cache with real category
    if (targetRest?.id) {
      saveDishToSupabase(targetRest.id, newItem, resolvedCatTitle);
    }

    showNotification(`Added "${newItem.name}" to ${resolvedCatTitle}`);
    return newItem;
  };

  const updateFoodItem = (pageId: string, itemId: string, updates: Partial<FoodItem>, categoryName?: string) => {
    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    const targetPage = targetRest.pages.find(p => p.id === pageId);
    const resolvedCatTitle = (categoryName || targetPage?.title || 'Main Menu').trim();

    const currentItem = targetPage?.items.find(it => it.id === itemId);
    const updatedItem: FoodItem | null = currentItem ? { ...currentItem, ...updates } : null;

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id !== pageId) return p;
            return {
              ...p,
              items: p.items.map(it => {
                if (it.id === itemId) {
                  return { ...it, ...updates };
                }
                return it;
              })
            };
          })
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (targetRest?.id && updatedItem) {
      saveDishToSupabase(targetRest.id, updatedItem, resolvedCatTitle);
    }
  };

  const deleteFoodItem = (pageId: string, itemId: string) => {
    setRestaurants(prev => {
      const updated = prev.map(r => {
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
      });
      saveStoredRestaurants(updated);
      return updated;
    });
    deleteDishFromSupabase(itemId);
    showNotification('Item removed from menu');
  };

  const toggleSoldOut = (pageId: string, itemId: string) => {
    const targetRest = restaurants.find(r => r.id === activeRestaurantId) || activeRestaurant;
    const targetPage = targetRest.pages.find(p => p.id === pageId);
    const resolvedCatTitle = (targetPage?.title || 'Main Menu').trim();

    const currentItem = targetPage?.items.find(it => it.id === itemId);
    if (!currentItem) return;

    const nextState = !currentItem.isSoldOut;
    const toggledItem: FoodItem = { ...currentItem, isSoldOut: nextState };

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        return {
          ...r,
          pages: r.pages.map(p => {
            if (p.id !== pageId) return p;
            return {
              ...p,
              items: p.items.map(it => it.id === itemId ? toggledItem : it)
            };
          })
        };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (targetRest?.id) {
      saveDishToSupabase(targetRest.id, toggledItem, resolvedCatTitle);
    }
    showNotification(`"${currentItem.name}" marked ${nextState ? 'Sold Out' : 'Available'}`);
  };

  // Helper to determine max tables allowed for a restaurant
  const getTenantMaxTables = (r: RestaurantTenant): number | null => {
    if (r.tableLimit !== undefined && r.tableLimit !== null) return r.tableLimit;
    const plans = getStoredPlans();
    const pl = (r.plan || 'basic').toLowerCase();
    if (pl.includes('enterprise')) return null;
    if (pl.includes('premium')) return plans.find(p => p.id === 'premium')?.maxTables ?? 60;
    if (pl.includes('standard') || pl.includes('growth')) return plans.find(p => p.id === 'standard')?.maxTables ?? 20;
    return plans.find(p => p.id === 'basic')?.maxTables ?? 10;
  };

  const registerTableTag = (tableNumber: string, label: string, section: string, nfcSerial: string) => {
    const target = restaurants.find(r => r.id === activeRestaurantId);
    if (target) {
      const maxTables = getTenantMaxTables(target);
      if (maxTables !== null && target.tables.length >= maxTables) {
        showNotification(`🚫 Table limit reached (${maxTables} max). Upgrade your plan or contact admin.`);
        return;
      }
    }

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

    let updatedTables: TableNfcTag[] = [];
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        updatedTables = [...r.tables, newTag];
        return { ...r, tables: updatedTables };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (activeRestaurantId && updatedTables.length > 0) {
      syncRestaurantTablesToSupabase(activeRestaurantId, updatedTables);
    }
  };

  const updateTableStatus = (tableId: string, status: NfcStatus) => {
    let updatedTables: TableNfcTag[] = [];
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        updatedTables = r.tables.map(t => t.id === tableId ? { ...t, nfcStatus: status } : t);
        return { ...r, tables: updatedTables };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (activeRestaurantId && updatedTables.length > 0) {
      syncRestaurantTablesToSupabase(activeRestaurantId, updatedTables);
    }
  };

  const replaceDamagedTag = (tableId: string, newSerial: string) => {
    let updatedTables: TableNfcTag[] = [];
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        updatedTables = r.tables.map(t => {
          if (t.id !== tableId) return t;
          return { ...t, ntagSerial: newSerial, nfcStatus: 'active' };
        });
        return { ...r, tables: updatedTables };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (activeRestaurantId && updatedTables.length > 0) {
      syncRestaurantTablesToSupabase(activeRestaurantId, updatedTables);
    }
  };

  const bulkGenerateTables = (count: number) => {
    if (count < 1 || count > 100) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let actualCountAdded = 0;
    let updatedTables: TableNfcTag[] = [];

    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        const maxTables = getTenantMaxTables(r);
        const existing = r.tables.length;

        if (maxTables !== null && existing >= maxTables) {
          showNotification(`🚫 Table limit reached (${maxTables} max). Upgrade your plan or contact admin.`);
          return r;
        }

        const allowedCount = maxTables !== null ? Math.min(count, maxTables - existing) : count;
        if (allowedCount <= 0) return r;
        actualCountAdded = allowedCount;

        const slug = r.slug;
        const newTables = Array.from({ length: allowedCount }, (_, i) => {
          const num = existing + i + 1;
          return {
            id: `tbl-${r.id}-${num}-${Date.now() + i}`,
            tableNumber: `Table ${num}`,
            label: `Table ${num}`,
            section: 'Dining Room',
            ntagSerial: `04:${Math.floor(Math.random() * 89 + 10)}:${num.toString().padStart(2, '0')}:${Math.floor(Math.random() * 89 + 10)}`,
            nfcStatus: 'active' as const,
            totalTaps: 0,
            totalScans: 0,
            urlPayload: `${origin}/?r=${slug}&table=Table+${num}`
          };
        });
        updatedTables = [...r.tables, ...newTables];
        return { ...r, tables: updatedTables };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (activeRestaurantId && updatedTables.length > 0) {
      syncRestaurantTablesToSupabase(activeRestaurantId, updatedTables);
    }

    if (actualCountAdded > 0) {
      showNotification(`Generated ${actualCountAdded} new table${actualCountAdded > 1 ? 's' : ''}`);
    }
  };

  const deleteTable = (tableId: string) => {
    let updatedTables: TableNfcTag[] = [];
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id !== activeRestaurantId) return r;
        updatedTables = r.tables.filter(t => t.id !== tableId);
        return { ...r, tables: updatedTables };
      });
      saveStoredRestaurants(updated);
      return updated;
    });

    if (activeRestaurantId) {
      syncRestaurantTablesToSupabase(activeRestaurantId, updatedTables);
    }
    showNotification('Table removed');
  };

  const simulateNfcTap = (tableNumber: string) => {
    setCurrentTable(tableNumber);
    setIsNfcSource(true);
    setCurrentView('flipbook');
    showNotification(`⚡ Smart Card tapped for ${tableNumber}`);
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

  const placeOrder = (
    customerName: string, 
    paymentMethod: 'pos' | 'cash' | 'transfer' = 'pos',
    extraDetails?: { 
      customerPhone?: string; 
      subtotal?: number; 
      vat?: number;
      orderType?: 'dine_in' | 'takeaway' | 'both';
      packagingFee?: number;
      packCount?: number;
    }
  ): Order | null => {
    if (cart.length === 0) return null;

    const calcSubtotal = extraDetails?.subtotal ?? cart.reduce((sum, ci) => sum + ci.foodItem.price * ci.quantity, 0);
    const packagingFee = extraDetails?.packagingFee ?? 0;
    const calcVat = extraDetails?.vat ?? Math.round((calcSubtotal + packagingFee) * 0.075);
    const total = calcSubtotal + packagingFee + calcVat;
    const orderType = extraDetails?.orderType || 'dine_in';
    // For 'both' and 'dine_in', always keep the table; for pure takeaway show "Takeout (TableNum)"
    const orderTable = orderType === 'takeaway'
      ? `Takeout (${currentTable || 'Walk-in'})`
      : (currentTable || 'Table 1');

    let targetRestaurantId = activeRestaurant.id;
    if (!targetRestaurantId && requestedSlug) {
      const match = restaurants.find(r => r.slug.toLowerCase() === requestedSlug.toLowerCase());
      if (match?.id) targetRestaurantId = match.id;
    }
    if (!targetRestaurantId && restaurants.length > 0) {
      targetRestaurantId = restaurants[0].id;
    }

    // Use network-verified date/time so local device clock tampering is prevented
    const networkDate = getNetworkVerifiedDate();
    const nowTs = networkDate.getTime();
    const uniqueId = `ord-${nowTs.toString().slice(-5)}-${Math.floor(Math.random() * 89 + 10)}`;
    const newOrder: Order = {
      id: uniqueId,
      restaurantId: targetRestaurantId,
      tableNumber: orderTable,
      customerName: customerName.trim() || (orderType === 'takeaway' ? `Takeout Customer (${currentTable || 'Walk-in'})` : `Diner at ${orderTable}`),
      customerPhone: extraDetails?.customerPhone?.trim() || undefined,
      items: [...cart],
      subtotal: calcSubtotal,
      vat: calcVat,
      total,
      paymentMethod,
      status: 'pending',
      createdAt: formatNetworkTime(networkDate),
      createdAtTimestamp: nowTs,
      source: isNfcSource ? 'nfc' : 'qr',
      orderType,
      packagingFee: packagingFee > 0 ? packagingFee : undefined,
      packCount: extraDetails?.packCount
    };

    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    clearCart();
    playKitchenChime();

    // Broadcast cross-tab instantly
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tapmenu_live_sync');
        bc.postMessage({ type: 'NEW_ORDER', order: newOrder });
        bc.close();
      }
    } catch {}

    // Persist to Supabase
    syncOrderToSupabase(newOrder);

    showNotification(`🎉 Order sent to ${activeRestaurant.name || 'kitchen'} from ${orderTable}!`);
    return newOrder;
  };

  const callWaiter = (reason: WaiterCall['reason']) => {
    const tableNum = currentTable || 'Table 1';

    let targetRestaurantId = activeRestaurant.id;
    if (!targetRestaurantId && requestedSlug) {
      const match = restaurants.find(r => r.slug.toLowerCase() === requestedSlug.toLowerCase());
      if (match?.id) targetRestaurantId = match.id;
    }
    if (!targetRestaurantId && restaurants.length > 0) {
      targetRestaurantId = restaurants[0].id;
    }

    const uniqueCallId = `call-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 89 + 10)}`;
    const newCall: WaiterCall = {
      id: uniqueCallId,
      restaurantId: targetRestaurantId,
      tableNumber: tableNum,
      reason,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active'
    };

    setWaiterCalls(prev => [newCall, ...prev.filter(c => c.id !== newCall.id)]);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tapmenu_live_sync');
        bc.postMessage({ type: 'NEW_WAITER_CALL', call: newCall });
        bc.close();
      }
    } catch {}

    syncWaiterCallToSupabase(newCall);
    showNotification(`🔔 Waiter buzzed for ${tableNum}: ${reason}`);
  };

  const resolveWaiterCall = (id: string) => {
    setWaiterCalls(prev => prev.filter(c => c.id !== id));

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tapmenu_live_sync');
        bc.postMessage({ type: 'WAITER_CALL_RESOLVED', callId: id });
        bc.close();
      }
    } catch {}

    resolveWaiterCallInSupabase(id);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tapmenu_live_sync');
        bc.postMessage({ type: 'ORDER_STATUS_UPDATE', orderId, status });
        bc.close();
      }
    } catch {}

    updateOrderStatusInSupabase(orderId, status);
    showNotification(`Order marked as ${status}`);
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
    const newRest = createDefaultRestaurantTenant(name, cleanSlug, { templateId });

    setRestaurants(prev => [...prev, newRest]);
    setActiveRestaurantId(newRest.id);
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
        bulkGenerateTables,
        deleteTable,
        updateTableStatus,
        replaceDamagedTag,
        simulateNfcTap,
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
