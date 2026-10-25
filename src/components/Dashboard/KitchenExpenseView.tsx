import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, CreditCard, Banknote, Building2, TrendingDown, Users, Fuel, Zap, Box, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ExpenseItem, RestaurantTenant } from '../../types';
import { getStoredExpenses, saveStoredExpenses, fetchExpensesFromSupabase, saveExpenseToSupabase, deleteExpenseFromSupabase } from '../../utils/expenseStorage';
import { getNetworkDateString } from '../../utils/networkTime';
import { supabase, resolveRestaurantDbId } from '../../utils/supabase';

interface KitchenExpenseViewProps {
  restaurant: RestaurantTenant;
  showNotification: (msg: string) => void;
}

export const KitchenExpenseView: React.FC<KitchenExpenseViewProps> = ({
  restaurant,
  showNotification
}) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => getStoredExpenses(restaurant.id));
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const todayStr = getNetworkDateString();

  // Form State
  const [category, setCategory] = useState<ExpenseItem['category']>('salary');
  const [amount, setAmount] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem['paymentMethod']>('transfer');
  const [recordedBy, setRecordedBy] = useState('Kitchen Manager');

  // Load from Supabase on mount
  const refreshExpenses = async () => {
    setIsLoading(true);
    try {
      const remote = await fetchExpensesFromSupabase(restaurant.id);
      setExpenses(remote);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshExpenses();

    // Listen for local tab updates
    const handleLocalUpdate = (e: any) => {
      if (e.detail?.restaurantId === restaurant.id && Array.isArray(e.detail?.items)) {
        setExpenses(e.detail.items);
      }
    };
    window.addEventListener('tapmenu_expenses_updated', handleLocalUpdate);

    // Supabase Realtime Channel
    let channel: any = null;
    if (supabase && restaurant.id) {
      resolveRestaurantDbId(restaurant.id).then(resolvedId => {
        channel = supabase
          .channel(`kitchen-expenses-${restaurant.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'kitchen_expenses' },
            () => {
              refreshExpenses();
            }
          )
          .subscribe();
      });
    }

    return () => {
      window.removeEventListener('tapmenu_expenses_updated', handleLocalUpdate);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [restaurant.id]);

  // Today's total expenses
  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
  const currentMonthStr = todayStr.slice(0, 7);
  const monthTotal = expenses.filter(e => e.date.startsWith(currentMonthStr)).reduce((sum, e) => sum + e.amount, 0);
  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      restaurantId: restaurant.id,
      category,
      amount: Number(amount),
      description: description.trim() || category.replace('_', ' '),
      date,
      paymentMethod,
      recordedBy: recordedBy.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    setDescription('');
    setIsAdding(false);
    showNotification(`Recorded expense of ₦${newExpense.amount.toLocaleString()} (Syncing to Cloud)`);

    await saveExpenseToSupabase(newExpense);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    showNotification('Expense entry removed from Cloud');
    await deleteExpenseFromSupabase(restaurant.id, expenseId);
  };

  const getCategoryIcon = (cat: ExpenseItem['category']) => {
    switch (cat) {
      case 'salary': return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'fuel_diesel': return <Fuel className="w-3.5 h-3.5 text-amber-600" />;
      case 'electricity': return <Zap className="w-3.5 h-3.5 text-yellow-600" />;
      case 'packaging': return <Box className="w-3.5 h-3.5 text-rose-600" />;
      case 'maintenance': return <Wrench className="w-3.5 h-3.5 text-neutral-600" />;
      default: return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Today's Operating Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tracking-tight font-mono mt-1">
            {restaurant.design.currencySymbol}{todayTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Recorded on {todayStr}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">This Month's Total Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tracking-tight font-mono mt-1">
            {restaurant.design.currencySymbol}{monthTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Salaries, supplies & utilities</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">All-Time Cumulative Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tracking-tight font-mono mt-1">
            {restaurant.design.currencySymbol}{totalAllTime.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">{expenses.length} live cloud records</p>
        </div>

      </div>

      {/* Action Header & Cloud Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-neutral-900">Kitchen & Operational Expense Ledger</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Supabase Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log generator diesel, staff wages, market ingredients, and packaging. Live across all kitchen devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshExpenses}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Record Expense Modal Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-extrabold text-neutral-900 text-base">Record Operational Expense</h3>
              <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="salary">Staff Salary / Daily Wages</option>
                  <option value="supplies">Raw Ingredients / Market Supplies</option>
                  <option value="fuel_diesel">Generator Fuel / Diesel</option>
                  <option value="gas">Cooking Gas (LPG Cylinders)</option>
                  <option value="packaging">Takeaway Food Foil Packs & Bags</option>
                  <option value="electricity">NEPA / Electricity Token</option>
                  <option value="maintenance">Kitchen Repairs & Maintenance</option>
                  <option value="rent">Space Rent / Service Charge</option>
                  <option value="other">Other Operational Costs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                    placeholder="e.g. 15000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['transfer', 'cash', 'pos'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                        paymentMethod === method
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Item Description / Memo</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  placeholder="e.g. 50 Litres of diesel from Total station"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Recorded By</label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={e => setRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  placeholder="e.g. Shift Supervisor"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Save to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount (₦)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-neutral-600">No operational expenses recorded yet.</p>
                    <p className="text-[11px] mt-0.5">Click "Record Expense" to log fuel, wages, or supplies live to Supabase.</p>
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-neutral-500">
                      {expense.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-neutral-900 capitalize">
                        {getCategoryIcon(expense.category)}
                        <span>{expense.category.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600">
                      {expense.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-neutral-100 text-neutral-700 uppercase">
                        {expense.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-rose-700">
                      -₦{expense.amount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
