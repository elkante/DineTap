import React, { useState, useMemo } from 'react';
import { Calendar, Filter, DollarSign, Printer, ChevronRight, TrendingUp, TrendingDown, ShoppingBag, CreditCard, Banknote, Building2 } from 'lucide-react';
import { Order, RestaurantTenant } from '../../types';
import { ExpenseItem } from '../../types';
import { getStoredExpenses } from '../../utils/expenseStorage';
import { formatNetworkDate, getNetworkDateString } from '../../utils/networkTime';

interface KitchenArchiveViewProps {
  orders: Order[];
  restaurant: RestaurantTenant;
  onPrintOrderReceipt: (order: Order) => void;
}

export const KitchenArchiveView: React.FC<KitchenArchiveViewProps> = ({
  orders,
  restaurant,
  onPrintOrderReceipt
}) => {
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year'>('day');
  const todayStr = getNetworkDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr); // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(todayStr.slice(0, 4)); // YYYY
  const [expenses] = useState<ExpenseItem[]>(() => getStoredExpenses(restaurant.id));

  // Filter orders by selected day, month, or year
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // o.createdAtTimestamp or fallback to date string
      const orderDate = o.createdAtTimestamp ? new Date(o.createdAtTimestamp) : new Date();
      const y = orderDate.getFullYear().toString();
      const m = String(orderDate.getMonth() + 1).padStart(2, '0');
      const d = String(orderDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      if (filterMode === 'day') {
        return dateKey === selectedDate;
      } else if (filterMode === 'month') {
        return `${y}-${m}` === selectedMonth;
      } else {
        return y === selectedYear;
      }
    });
  }, [orders, filterMode, selectedDate, selectedMonth, selectedYear]);

  // Filter expenses matching the same timeframe
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filterMode === 'day') {
        return e.date === selectedDate;
      } else if (filterMode === 'month') {
        return e.date.startsWith(selectedMonth);
      } else {
        return e.date.startsWith(selectedYear);
      }
    });
  }, [expenses, filterMode, selectedDate, selectedMonth, selectedYear]);

  // Aggregate Metrics
  const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalSubtotal = filteredOrders.reduce((sum, o) => sum + (o.subtotal || Math.round(o.total / 1.075)), 0);
  const totalVat = filteredOrders.reduce((sum, o) => sum + (o.vat || Math.round(o.total - (o.subtotal || Math.round(o.total / 1.075)))), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossRevenue - totalExpenses;

  // Payment Breakdown
  const posTotal = filteredOrders.filter(o => !o.paymentMethod || o.paymentMethod === 'pos').reduce((sum, o) => sum + o.total, 0);
  const transferTotal = filteredOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);
  const cashTotal = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);

  // Timeframe Title Label
  const timeframeLabel = useMemo(() => {
    if (filterMode === 'day') {
      const d = new Date(selectedDate);
      return !isNaN(d.getTime()) 
        ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : selectedDate;
    } else if (filterMode === 'month') {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : selectedMonth;
    } else {
      return `Year ${selectedYear}`;
    }
  }, [filterMode, selectedDate, selectedMonth, selectedYear]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Filter Bar: Clean & Minimalist */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-neutral-900 text-base">Financial Archive & Sales Ledger</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">Historical revenue, expenses, and reconciliation for any past date or year</p>
        </div>

        {/* View Range & Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Tabs */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs">
            <button
              onClick={() => setFilterMode('day')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterMode === 'day' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterMode === 'month' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterMode === 'year' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Interactive Date Selectors */}
          {filterMode === 'day' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500"
            />
          )}

          {filterMode === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500"
            />
          )}

          {filterMode === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500"
            >
              {[2026, 2025, 2024].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {/* Today shortcut */}
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setSelectedMonth(todayStr.slice(0, 7));
              setSelectedYear(todayStr.slice(0, 4));
            }}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors"
          >
            Reset Today
          </button>
        </div>
      </div>

      {/* 4 Clean Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Gross Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Gross Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ₦
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight font-mono">
            {restaurant.design.currencySymbol}{grossRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 truncate">{filteredOrders.length} completed orders in {timeframeLabel}</p>
        </div>

        {/* Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Total Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-700 tracking-tight font-mono">
            -{restaurant.design.currencySymbol}{totalExpenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 truncate">{filteredExpenses.length} recorded expense vouchers</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Net Profit (Take-Home)</span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold tracking-tight font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {restaurant.design.currencySymbol}{netProfit.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 truncate">Revenue minus all operational costs</p>
        </div>

        {/* VAT & Tax Collected */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">VAT (7.5% Tax)</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight font-mono">
            {restaurant.design.currencySymbol}{totalVat.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 truncate">Dishes: {restaurant.design.currencySymbol}{totalSubtotal.toLocaleString()}</p>
        </div>

      </div>

      {/* Payment Channel Breakdown Pills */}
      <div className="bg-neutral-900 text-white p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-300">Payment Breakdown ({timeframeLabel}):</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-neutral-400">POS:</span>
            <span className="font-bold text-white">{restaurant.design.currencySymbol}{posTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Transfer:</span>
            <span className="font-bold text-white">{restaurant.design.currencySymbol}{transferTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">Cash:</span>
            <span className="font-bold text-white">{restaurant.design.currencySymbol}{cashTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Orders List for Selected Timeframe */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-neutral-900 text-sm">
              Archived Orders ({filteredOrders.length})
            </h4>
            <p className="text-xs text-neutral-500">Itemized ledger tickets for {timeframeLabel}</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs font-bold text-neutral-600">No orders recorded for {timeframeLabel}</p>
            <p className="text-[11px] text-neutral-400">Select another date or month from the filter above.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-3.5 sm:p-4 hover:bg-neutral-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">#{order.id}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-900">
                      {order.tableNumber}
                    </span>
                    {order.orderType === 'takeaway' && (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-900">
                        🥡 TAKEOUT
                      </span>
                    )}
                    <span className="text-neutral-400 text-[11px]">{order.createdAt}</span>
                  </div>

                  <div className="text-neutral-600 font-medium">
                    {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''} · {order.items.map(i => `${i.quantity}x ${i.foodItem.name}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-neutral-900 block">
                      {restaurant.design.currencySymbol}{order.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Paid via {order.paymentMethod || 'POS'}
                    </span>
                  </div>

                  <button
                    onClick={() => onPrintOrderReceipt(order)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                    title="Reprint Thermal Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
