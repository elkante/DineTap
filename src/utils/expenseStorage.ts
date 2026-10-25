import { ExpenseItem } from '../types';

const KEY_EXPENSES_PREFIX = 'tapmenu_expenses_';

export function getStoredExpenses(restaurantId: string): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(`${KEY_EXPENSES_PREFIX}${restaurantId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read expenses', e);
  }

  const today = new Date().toISOString().split('T')[0];
  // Initial default operational sample expenses
  return [
    {
      id: `exp-${Date.now()}-1`,
      restaurantId,
      category: 'fuel_diesel',
      amount: 25000,
      description: 'Diesel for generator (morning shift)',
      date: today,
      paymentMethod: 'cash',
      recordedBy: 'Shift Supervisor',
      createdAt: new Date().toISOString()
    },
    {
      id: `exp-${Date.now()}-2`,
      restaurantId,
      category: 'packaging',
      amount: 15000,
      description: 'Carton of Takeaway foil food containers & bags',
      date: today,
      paymentMethod: 'transfer',
      recordedBy: 'Manager',
      createdAt: new Date().toISOString()
    }
  ];
}

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
