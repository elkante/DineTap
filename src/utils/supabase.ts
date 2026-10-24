import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, WaiterCall } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikkljurxmfwmhhumoiqo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vSVJBftn3OHtozdV6GKMjA_KHIlJEo8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Persist an order to Supabase database.
 * Falls back silently to local state if table does not yet exist or user is offline.
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
      console.warn('Supabase order sync notice (table may need creation):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync caught error:', err);
    return false;
  }
}

/**
 * Persist a waiter call buzzer alert to Supabase.
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
    console.warn('Supabase sync error:', err);
    return false;
  }
}
