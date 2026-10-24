import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RestaurantTenant, FoodItem, Order, WaiterCall, MenuBookPage } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikkljurxmfwmhhumoiqo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vSVJBftn3OHtozdV6GKMjA_KHIlJEo8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage keys for resilient offline fallback
const STORAGE_PREFIX = 'dinetap_';
const KEY_RESTAURANTS = `${STORAGE_PREFIX}restaurants_v3`;
const KEY_ORDERS = `${STORAGE_PREFIX}orders_v3`;
const KEY_AUTH_SESSION = `${STORAGE_PREFIX}current_owner_v3`;

export interface OwnerSession {
  userId: string;
  email: string;
  restaurantId: string;
  restaurantSlug: string;
}

/**
 * Convert a File object from an <input type="file"> to a base64 Data URL.
 * Works immediately on all devices and offline without needing storage bucket configs.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Compress/resize if very large
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Local cache helpers
 */
export function getStoredRestaurants(): RestaurantTenant[] {
  try {
    const raw = localStorage.getItem(KEY_RESTAURANTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local restaurants', e);
  }
  return [];
}

export function saveStoredRestaurants(restaurants: RestaurantTenant[]) {
  try {
    localStorage.setItem(KEY_RESTAURANTS, JSON.stringify(restaurants));
  } catch (e) {
    console.warn('Failed to save local restaurants', e);
  }
}

export function getActiveSession(): OwnerSession | null {
  try {
    const raw = localStorage.getItem(KEY_AUTH_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setActiveSession(session: OwnerSession | null) {
  if (session) {
    localStorage.setItem(KEY_AUTH_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(KEY_AUTH_SESSION);
  }
}

/**
 * Convert Supabase database row to frontend RestaurantTenant
 */
function mapDbRowToRestaurant(rRow: any, itemRows: any[] = []): RestaurantTenant {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currency = rRow.currency || '₦';

  // Group items by category into pages
  const itemsByCategory: Record<string, FoodItem[]> = {};
  if (Array.isArray(itemRows) && itemRows.length > 0) {
    itemRows.forEach(it => {
      const cat = it.category || 'Specialities';
      if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
      itemsByCategory[cat].push({
        id: it.id,
        name: it.name,
        description: it.description || '',
        price: Number(it.price) || 0,
        imageUrl: it.image_url || undefined,
        badge: it.badge || undefined,
        isSoldOut: Boolean(it.is_sold_out),
        prepTime: it.prep_time || '15 min',
        allergens: it.allergens || []
      });
    });
  }

  // Generate pages: Page 1 is Cover, subsequent pages are categories
  const pages: MenuBookPage[] = [
    {
      id: `p-${rRow.id}-cover`,
      pageNumber: 1,
      title: 'Welcome',
      subtitle: rRow.tagline || 'Digital Menu Book',
      layout: 'cover',
      backgroundImage: rRow.cover_image || undefined,
      items: []
    }
  ];

  const categories = Object.keys(itemsByCategory);
  if (categories.length > 0) {
    categories.forEach((catName, idx) => {
      pages.push({
        id: `p-${rRow.id}-${idx + 2}`,
        pageNumber: idx + 2,
        title: catName,
        subtitle: `${catName} crafted fresh daily`,
        layout: idx === 0 ? 'chef_specials' : 'two_column_grid',
        items: itemsByCategory[catName]
      });
    });
  } else {
    // Empty starter page ready for dishes (NO mock dishes)
    pages.push({
      id: `p-${rRow.id}-2`,
      pageNumber: 2,
      title: 'Menu',
      subtitle: 'Dishes prepared fresh to order',
      layout: 'chef_specials',
      items: []
    });
  }

  // Create initial 5 tables for QR / NFC
  const tables = [1, 2, 3, 4, 5].map(num => ({
    id: `tbl-${rRow.id}-${num}`,
    tableNumber: `Table ${num}`,
    label: `Table ${num}`,
    section: 'Dining Area',
    ntagSerial: `04:FA:${num.toString().padStart(2, '0')}:88:22:90:${num.toString().padStart(2, '0')}`,
    nfcStatus: 'active' as const,
    totalTaps: 0,
    totalScans: 0,
    urlPayload: `${origin}/?r=${rRow.slug}&table=Table+${num}`
  }));

  const coverColor = rRow.cover_color || rRow.primary_color || '#0c2e22';
  const accentColor = rRow.accent_color || '#d4af37';

  return {
    id: rRow.id,
    slug: rRow.slug,
    name: rRow.name,
    tagline: rRow.tagline || 'Kitchen & Bar',
    logo: rRow.logo || '🛡️',
    coverImage: rRow.cover_image || '',
    address: rRow.address || '',
    phone: rRow.phone || '',
    openingHours: rRow.opening_hours || '10:00 AM - 10:00 PM',
    plan: rRow.plan || 'basic',
    tableLimit: (rRow.table_limit !== undefined && rRow.table_limit !== null) ? Number(rRow.table_limit) : undefined,
    status: (rRow.status as any) || 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      templateId: 'emerald_gold',
      paperTexture: 'emerald_leather',
      fontStyle: 'serif_luxury',
      primaryColor: coverColor,
      accentColor: accentColor,
      coverColor: coverColor,
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: currency,
    },
    tables,
    pages
  };
}

/**
 * Fetch a restaurant by its slug from Supabase (or fallback to local cache).
 * This ensures ANY phone or device scanning the QR code loads the real menu!
 */
export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantTenant | null> {
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Try Supabase query
  if (supabase) {
    try {
      const { data: rRow, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (rRow && !rErr) {
        // Fetch menu items for this restaurant
        const { data: itemRows } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', rRow.id)
          .order('sort_order', { ascending: true });

        const mapped = mapDbRowToRestaurant(rRow, itemRows || []);
        // Cache locally for offline resilience
        const existing = getStoredRestaurants().filter(r => r.slug !== cleanSlug);
        saveStoredRestaurants([...existing, mapped]);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchRestaurantBySlug query error:', err);
    }
  }

  // 2. Fallback to local cache
  const stored = getStoredRestaurants();
  const match = stored.find(r => r.slug.toLowerCase() === cleanSlug);
  return match || null;
}

/**
 * Register a new restaurant in Supabase & local storage
 */
export async function registerRestaurant(data: {
  name: string;
  slug: string;
  email: string;
  password?: string;
  currency?: string;
  tagline?: string;
  logo?: string;
  coverColor?: string;
  plan?: string;
  tableLimit?: number | null;
}): Promise<{ success: boolean; restaurant?: RestaurantTenant; error?: string }> {
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (!cleanSlug) {
    return { success: false, error: 'Please enter a valid URL slug (letters, numbers, dashes).' };
  }

  const newId = `rest-${Date.now()}`;
  let ownerId = `usr-${Date.now()}`;
  const coverColor = data.coverColor || '#0c2e22';
  const initialPlan = (data.plan || 'basic').toLowerCase();
  const initialTableLimit = data.tableLimit ?? null;

  // 1. Try Supabase Auth
  if (supabase && data.password && data.email) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authData?.user) {
        ownerId = authData.user.id;
      } else if (authErr && (authErr.message?.includes('already registered') || authErr.message?.includes('exists'))) {
        // User already in auth.users; try to log in to obtain ownerId
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInData?.user) {
          ownerId = signInData.user.id;
        }
      }
    } catch (e) {
      console.warn('Supabase auth signup attempt:', e);
    }
  }

  // 2. Insert into Supabase restaurants table
  if (supabase) {
    try {
      // First attempt: include plan and table_limit
      let { error: insErr } = await supabase.from('restaurants').insert([
        {
          id: newId,
          owner_id: ownerId,
          name: data.name.trim(),
          slug: cleanSlug,
          tagline: data.tagline?.trim() || 'Kitchen & Bar',
          logo: data.logo || '🛡️',
          currency: data.currency || '₦',
          plan: initialPlan,
          table_limit: initialTableLimit,
        }
      ]);

      // If 'plan' or 'table_limit' columns do not exist in Supabase (PostgreSQL error 42703),
      // retry with base schema columns so restaurant creation ALWAYS succeeds!
      if (insErr && (insErr.code === '42703' || insErr.message?.includes('column') || insErr.message?.includes('plan'))) {
        console.warn('Note: restaurants.plan column not yet added to Supabase. Inserting with base schema.');
        const retry = await supabase.from('restaurants').insert([
          {
            id: newId,
            owner_id: ownerId,
            name: data.name.trim(),
            slug: cleanSlug,
            tagline: data.tagline?.trim() || 'Kitchen & Bar',
            logo: data.logo || '🛡️',
            currency: data.currency || '₦',
          }
        ]);
        insErr = retry.error;
      }

      if (insErr) {
        // If slug conflict
        if (insErr.code === '23505' || insErr.message?.includes('duplicate key') || insErr.message?.includes('unique')) {
          return { success: false, error: `The menu link "/?r=${cleanSlug}" is already taken. Please choose another slug.` };
        }
        console.warn('Supabase restaurant insert notice:', insErr.message);
      }
    } catch (e: any) {
      console.warn('Supabase register error:', e);
    }
  }

  // 3. Build local model (NO mock dishes)
  const newRestaurant = mapDbRowToRestaurant({
    id: newId,
    name: data.name.trim(),
    slug: cleanSlug,
    tagline: data.tagline?.trim() || 'Kitchen & Bar',
    logo: data.logo || '🛡️',
    currency: data.currency || '₦',
    cover_color: coverColor,
    plan: initialPlan,
    table_limit: initialTableLimit,
  }, []);

  // Save to local cache (new restaurant first)
  const stored = getStoredRestaurants().filter(r => r.slug !== cleanSlug);
  saveStoredRestaurants([newRestaurant, ...stored]);

  // Set session
  const session: OwnerSession = {
    userId: ownerId,
    email: data.email,
    restaurantId: newId,
    restaurantSlug: cleanSlug,
  };
  setActiveSession(session);

  return { success: true, restaurant: newRestaurant };
}

/**
 * Log into restaurant owner account
 */
export async function loginRestaurantOwner(
  emailOrSlug: string,
  password?: string
): Promise<{ success: boolean; session?: OwnerSession; restaurant?: RestaurantTenant; error?: string }> {
  const cleanQuery = emailOrSlug.trim().toLowerCase();
  const cleanPass = password?.trim() || '';

  if (!cleanQuery) {
    return { success: false, error: 'Please enter your restaurant email or slug.' };
  }

  // 1. If input is an email address, verify via Supabase Auth
  if (supabase && cleanQuery.includes('@')) {
    if (!cleanPass) {
      return { success: false, error: 'Please enter your account password to sign in with an email address.' };
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanQuery,
        password: cleanPass,
      });

      if (authErr || !authData?.user) {
        return { 
          success: false, 
          error: authErr?.message || 'Invalid email or password. Please try again.' 
        };
      }

      const userId = authData.user.id;
      // Query Supabase for the active restaurant owned by this user
      const { data: rRow, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!rRow || rErr) {
        // User account exists in Supabase Auth, but the restaurant was deleted by an admin!
        await supabase.auth.signOut().catch(() => {});
        setActiveSession(null);
        // Clear from local cache
        const stored = getStoredRestaurants().filter(r => r.name.toLowerCase() !== cleanQuery);
        saveStoredRestaurants(stored);
        return { 
          success: false, 
          error: 'Your restaurant menu has been deleted or removed by an administrator. Please register a new menu account.' 
        };
      }

      if (rRow.status === 'suspended') {
        return { 
          success: false, 
          error: 'This restaurant account has been temporarily suspended by platform administration.' 
        };
      }

      const { data: itemRows } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', rRow.id);

      const mapped = mapDbRowToRestaurant(rRow, itemRows || []);
      const sess: OwnerSession = {
        userId,
        email: cleanQuery,
        restaurantId: rRow.id,
        restaurantSlug: rRow.slug,
      };
      setActiveSession(sess);
      const existing = getStoredRestaurants().filter(r => r.id !== rRow.id);
      saveStoredRestaurants([mapped, ...existing]);
      return { success: true, session: sess, restaurant: mapped };
    } catch (e: any) {
      console.warn('Supabase auth sign in error:', e);
      return { success: false, error: e?.message || 'Authentication failed. Please verify your credentials.' };
    }
  }

  // 2. Query Supabase directly by slug or ID
  if (supabase) {
    try {
      const cleanSlugCandidate = cleanQuery.replace(/[^a-z0-9-]+/g, '-');
      const { data: rRow, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .or(`slug.eq.${cleanSlugCandidate},slug.eq.${cleanQuery},id.eq.${cleanQuery}`)
        .limit(1)
        .maybeSingle();

      if (!rRow || rErr) {
        // Invalidate active session if it was this slug
        const activeSess = getActiveSession();
        if (activeSess && (activeSess.restaurantSlug === cleanQuery || activeSess.restaurantId === cleanQuery)) {
          setActiveSession(null);
        }
        return { 
          success: false, 
          error: `No active restaurant found for "${emailOrSlug}". It may have been deleted or the slug is incorrect.` 
        };
      }

      if (rRow.status === 'suspended') {
        return { 
          success: false, 
          error: 'This restaurant is currently suspended by platform administration.' 
        };
      }

      const { data: itemRows } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', rRow.id);

      const mapped = mapDbRowToRestaurant(rRow, itemRows || []);
      const sess: OwnerSession = {
        userId: rRow.owner_id || `user-${rRow.id}`,
        email: cleanQuery,
        restaurantId: rRow.id,
        restaurantSlug: rRow.slug,
      };
      setActiveSession(sess);
      const existing = getStoredRestaurants().filter(r => r.id !== rRow.id);
      saveStoredRestaurants([mapped, ...existing]);
      return { success: true, session: sess, restaurant: mapped };
    } catch (e: any) {
      console.warn('Supabase login check error:', e);
      return { success: false, error: 'Could not connect to database. Please check your network connection.' };
    }
  }

  // 3. Offline fallback ONLY if Supabase is completely unconfigured
  const stored = getStoredRestaurants();
  const matched = stored.find(r => 
    r.slug.toLowerCase() === cleanQuery || 
    r.id === cleanQuery
  );

  if (matched) {
    const sess: OwnerSession = {
      userId: `user-${matched.id}`,
      email: cleanQuery,
      restaurantId: matched.id,
      restaurantSlug: matched.slug,
    };
    setActiveSession(sess);
    return { success: true, session: sess, restaurant: matched };
  }

  return { success: false, error: `No restaurant found matching "${emailOrSlug}".` };
}

/**
 * Persist an order to Supabase
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (!order.restaurantId) {
      console.warn('Cannot sync order without restaurantId');
      return false;
    }

    // Clean payload matching exact Supabase orders table schema
    const basePayload: Record<string, any> = {
      id: order.id,
      restaurant_id: order.restaurantId,
      table_number: order.tableNumber || 'Table 1',
      customer_name: order.customerName || 'Guest Diner',
      items: order.items || [],
      total: Number(order.total) || 0,
      status: order.status || 'pending',
      source: order.source || 'qr',
    };

    const { error } = await supabase.from('orders').insert([basePayload]);

    if (error) {
      console.warn('Supabase order sync notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase order sync error:', err);
    return false;
  }
}

/**
 * Persist a waiter call buzzer
 */
export async function syncWaiterCallToSupabase(call: WaiterCall): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (!call.restaurantId) {
      console.warn('Cannot sync waiter call without restaurantId');
      return false;
    }

    const { error } = await supabase.from('waiter_calls').insert([
      {
        id: call.id,
        restaurant_id: call.restaurantId,
        table_number: call.tableNumber,
        reason: call.reason,
        status: call.status,
      },
    ]);

    if (error) {
      console.warn('Supabase waiter call notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase waiter sync error:', err);
    return false;
  }
}

