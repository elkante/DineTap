import { CardOrderRequest } from '../types';
import { supabase } from './supabase';

const KEY_CARD_ORDERS = 'tapmenu_card_hardware_orders_v1';

export function getStoredCardOrders(): CardOrderRequest[] {
  try {
    const raw = localStorage.getItem(KEY_CARD_ORDERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredCardOrders(orders: CardOrderRequest[]): void {
  try {
    localStorage.setItem(KEY_CARD_ORDERS, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tapmenu_card_orders_updated', { detail: orders }));
      try {
        const bc = new BroadcastChannel('tapmenu_live_sync');
        bc.postMessage({ type: 'CARD_ORDERS_UPDATED', orders });
        bc.close();
      } catch {}
    }
  } catch {}
}

export async function submitCardOrder(order: Omit<CardOrderRequest, 'id' | 'createdAt' | 'status'>): Promise<CardOrderRequest> {
  const newOrder: CardOrderRequest = {
    ...order,
    id: `card-req-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const existing = getStoredCardOrders();
  const updated = [newOrder, ...existing];
  saveStoredCardOrders(updated);

  // Sync to Supabase if configured
  if (supabase) {
    try {
      await supabase.from('card_orders').insert([{
        id: newOrder.id,
        restaurant_id: newOrder.restaurantId,
        restaurant_name: newOrder.restaurantName,
        contact_phone: newOrder.contactPhone,
        quantity: newOrder.quantity,
        unit_price: newOrder.unitPrice,
        total_amount: newOrder.totalAmount,
        card_type: newOrder.cardType,
        target_url_payload: newOrder.targetUrlPayload,
        table_numbers: newOrder.tableNumbers,
        notes: newOrder.notes,
        status: newOrder.status,
        created_at: newOrder.createdAt
      }]);
    } catch (e) {
      console.warn('Sync card order to Supabase notice (saved locally):', e);
    }
  }

  return newOrder;
}

export async function updateCardOrderStatus(orderId: string, status: CardOrderRequest['status']): Promise<void> {
  const existing = getStoredCardOrders();
  const updated = existing.map(o => o.id === orderId ? { ...o, status } : o);
  saveStoredCardOrders(updated);

  if (supabase) {
    try {
      await supabase.from('card_orders').update({ status }).eq('id', orderId);
    } catch {}
  }
}
