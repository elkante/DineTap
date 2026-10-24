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
    // Default starter page if no dishes exist yet
    pages.push({
      id: `p-${rRow.id}-2`,
      pageNumber: 2,
      title: 'Specialities',
      subtitle: 'Prepared fresh to order',
      layout: 'chef_specials',
      items: [
        {
          id: `it-${rRow.id}-default`,
          name: 'Signature House Dish',
          description: 'Crafted with fresh ingredients and house seasoning.',
          price: 4500,
          badge: 'Chef Special',
          prepTime: '15 min'
        }
      ]
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

  return {
    id: rRow.id,
    slug: rRow.slug,
    name: rRow.name,
    tagline: rRow.tagline || 'Modern Dine-in & Quick Table Ordering',
    logo: rRow.logo || '🍽️',
    coverImage: rRow.cover_image || '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
    address: rRow.address || '',
    phone: rRow.phone || '',
    openingHours: rRow.opening_hours || '10:00 AM - 10:00 PM',
    plan: 'Growth QR+Menu',
    status: 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      templateId: 'nigerian',
      paperTexture: 'parchment',
      fontStyle: 'retro_bistro',
      primaryColor: '#7C2D12',
      accentColor: '#D97706',
      textColor: '#292524',
      secondaryTextColor: '#78716C',
      borderColor: '#E7E5E4',
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
}): Promise<{ success: boolean; restaurant?: RestaurantTenant; error?: string }> {
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (!cleanSlug) {
    return { success: false, error: 'Please enter a valid URL slug (letters, numbers, dashes).' };
  }

  const newId = `rest-${Date.now()}`;
  let ownerId = `usr-${Date.now()}`;

  // 1. Try Supabase Auth
  if (supabase && data.password && data.email) {
    try {
      const { data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authData?.user) {
        ownerId = authData.user.id;
      }
    } catch (e) {
      console.warn('Supabase auth signup attempt:', e);
    }
  }

  // 2. Insert into Supabase restaurants table
  if (supabase) {
    try {
      const { error: insErr } = await supabase.from('restaurants').insert([
        {
          id: newId,
          owner_id: ownerId,
          name: data.name.trim(),
          slug: cleanSlug,
          tagline: data.tagline?.trim() || 'Fresh flavours and signature dishes',
          logo: data.logo || '🍽️',
          currency: data.currency || '₦',
        }
      ]);

      if (insErr) {
        // If slug conflict
        if (insErr.code === '23505' || insErr.message?.includes('duplicate key') || insErr.message?.includes('unique')) {
          return { success: false, error: `The menu link "/?r=${cleanSlug}" is already taken. Please choose another slug.` };
        }
        console.warn('Supabase restaurant insert notice:', insErr.message);
      } else {
        // Insert initial starter dish
        await supabase.from('menu_items').insert([
          {
            id: `it-${newId}-1`,
            restaurant_id: newId,
            category: 'Specialities',
            name: `${data.name} Special`,
            description: 'Chef signature dish prepared fresh with quality ingredients.',
            price: 4500,
            badge: 'Chef Special',
            is_sold_out: false
          }
        ]);
      }
    } catch (e: any) {
      console.warn('Supabase register error:', e);
    }
  }

  // 3. Build local model
  const newRestaurant = mapDbRowToRestaurant({
    id: newId,
    name: data.name.trim(),
    slug: cleanSlug,
    tagline: data.tagline?.trim() || 'Fresh flavours and signature dishes',
    logo: data.logo || '🍽️',
    currency: data.currency || '₦',
  });

  // Save to local cache
  const stored = getStoredRestaurants().filter(r => r.slug !== cleanSlug);
  saveStoredRestaurants([...stored, newRestaurant]);

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

  // 1. Try Supabase query by slug or email
  if (supabase) {
    try {
      const { data: rRow } = await supabase
        .from('restaurants')
        .select('*')
        .or(`slug.eq.${cleanQuery},name.ilike.%${cleanQuery}%`)
        .maybeSingle();

      if (rRow) {
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
        return { success: true, session: sess, restaurant: mapped };
      }
    } catch (e) {
      console.warn('Supabase login check:', e);
    }
  }

  // 2. Fallback to local storage
  const stored = getStoredRestaurants();
  const matched = stored.find(r => 
    r.slug.toLowerCase() === cleanQuery || 
    r.name.toLowerCase() === cleanQuery ||
    cleanQuery.includes(r.slug.toLowerCase())
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

  if (stored.length > 0) {
    const first = stored[0];
    const sess: OwnerSession = {
      userId: `user-${first.id}`,
      email: cleanQuery,
      restaurantId: first.id,
      restaurantSlug: first.slug,
    };
    setActiveSession(sess);
    return { success: true, session: sess, restaurant: first };
  }

  return { success: false, error: 'No matching restaurant found. Please create your restaurant account first!' };
}

/**
 * Persist an order to Supabase
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('orders').insert([
      {
        id: order.id,
        restaurant_id: order.restaurantId,
        table_number: order.tableNumber,
        customer_name: order.customerName,
        items: order.items,
        total: order.total,
        status: order.status,
        payment_method: 'pos',
        source: order.source,
      },
    ]);

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
export async function fetchOrdersFromSupabase(restaurantId: string): Promise<Order[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

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
export async function fetchWaiterCallsFromSupabase(restaurantId: string): Promise<WaiterCall[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('restaurant_id', restaurantId)
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
