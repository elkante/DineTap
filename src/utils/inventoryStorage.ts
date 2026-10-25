import { InventoryItem } from '../types';
import { supabase, resolveRestaurantDbId } from './supabase';

const KEY_INVENTORY_PREFIX = 'tapmenu_inventory_';

/**
 * Get stored inventory from local cache (NO mock data).
 */
export function getStoredInventory(restaurantId: string): InventoryItem[] {
  try {
    const raw = localStorage.getItem(`${KEY_INVENTORY_PREFIX}${restaurantId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read inventory', e);
  }
  return [];
}

/**
 * Save inventory to local cache and trigger storage event.
 */
export function saveStoredInventory(restaurantId: string, items: InventoryItem[]): void {
  try {
    localStorage.setItem(`${KEY_INVENTORY_PREFIX}${restaurantId}`, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tapmenu_inventory_updated', { detail: { restaurantId, items } }));
    }
  } catch (e) {
    console.warn('Failed to save inventory', e);
  }
}

/**
 * Fetch live inventory for a restaurant directly from Supabase
 */
export async function fetchInventoryFromSupabase(restaurantId: string): Promise<InventoryItem[]> {
  if (!supabase || !restaurantId) return getStoredInventory(restaurantId);

  try {
    const resolvedId = await resolveRestaurantDbId(restaurantId);
    const { data, error } = await supabase
      .from('kitchen_inventory')
      .select('*')
      .or(`restaurant_id.eq.${resolvedId},restaurant_id.eq.${restaurantId}`)
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch kitchen_inventory error:', error.message);
      return getStoredInventory(restaurantId);
    }

    if (data && Array.isArray(data)) {
      const mapped: InventoryItem[] = data.map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        quantity: Number(row.quantity) || 0,
        unit: row.unit as any,
        minThreshold: Number(row.min_threshold) || 1,
        costPerUnit: Number(row.cost_per_unit) || 0,
        category: row.category as any,
        lastUpdated: row.last_updated || new Date().toISOString()
      }));

      // Cache locally
      saveStoredInventory(restaurantId, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('fetchInventoryFromSupabase exception:', err);
  }

  return getStoredInventory(restaurantId);
}

/**
 * Save or update an inventory item to Supabase and local cache
 */
export async function saveInventoryItemToSupabase(item: InventoryItem): Promise<boolean> {
  const current = getStoredInventory(item.restaurantId);
  const exists = current.some(i => i.id === item.id);
  const updated = exists ? current.map(i => i.id === item.id ? item : i) : [item, ...current];
  saveStoredInventory(item.restaurantId, updated);

  if (!supabase) return false;

  try {
    const resolvedId = await resolveRestaurantDbId(item.restaurantId);
    const payload = {
      id: item.id,
      restaurant_id: resolvedId || item.restaurantId,
      name: item.name,
      quantity: Number(item.quantity) || 0,
      unit: item.unit,
      min_threshold: Number(item.minThreshold) || 1,
      cost_per_unit: Number(item.costPerUnit) || 0,
      category: item.category,
      last_updated: item.lastUpdated || new Date().toISOString()
    };

    const { error } = await supabase.from('kitchen_inventory').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase save kitchen_inventory notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveInventoryItemToSupabase exception:', err);
    return false;
  }
}

/**
 * Delete an inventory item from Supabase and local cache
 */
export async function deleteInventoryItemFromSupabase(restaurantId: string, itemId: string): Promise<boolean> {
  const current = getStoredInventory(restaurantId);
  const updated = current.filter(i => i.id !== itemId);
  saveStoredInventory(restaurantId, updated);

  if (!supabase) return false;

  try {
    const { error } = await supabase.from('kitchen_inventory').delete().eq('id', itemId);
    if (error) {
      console.warn('Supabase delete kitchen_inventory error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteInventoryItemFromSupabase exception:', err);
    return false;
  }
}
