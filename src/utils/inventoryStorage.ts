import { InventoryItem } from '../types';

const KEY_INVENTORY_PREFIX = 'tapmenu_inventory_';

export function getStoredInventory(restaurantId: string): InventoryItem[] {
  try {
    const raw = localStorage.getItem(`${KEY_INVENTORY_PREFIX}${restaurantId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read inventory', e);
  }
  
  // Initial default sample inventory for a newly initialized restaurant
  return [
    {
      id: `inv-${Date.now()}-1`,
      restaurantId,
      name: 'Basmati Rice (Long Grain)',
      quantity: 45,
      unit: 'kg',
      minThreshold: 15,
      costPerUnit: 2200,
      category: 'raw_ingredients',
      lastUpdated: new Date().toISOString()
    },
    {
      id: `inv-${Date.now()}-2`,
      restaurantId,
      name: 'Fresh Chicken Drumsticks / Thighs',
      quantity: 32,
      unit: 'kg',
      minThreshold: 10,
      costPerUnit: 4800,
      category: 'raw_ingredients',
      lastUpdated: new Date().toISOString()
    },
    {
      id: `inv-${Date.now()}-3`,
      restaurantId,
      name: 'Heavy-Duty Foil Takeout Packs',
      quantity: 120,
      unit: 'packs',
      minThreshold: 30,
      costPerUnit: 250,
      category: 'takeaway_packaging',
      lastUpdated: new Date().toISOString()
    },
    {
      id: `inv-${Date.now()}-4`,
      restaurantId,
      name: 'Cooking Gas (50kg Cylinder)',
      quantity: 2,
      unit: 'pcs',
      minThreshold: 1,
      costPerUnit: 65000,
      category: 'general',
      lastUpdated: new Date().toISOString()
    },
    {
      id: `inv-${Date.now()}-5`,
      restaurantId,
      name: 'Vegetable Cooking Oil',
      quantity: 18,
      unit: 'liters',
      minThreshold: 5,
      costPerUnit: 3500,
      category: 'spices_oils',
      lastUpdated: new Date().toISOString()
    }
  ];
}

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