/**
 * Fetch orders for a restaurant from Supabase
 */
export async function fetchOrdersFromSupabase(restaurantId: string, slug?: string): Promise<Order[]> {
  if (!supabase || !restaurantId) return [];
  try {
    let query = supabase.from('orders').select('*');
    if (slug && slug !== restaurantId) {
      query = query.or(`restaurant_id.eq.${restaurantId},restaurant_id.eq.${slug}`);
    } else {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (data && !error) {
      return data.map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        tableNumber: row.table_number,
        customerName: row.customer_name || 'Guest Diner',
        items: row.items || [],
        total: Number(row.total) || 0,
        status: row.status || 'pending',
        createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: row.source || 'qr'
      }));
    }
  } catch (e) {
    console.warn('Fetch orders error:', e);
  }
  return [];
}

/**
 * Fetch waiter buzzer calls from Supabase
 */
export async function fetchWaiterCallsFromSupabase(restaurantId: string, slug?: string): Promise<WaiterCall[]> {
  if (!supabase || !restaurantId) return [];
  try {
    let query = supabase.from('waiter_calls').select('*');
    if (slug && slug !== restaurantId) {
      query = query.or(`restaurant_id.eq.${restaurantId},restaurant_id.eq.${slug}`);
    } else {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query
      .eq('status', 'active')
      .order('timestamp', { ascending: false });

    if (data && !error) {
      return data.map(row => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        tableNumber: row.table_number,
        reason: row.reason,
        timestamp: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: row.status
      }));
    }
  } catch (e) {
    console.warn('Fetch waiter calls error:', e);
  }
  return [];
}

