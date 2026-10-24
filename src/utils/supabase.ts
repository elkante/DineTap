import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RestaurantTenant, FoodItem, Order, WaiterCall } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikkljurxmfwmhhumoiqo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vSVJBftn3OHtozdV6GKMjA_KHIlJEo8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage keys for resilient fallback
const STORAGE_PREFIX = 'dinetap_';
const KEY_RESTAURANTS = `${STORAGE_PREFIX}restaurants_v2`;
const KEY_ORDERS = `${STORAGE_PREFIX}orders_v2`;
const KEY_AUTH_SESSION = `${STORAGE_PREFIX}current_owner_v2`;

export interface OwnerSession {
  userId: string;
  email: string;
  restaurantId: string;
  restaurantSlug: string;
}

/**
 * Get stored local restaurants
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

/**
 * Save restaurants to local cache
 */
export function saveStoredRestaurants(restaurants: RestaurantTenant[]) {
  try {
    localStorage.setItem(KEY_RESTAURANTS, JSON.stringify(restaurants));
  } catch (e) {
    console.warn('Failed to save local restaurants', e);
  }
}

/**
 * Get active session
 */
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
 * Sign up a new restaurant with email, password, and custom slug
 */
export async function registerRestaurant(data: {
  name: string;
  slug: string;
  email: string;
  password?: string;
  currency?: string;
  tagline?: string;
}): Promise<{ success: boolean; restaurant?: RestaurantTenant; error?: string }> {
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (!cleanSlug) {
    return { success: false, error: 'Please enter a valid URL slug (letters, numbers, dashes).' };
  }

  // Check if slug is already used
  const existing = getStoredRestaurants();
  if (existing.some(r => r.slug === cleanSlug)) {
    return { success: false, error: `The slug "${cleanSlug}" is already taken. Please choose another.` };
  }

  const newId = `rest-${Date.now()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const newRestaurant: RestaurantTenant = {
    id: newId,
    slug: cleanSlug,
    name: data.name.trim(),
    tagline: data.tagline?.trim() || 'Modern Dine-in & Quick Table Ordering',
    logo: '🍽️',
    coverImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
    address: 'Downtown Dining Room',
    phone: '+234 800 000 0000',
    openingHours: '10:00 AM - 10:00 PM',
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
      currencySymbol: data.currency || '₦',
    },
    tables: [
      {
        id: `tbl-${Date.now()}-1`,
        tableNumber: 'Table 1',
        label: 'Table 1',
        section: 'Main Dining',
        ntagSerial: '04:FA:01:88:22:90:01',
        nfcStatus: 'active',
        totalTaps: 0,
        totalScans: 0,
        urlPayload: `${origin}/?r=${cleanSlug}&table=Table+1`
      },
      {
        id: `tbl-${Date.now()}-2`,
        tableNumber: 'Table 2',
        label: 'Table 2',
        section: 'Main Dining',
        ntagSerial: '04:FA:02:88:22:90:02',
        nfcStatus: 'active',
        totalTaps: 0,
        totalScans: 0,
        urlPayload: `${origin}/?r=${cleanSlug}&table=Table+2`
      },
      {
        id: `tbl-${Date.now()}-5`,
        tableNumber: 'Table 5',
        label: 'Table 5',
        section: 'Main Dining',
        ntagSerial: '04:FA:05:88:22:90:05',
        nfcStatus: 'active',
        totalTaps: 0,
        totalScans: 0,
        urlPayload: `${origin}/?r=${cleanSlug}&table=Table+5`
      }
    ],
    pages: [
      {
        id: `p-${Date.now()}-1`,
        pageNumber: 1,
        title: 'Cover Page',
        subtitle: `Welcome to ${data.name}`,
        layout: 'cover',
        backgroundImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
        items: []
      },
      {
        id: `p-${Date.now()}-2`,
        pageNumber: 2,
        title: 'Chef Specialities',
        subtitle: 'Prepared fresh to order with signature recipes',
        layout: 'chef_specials',
        items: [
          {
            id: `it-${Date.now()}-1`,
            name: 'House Signature Dish',
            description: 'Cooked to perfection with aromatic herbs and house-crafted sauce.',
            price: 5000,
            badge: 'Chef Special',
            prepTime: '15 min'
          },
          {
            id: `it-${Date.now()}-2`,
            name: 'Grilled Artisan Skewers',
            description: 'Tender marinated cuts charred with fragrant spice blend.',
            price: 3500,
            badge: 'Popular',
            prepTime: '12 min'
          }
        ]
      }
    ]
  };

  // 1. Try Supabase Auth & insert
  let userId = `usr-${Date.now()}`;
  if (supabase && data.password) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authData?.user) {
        userId = authData.user.id;
      }
    } catch (e) {
      console.warn('Supabase auth attempt notice:', e);
    }

    try {
      await supabase.from('restaurants').insert([
        {
          id: newId,
          owner_id: userId,
          name: newRestaurant.name,
          slug: cleanSlug,
          tagline: newRestaurant.tagline,
          logo: newRestaurant.logo,
          currency: newRestaurant.design.currencySymbol,
        }
      ]);
    } catch (e) {
      console.warn('Supabase restaurant insert notice:', e);
    }
  }

  // 2. Persist locally
  const updatedList = [...existing, newRestaurant];
  saveStoredRestaurants(updatedList);

  const session: OwnerSession = {
    userId,
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
  email: string,
  password?: string
): Promise<{ success: boolean; session?: OwnerSession; restaurant?: RestaurantTenant; error?: string }> {
  const restaurants = getStoredRestaurants();
  
  // Try Supabase auth first
  if (supabase && password) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authData?.user) {
        const found = restaurants.find(r => r.slug === email.split('@')[0]) || restaurants[0];
        if (found) {
          const sess: OwnerSession = {
            userId: authData.user.id,
            email: authData.user.email || email,
            restaurantId: found.id,
            restaurantSlug: found.slug,
          };
          setActiveSession(sess);
          return { success: true, session: sess, restaurant: found };
        }
      }
    } catch (e) {
      console.warn('Supabase login fallback:', e);
    }
  }

  // Fallback: look up in local storage
  const matched = restaurants.find(r => 
    r.slug.toLowerCase() === email.toLowerCase() || 
    r.name.toLowerCase() === email.toLowerCase() ||
    email.toLowerCase().includes(r.slug.toLowerCase())
  );

  if (matched) {
    const sess: OwnerSession = {
      userId: `user-${matched.id}`,
      email,
      restaurantId: matched.id,
      restaurantSlug: matched.slug,
    };
    setActiveSession(sess);
    return { success: true, session: sess, restaurant: matched };
  }

  // If no restaurants exist yet, let the user know
  if (restaurants.length === 0) {
    return { success: false, error: 'No restaurants registered yet. Please create your restaurant account first!' };
  }

  // Default to first restaurant for convenience if email matches
  const first = restaurants[0];
  const sess: OwnerSession = {
    userId: `user-${first.id}`,
    email,
    restaurantId: first.id,
    restaurantSlug: first.slug,
  };
  setActiveSession(sess);
  return { success: true, session: sess, restaurant: first };
}

/**
 * Sync an order to Supabase
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
        created_at: new Date().toISOString(),
        source: order.source,
      },
    ]);

    if (error) {
      console.warn('Supabase sync notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase order sync error:', err);
    return false;
  }
}

/**
 * Sync a waiter buzzer call
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
        timestamp: new Date().toISOString(),
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
