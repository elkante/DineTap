import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Filter, DollarSign, Printer, ChevronRight, TrendingUp, TrendingDown, ShoppingBag, CreditCard, Banknote, Building2, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { Order, RestaurantTenant } from '../../types';
import { ExpenseItem } from '../../types';
import { getStoredExpenses, fetchExpensesFromSupabase } from '../../utils/expenseStorage';
import { fetchShiftsFromSupabase } from '../../utils/supabase';
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => getStoredExpenses(restaurant.id));
  const [shifts, setShifts] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'shifts'>('orders');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [remoteExp, remoteShifts] = await Promise.all([
        fetchExpensesFromSupabase(restaurant.id),
        fetchShiftsFromSupabase(restaurant.id)
      ]);
      setExpenses(remoteExp);
      setShifts(remoteShifts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurant.id]);

  // Filter orders by selected day, month, or year
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
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

  // Financial aggregates
  const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossRevenue - totalExpenses;
  const totalVat = filteredOrders.reduce((sum, o) => sum + (o.vat || 0), 0);

  const timeframeLabel = filterMode === 'day' ? selectedDate : filterMode === 'month' ? selectedMonth : selectedYear;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Timeframe Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">Historical Kitchen Archive & Profit Reports</h2>
            <p className="text-xs text-neutral-500">
              Live consolidated shifts, dine-in sales, and expenses from Supabase Cloud.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl text-xs font-bold mr-1">
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'orders' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Order Tickets
            </button>
            <button
              onClick={() => setActiveSubTab('shifts')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'shifts' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Closed Shifts ({shifts.length})
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterMode('day')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                filterMode === 'day' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setFilterMode('month')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                filterMode === 'month' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setFilterMode('year')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                filterMode === 'year' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Year
            </button>
          </div>

          {/* Date Picker Input */}
          {filterMode === 'day' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-amber-500"
            />
          )}

          {filterMode === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-amber-500"
            />
          )}

          {filterMode === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-amber-500"
            >
              {[2026, 2025, 2024].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs transition-colors cursor-pointer"
            title="Refresh Cloud Archive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
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
            <span className="font-medium">Total Orders</span>
            <div className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight font-mono">
            {filteredOrders.length} Diners
          </div>
          <p className="text-[11px] text-neutral-400 truncate">VAT (7.5%): ₦{totalVat.toLocaleString()}</p>
        </div>

      </div>

      {/* Main Content: Orders List OR Shift Reconciliations */}
      {activeSubTab === 'shifts' ? (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Closed Shift Reconciliation Reports (Z-Reports)
            </h3>
            <span className="text-xs text-neutral-500 font-mono">{shifts.length} Archived Shifts</span>
          </div>

          {shifts.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Clock className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs font-bold text-neutral-600">No shift reconciliations archived yet</p>
              <p className="text-[11px] text-neutral-400">When you click "End Day Shift (Z-Report)" on the kitchen display, closed shifts save here permanently.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {shifts.map((shift: any) => (
                <div key={shift.shiftId} className="p-4 hover:bg-neutral-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-neutral-900">{shift.date}</span>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-900">
                        {shift.startedAt} → {shift.endedAt}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-[11px]">
                      {shift.totalOrders} total orders placed · {shift.servedOrders || 0} served to tables
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-base text-neutral-900 block">
                      {restaurant.design.currencySymbol}{Number(shift.totalRevenue || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      POS: {restaurant.design.currencySymbol}{Number(shift.payments?.pos || 0).toLocaleString()} | Cash: {restaurant.design.currencySymbol}{Number(shift.payments?.cash || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Completed Orders History ({timeframeLabel})
            </h3>
            <span className="text-xs text-neutral-500 font-mono">{filteredOrders.length} Orders</span>
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
                      className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
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
      )}

    </div>
  );
};
