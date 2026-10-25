import React, { useState } from 'react';
import { Package, Plus, Minus, AlertTriangle, CheckCircle, Search, Trash2, Edit3, DollarSign, Sparkles } from 'lucide-react';
import { InventoryItem, RestaurantTenant } from '../../types';
import { getStoredInventory, saveStoredInventory } from '../../utils/inventoryStorage';

interface KitchenInventoryViewProps {
  restaurant: RestaurantTenant;
  showNotification: (msg: string) => void;
}

export const KitchenInventoryView: React.FC<KitchenInventoryViewProps> = ({
  restaurant,
  showNotification
}) => {
  const [items, setItems] = useState<InventoryItem[]>(() => getStoredInventory(restaurant.id));
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [costPerUnit, setCostPerUnit] = useState<number>(2000);
  const [category, setCategory] = useState<InventoryItem['category']>('raw_ingredients');

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || it.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const totalValuation = items.reduce((sum, it) => sum + (it.quantity * it.costPerUnit), 0);
  const lowStockCount = items.filter(it => it.quantity <= it.minThreshold).length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      restaurantId: restaurant.id,
      name: name.trim(),
      quantity: Number(quantity) || 0,
      unit,
      minThreshold: Number(minThreshold) || 1,
      costPerUnit: Number(costPerUnit) || 0,
      category,
      lastUpdated: new Date().toISOString()
    };

    const updated = [newItem, ...items];
    setItems(updated);
    saveStoredInventory(restaurant.id, updated);
    setName('');
    setIsAdding(false);
    showNotification(`Added "${newItem.name}" to inventory`);
  };

  const handleAdjustQty = (itemId: string, delta: number) => {
    const updated = items.map(it => {
      if (it.id !== itemId) return it;
      const nextQty = Math.max(0, it.quantity + delta);
      return { ...it, quantity: nextQty, lastUpdated: new Date().toISOString() };
    });
    setItems(updated);
    saveStoredInventory(restaurant.id, updated);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter(it => it.id !== itemId);
    setItems(updated);
    saveStoredInventory(restaurant.id, updated);
    showNotification('Item removed from inventory');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Total Tracked Items</span>
            <div className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tracking-tight font-mono mt-1">
            {items.length} Supplies
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Ingredients & kitchen packaging</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Low Stock Alerts</span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
            {lowStockCount} Items
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">{lowStockCount > 0 ? 'Needs restock before shift ends' : 'All stock levels healthy'}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Total Stock Value</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tracking-tight font-mono mt-1">
            {restaurant.design.currencySymbol}{totalValuation.toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Estimated kitchen inventory capital</p>
        </div>

      </div>

      {/* Toolbar & Add Stock Button */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock (e.g. chicken, rice, packs)..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="raw_ingredients">Raw Ingredients</option>
            <option value="takeaway_packaging">Takeaway Packaging</option>
            <option value="beverages">Beverages</option>
            <option value="spices_oils">Spices & Oils</option>
            <option value="general">General Supplies</option>
          </select>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>

      </div>

      {/* Add New Item Modal Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-amber-50/70 p-4 sm:p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 text-xs animate-in fade-in">
          <h4 className="font-extrabold text-amber-950 text-sm">Add New Kitchen Inventory Item</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Goat Meat / Asun Cuts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="raw_ingredients">Raw Ingredients</option>
                <option value="takeaway_packaging">Takeaway Packaging</option>
                <option value="beverages">Beverages</option>
                <option value="spices_oils">Spices & Oils</option>
                <option value="general">General Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="packs">Packs / Cartons</option>
                <option value="liters">Liters (L)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="bags">Bags</option>
                <option value="crates">Crates</option>
                <option value="bottles">Bottles</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Current Stock Qty</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Alert Below (Min Threshold)</label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Unit Cost (₦)</label>
              <input
                type="number"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
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
              Save Item
            </button>
          </div>
        </form>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 text-[10px] uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Item & Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4 text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                const isOut = item.quantity === 0;

                return (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-neutral-900 block">{item.name}</span>
                      <span className="text-[10px] text-neutral-400 capitalize">
                        {item.category.replace('_', ' ')} · Min: {item.minThreshold} {item.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Adequate
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-extrabold text-sm text-neutral-900">
                        {item.quantity}
                      </span>
                      <span className="text-neutral-400 text-[10px] ml-1">{item.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      ₦{item.costPerUnit.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      ₦{(item.quantity * item.costPerUnit).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAdjustQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center transition-colors"
                          title="Deduct 1"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAdjustQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center transition-colors"
                          title="Add 1"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-neutral-50 hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors ml-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