/**
 * Update order status in Supabase
 */
export async function updateOrderStatusInSupabase(orderId: string, status: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  } catch (e) {
    console.warn('Update order status error:', e);
  }
}

/**
 * Dismiss/resolve waiter call in Supabase
 */
export async function resolveWaiterCallInSupabase(callId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('waiter_calls').update({ status: 'resolved' }).eq('id', callId);
  } catch (e) {
    console.warn('Resolve waiter call error:', e);
  }
}

/**
 * Save a dish to Supabase menu_items table
 */
export async function saveDishToSupabase(restaurantId: string, item: FoodItem, category: string = 'Specialities'): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('menu_items').upsert({
      id: item.id,
      restaurant_id: restaurantId,
      category,
      name: item.name,
      description: item.description,
      price: item.price,
      badge: item.badge || '',
      image_url: item.imageUrl || '',
      prep_time: item.prepTime || '15 min',
      allergens: item.allergens || [],
      is_sold_out: Boolean(item.isSoldOut)
    });
  } catch (e) {
    console.warn('Save dish to Supabase error:', e);
  }
}

/**
 * Delete dish from Supabase
 */
export async function deleteDishFromSupabase(itemId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('menu_items').delete().eq('id', itemId);
  } catch (e) {
    console.warn('Delete dish from Supabase error:', e);
  }
}

