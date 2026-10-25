import { ExpenseItem } from '../types';
import { supabase, resolveRestaurantDbId } from './supabase';

const KEY_EXPENSES_PREFIX = 'tapmenu_expenses_';

/**
 * Get stored expenses from local cache (NO mock data).
 */
export function getStoredExpenses(restaurantId: string): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(`${KEY_EXPENSES_PREFIX}${restaurantId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read expenses', e);
  }
  return [];
}

/**
 * Save expenses to local cache and trigger storage event.
 */
export function saveStoredExpenses(restaurantId: string, items: ExpenseItem[]): void {
  try {
    localStorage.setItem(`${KEY_EXPENSES_PREFIX}${restaurantId}`, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tapmenu_expenses_updated', { detail: { restaurantId, items } }));
    }
  } catch (e) {
    console.warn('Failed to save expenses', e);
  }
}

/**
 * Fetch live expenses for a restaurant directly from Supabase
 */
export async function fetchExpensesFromSupabase(restaurantId: string): Promise<ExpenseItem[]> {
  if (!supabase || !restaurantId) return getStoredExpenses(restaurantId);

  try {
    const resolvedId = await resolveRestaurantDbId(restaurantId);
    const { data, error } = await supabase
      .from('kitchen_expenses')
      .select('*')
      .or(`restaurant_id.eq.${resolvedId},restaurant_id.eq.${restaurantId}`)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch kitchen_expenses error:', error.message);
      return getStoredExpenses(restaurantId);
    }

    if (data && Array.isArray(data)) {
      const mapped: ExpenseItem[] = data.map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        category: row.category as any,
        amount: Number(row.amount) || 0,
        description: row.description || '',
        date: row.date || new Date().toISOString().split('T')[0],
        paymentMethod: row.payment_method || 'cash',
        recordedBy: row.recorded_by || undefined,
        createdAt: row.created_at || new Date().toISOString()
      }));

      // Cache locally
      saveStoredExpenses(restaurantId, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('fetchExpensesFromSupabase exception:', err);
  }

  return getStoredExpenses(restaurantId);
}

/**
 * Save an expense to Supabase and update local storage
 */
export async function saveExpenseToSupabase(expense: ExpenseItem): Promise<boolean> {
  // Update local cache immediately for zero latency
  const current = getStoredExpenses(expense.restaurantId);
  const exists = current.some(e => e.id === expense.id);
  const updated = exists ? current.map(e => e.id === expense.id ? expense : e) : [expense, ...current];
  saveStoredExpenses(expense.restaurantId, updated);

  if (!supabase) return false;

  try {
    const resolvedId = await resolveRestaurantDbId(expense.restaurantId);
    const payload = {
      id: expense.id,
      restaurant_id: resolvedId || expense.restaurantId,
      category: expense.category,
      amount: Number(expense.amount) || 0,
      description: expense.description || '',
      date: expense.date,
      payment_method: expense.paymentMethod,
      recorded_by: expense.recordedBy || null,
      created_at: expense.createdAt || new Date().toISOString()
    };

    const { error } = await supabase.from('kitchen_expenses').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase save kitchen_expenses notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveExpenseToSupabase exception:', err);
    return false;
  }
}

/**
 * Delete an expense from Supabase and local cache
 */
export async function deleteExpenseFromSupabase(restaurantId: string, expenseId: string): Promise<boolean> {
  const current = getStoredExpenses(restaurantId);
  const updated = current.filter(e => e.id !== expenseId);
  saveStoredExpenses(restaurantId, updated);

  if (!supabase) return false;

  try {
    const { error } = await supabase.from('kitchen_expenses').delete().eq('id', expenseId);
    if (error) {
      console.warn('Supabase delete kitchen_expenses error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteExpenseFromSupabase exception:', err);
    return false;
  }
}
