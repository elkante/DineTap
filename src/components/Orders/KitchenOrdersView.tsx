import React from 'react';
import { useApp } from '../../context/AppContext';
import { Order, WaiterCall } from '../../types';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  Nfc, 
  QrCode, 
  ShoppingBag, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export const KitchenOrdersView: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    waiterCalls, 
    resolveWaiterCall, 
    activeRestaurant,
    setCurrentView 
  } = useApp();

  const activeOrders = orders.filter(o => o.status !== 'served');
  const completedOrders = orders.filter(o => o.status === 'served');

  const todayRevenue = orders
    .filter(o => o.status !== 'pending')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 shrink-0"
            title="Back to menu"
          >
            <ChefHat className="w-4 h-4 text-neutral-800" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">
              Kitchen Display (KDS)
            </h1>
            <p className="text-[11px] text-neutral-500">
              {activeRestaurant.name} · {activeOrders.length} active tickets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold"
          >
            ← Menu
          </button>
        </div>
      </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="p-2.5 bg-white border border-neutral-200 rounded-xl shadow-xs">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Active Orders</span>
            <span className="text-sm font-bold font-mono text-neutral-900">{activeOrders.length}</span>
          </div>
          <div className="p-2.5 bg-white border border-neutral-200 rounded-xl shadow-xs">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Today's Sales</span>
            <span className="text-sm font-bold font-mono text-amber-800">
              {activeRestaurant.design.currencySymbol}{todayRevenue.toLocaleString()}
            </span>
          </div>
        </div>

      {/* Waiter Assistance Alert Banner (If active table calls) */}
      {waiterCalls.length > 0 && (
        <div className="bg-amber-500 text-neutral-950 p-4 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Active Table Call Alerts ({waiterCalls.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {waiterCalls.map((call) => (
              <div 
                key={call.id} 
                className="bg-neutral-900 text-white p-3 rounded-xl flex items-center justify-between text-xs shadow-sm"
              >
                <div>
                  <div className="font-bold text-amber-400">{call.tableNumber}</div>
                  <div className="text-[11px] text-neutral-300">{call.reason} · {call.timestamp}</div>
                </div>
                <button
                  onClick={() => resolveWaiterCall(call.id)}
                  className="px-2.5 py-1 bg-amber-400 text-neutral-900 hover:bg-amber-300 font-bold rounded-lg text-[10px] transition-colors"
                >
                  Attended
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Kanban Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Active Tickets ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-900">All orders up to date!</h3>
            <p className="text-xs text-neutral-500 mt-1">
              New orders placed by diners will appear here with instant sound alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-neutral-900">#{order.id}</span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-neutral-900 text-white font-mono">
                          {order.tableNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {order.customerName} · {order.createdAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      {order.source === 'nfc' ? (
                        <span className="flex items-center gap-0.5 text-amber-700 font-semibold"><Nfc className="w-3.5 h-3.5" /> NFC</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-neutral-600"><QrCode className="w-3.5 h-3.5" /> QR</span>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-3 space-y-2">
                    {order.items.map((ci, idx) => (
                      <div key={idx} className="text-xs flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-neutral-800">
                            <span className="font-mono font-bold text-amber-800 mr-1.5">{ci.quantity}x</span>
                            <span>{ci.foodItem.name}</span>
                          </div>
                          {ci.notes && (
                            <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 italic">
                              Note: {ci.notes}
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-neutral-500 font-medium">
                          {activeRestaurant.design.currencySymbol}{(ci.foodItem.price * ci.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Footer & Status Controls */}
                <div className="pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs mb-3 font-semibold">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {activeRestaurant.design.currencySymbol}{order.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        order.status === 'preparing'
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Cooking
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        order.status === 'ready'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Ready
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'served')}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold"
                    >
                      Served
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders History (Foldable) */}
      {completedOrders.length > 0 && (
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Completed Orders Today ({completedOrders.length})
          </h3>
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            {completedOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-neutral-800">#{o.id}</span>
                  <span className="font-semibold text-neutral-700">{o.tableNumber}</span>
                  <span className="text-neutral-400">· {o.customerName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-neutral-900">
                    {activeRestaurant.design.currencySymbol}{o.total.toLocaleString()}
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                    Served & Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