/**
 * Fetch all registered restaurants from Supabase for Super Admin
 */
export async function fetchAllRestaurantsFromSupabase(): Promise<RestaurantTenant[]> {
  const localList = getStoredRestaurants();
  if (supabase) {
    try {
      const { data: rRows, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (rRows && !rErr) {
        // Fetch all menu items
        const { data: allItems } = await supabase.from('menu_items').select('*');
        const itemsByRestId: Record<string, any[]> = {};
        if (allItems) {
          allItems.forEach(it => {
            if (!itemsByRestId[it.restaurant_id]) itemsByRestId[it.restaurant_id] = [];
            itemsByRestId[it.restaurant_id].push(it);
          });
        }

        const dbRestaurants = rRows.map(r => {
          const mapped = mapDbRowToRestaurant(r, itemsByRestId[r.id] || []);
          // Check local cache for client-side plan / limit overrides
          const cached = localList.find(c => c.id === r.id || c.slug === r.slug);
          if (cached) {
            if (cached.plan && !r.plan) mapped.plan = cached.plan;
            if (cached.tableLimit !== undefined && r.table_limit === undefined) mapped.tableLimit = cached.tableLimit;
          }
          return mapped;
        });

        // Supabase is the single source of truth: strictly sync and purge deleted restaurants
        saveStoredRestaurants(dbRestaurants);
        return dbRestaurants;
      }
    } catch (e) {
      console.warn('Super Admin fetch all restaurants error:', e);
    }
  }
  return localList;
}

/**
 * Update restaurant status in Supabase
 */
export async function updateRestaurantStatusInSupabase(restaurantId: string, status: 'active' | 'suspended'): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('restaurants').update({ status }).eq('id', restaurantId);
  } catch (e) {
    console.warn('Update restaurant status error:', e);
  }
}

