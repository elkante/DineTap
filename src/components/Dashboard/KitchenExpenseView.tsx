import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Calendar, CreditCard, Banknote, Building2, TrendingDown, Users, Fuel, Zap, Box, Wrench } from 'lucide-react';
import { ExpenseItem, RestaurantTenant } from '../../types';
import { getStoredExpenses, saveStoredExpenses } from '../../utils/expenseStorage';
import { getNetworkDateString } from '../../utils/networkTime';

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
  const todayStr = getNetworkDateString();

  // Form State
  const [category, setCategory] = useState<ExpenseItem['category']>('salary');
  const [amount, setAmount] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem['paymentMethod']>('transfer');
  const [recordedBy, setRecordedBy] = useState('Kitchen Manager');

  // Today's total expenses
  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
  const currentMonthStr = todayStr.slice(0, 7);
  const monthTotal = expenses.filter(e => e.date.startsWith(currentMonthStr)).reduce((sum, e) => sum + e.amount, 0);
  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
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
    saveStoredExpenses(restaurant.id, updated);
    setDescription('');
    setIsAdding(false);
    showNotification(`Recorded expense of ₦${newExpense.amount.toLocaleString()}`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    saveStoredExpenses(restaurant.id, updated);
    showNotification('Expense entry removed');
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
          <p className="text-[11px] text-neutral-400 mt-0.5">{expenses.length} total ledger records</p>
        </div>

      </div>

      {/* Action Header */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-neutral-900 text-sm">Operating Expense Ledger</h4>
          <p className="text-xs text-neutral-500">Track staff salary disbursements, fuel, gas, and supplies</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <form onSubmit={handleAddExpense} className="bg-neutral-50 p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3 text-xs animate-in fade-in">
          <h4 className="font-extrabold text-neutral-900 text-sm">Record New Kitchen Expense</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="salary">Staff Salary / Daily Wages</option>
                <option value="fuel_diesel">Generator Fuel / Diesel</option>
                <option value="gas">Cooking Gas (Cylinders)</option>
                <option value="packaging">Takeaway Foil & Packaging</option>
                <option value="supplies">Daily Market / Food Supplies</option>
                <option value="electricity">Electricity / NEPA Bill</option>
                <option value="maintenance">Kitchen Repair & Maintenance</option>
                <option value="rent">Shop / Lounge Rent</option>
                <option value="other">Miscellaneous / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Amount (₦ NGN)</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="transfer">Bank Transfer</option>
                <option value="cash">Cash / Petty Cash</option>
                <option value="pos">POS Terminal</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Description / Notes</label>
              <input
                type="text"
                placeholder="e.g. Paid sous chef weekly salary / 25L diesel at total fuel station"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 bg-white border border-neutral-300 text-neutral-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl"
            >
              Save Voucher
            </button>
          </div>
        </form>
      )}

      {/* Expense List */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 text-[10px] uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid Via</th>
                <th className="py-3 px-4 text-right">Amount (₦)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.map(expense => (
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
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