/**
 * Update restaurant plan and optional tableLimit override in Supabase + local cache
 */
export async function updateRestaurantPlanInSupabase(
  restaurantId: string,
  plan: string,
  tableLimit: number | null
): Promise<void> {
  // Update local cache first for instant UI feedback
  const stored = getStoredRestaurants();
  const updated = stored.map(r => r.id === restaurantId ? { ...r, plan, tableLimit } : r);
  saveStoredRestaurants(updated);

  if (!supabase) return;
  try {
    const { error } = await supabase.from('restaurants').update({
      plan,
      table_limit: tableLimit  // store null = unlimited
    }).eq('id', restaurantId);

    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      console.warn('Note: restaurants.plan column not yet in Supabase schema. Saved in local cache.');
    }
  } catch (e) {
    console.warn('Update restaurant plan error:', e);
  }
}

/**
 * Cloud Settings Sync (for subscription plans & platform configurations)
 */
export async function savePlatformSettingsToSupabase(key: string, value: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('platform_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchPlatformSettingsFromSupabase(key: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (data && !error) return data.value;
  } catch {
    // Fall back to local
  }
  return null;
}

/**
 * Platform WhatsApp & Contact Settings
 */
export interface PlatformContactConfig {
  whatsappNumber: string;
  whatsappMessage: string;
  supportEmail: string;
}

export const DEFAULT_PLATFORM_CONTACT: PlatformContactConfig = {
  whatsappNumber: '2348000000000',
  whatsappMessage: "Hello TapMenu Team! I'd like to learn more about digital menus for my restaurant.",
  supportEmail: 'support@tapmenu.me'
};

const KEY_PLATFORM_CONTACT = 'tapmenu_platform_contact_v1';

export function getStoredPlatformContact(): PlatformContactConfig {
  try {
    const raw = localStorage.getItem(KEY_PLATFORM_CONTACT);
    if (raw) return { ...DEFAULT_PLATFORM_CONTACT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PLATFORM_CONTACT;
}

export async function fetchPlatformContactConfig(): Promise<PlatformContactConfig> {
  const stored = getStoredPlatformContact();
  if (!supabase) return stored;
  try {
    const remote = await fetchPlatformSettingsFromSupabase('platform_contact');
    if (remote && remote.whatsappNumber) {
      const merged = { ...DEFAULT_PLATFORM_CONTACT, ...remote };
      localStorage.setItem(KEY_PLATFORM_CONTACT, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.debug('Failed to fetch remote platform contact config:', err);
  }
  return stored;
}

export async function savePlatformContactConfig(config: Partial<PlatformContactConfig>): Promise<boolean> {
  const current = getStoredPlatformContact();
  const rawNum = config.whatsappNumber !== undefined ? config.whatsappNumber : current.whatsappNumber;
  const cleanNumber = rawNum.replace(/[^0-9]/g, '');

  const updated: PlatformContactConfig = {
    ...current,
    ...config,
    whatsappNumber: cleanNumber || current.whatsappNumber,
  };

  localStorage.setItem(KEY_PLATFORM_CONTACT, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tapmenu_contact_updated', { detail: updated }));
  }

  if (supabase) {
    try {
      await savePlatformSettingsToSupabase('platform_contact', updated);
    } catch (e) {
      console.warn('Failed to save platform contact to Supabase:', e);
    }
  }
  return true;
}

export async function deleteRestaurantFromSupabase(restaurantId: string): Promise<void> {
  // 1. Immediately purge from local storage cache so it NEVER resurrects
  try {
    const stored = getStoredRestaurants();
    const updated = stored.filter(r => r.id !== restaurantId && r.slug !== restaurantId);
    saveStoredRestaurants(updated);

    const activeSess = getActiveSession();
    if (activeSess && (activeSess.restaurantId === restaurantId || activeSess.restaurantSlug === restaurantId)) {
      setActiveSession(null);
    }
  } catch (e) {
    console.warn('Local cache cleanup on restaurant delete error:', e);
  }

  // 2. Delete all records from Supabase tables
  if (supabase) {
    try {
      await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId);
      await supabase.from('orders').delete().eq('restaurant_id', restaurantId);
      await supabase.from('waiter_calls').delete().eq('restaurant_id', restaurantId);
      await supabase.from('restaurants').delete().eq('id', restaurantId);
    } catch (e) {
      console.warn('Delete restaurant from Supabase error:', e);
    }
  }

  // 3. Broadcast deletion event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tapmenu_restaurant_deleted', { detail: { restaurantId } }));
  }
}

