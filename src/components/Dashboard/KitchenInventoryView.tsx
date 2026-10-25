import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, AlertTriangle, CheckCircle, Search, Trash2, Edit3, DollarSign, Sparkles, RefreshCw } from 'lucide-react';
import { InventoryItem, RestaurantTenant } from '../../types';
import { getStoredInventory, saveStoredInventory, fetchInventoryFromSupabase, saveInventoryItemToSupabase, deleteInventoryItemFromSupabase } from '../../utils/inventoryStorage';
import { supabase, resolveRestaurantDbId } from '../../utils/supabase';

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
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [costPerUnit, setCostPerUnit] = useState<number>(2000);
  const [category, setCategory] = useState<InventoryItem['category']>('raw_ingredients');

  const refreshInventory = async () => {
    setIsLoading(true);
    try {
      const remote = await fetchInventoryFromSupabase(restaurant.id);
      setItems(remote);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshInventory();

    const handleLocalUpdate = (e: any) => {
      if (e.detail?.restaurantId === restaurant.id && Array.isArray(e.detail?.items)) {
        setItems(e.detail.items);
      }
    };
    window.addEventListener('tapmenu_inventory_updated', handleLocalUpdate);

    let channel: any = null;
    if (supabase && restaurant.id) {
      resolveRestaurantDbId(restaurant.id).then(resolvedId => {
        channel = supabase
          .channel(`kitchen-inventory-${restaurant.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'kitchen_inventory' },
            () => {
              refreshInventory();
            }
          )
          .subscribe();
      });
    }

    return () => {
      window.removeEventListener('tapmenu_inventory_updated', handleLocalUpdate);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [restaurant.id]);

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || it.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const totalValuation = items.reduce((sum, it) => sum + (it.quantity * it.costPerUnit), 0);
  const lowStockCount = items.filter(it => it.quantity <= it.minThreshold).length;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
    setName('');
    setIsAdding(false);
    showNotification(`Added "${newItem.name}" to Cloud inventory`);

    await saveInventoryItemToSupabase(newItem);
  };

  const handleAdjustQty = async (itemId: string, delta: number) => {
    const targetItem = items.find(it => it.id === itemId);
    if (!targetItem) return;

    const nextQty = Math.max(0, targetItem.quantity + delta);
    const updatedItem = {
      ...targetItem,
      quantity: nextQty,
      lastUpdated: new Date().toISOString()
    };

    const updated = items.map(it => it.id === itemId ? updatedItem : it);
    setItems(updated);
    await saveInventoryItemToSupabase(updatedItem);
  };

  const handleDeleteItem = async (itemId: string) => {
    const updated = items.filter(it => it.id !== itemId);
    setItems(updated);
    showNotification('Item removed from Cloud inventory');
    await deleteInventoryItemFromSupabase(restaurant.id, itemId);
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
          <p className="text-[11px] text-neutral-400 mt-0.5">Live from Supabase cloud database</p>
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

      {/* Control Bar: Search, Category Filter, and Cloud Sync */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient or packaging..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>

          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-semibold bg-neutral-50"
          >
            <option value="all">All Categories</option>
            <option value="raw_ingredients">Raw Ingredients</option>
            <option value="beverages">Drinks & Beverages</option>
            <option value="takeaway_packaging">Takeout Packaging</option>
            <option value="spices_oils">Spices, Oils & Seasonings</option>
            <option value="general">Kitchen Supplies & Gas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshInventory}
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
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-extrabold text-neutral-900 text-base">Add New Inventory Item</h3>
              <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Item / Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  placeholder="e.g. Basmati Rice, Heavy Foil Packs, Cooking Gas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="packs">Packs / Cartons</option>
                    <option value="liters">Liters (L)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bags">Bags (50kg/25kg)</option>
                    <option value="crates">Crates</option>
                    <option value="bottles">Bottles</option>
                    <option value="rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Min. Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Unit Cost (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="raw_ingredients">Raw Ingredients (Meat, Grains, Produce)</option>
                  <option value="beverages">Beverages & Bar Drinks</option>
                  <option value="takeaway_packaging">Takeout Packaging (Packs, Bags, Foil)</option>
                  <option value="spices_oils">Oils, Condiments & Spices</option>
                  <option value="general">Kitchen General & Cooking Gas</option>
                </select>
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

      {/* Inventory Item Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center shadow-xs">
          <Package className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
          <h3 className="font-bold text-neutral-900 text-sm">No inventory items tracked yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Click "Add Stock Item" to track rice, chicken, cooking gas, or takeaway packs with live Supabase sync.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map(item => {
            const isLow = item.quantity <= item.minThreshold;
            const stockValue = item.quantity * item.costPerUnit;

            return (
              <div 
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                  isLow ? 'border-amber-400/80 bg-amber-50/20' : 'border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        {item.category.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-sm text-neutral-900 leading-snug">{item.name}</h4>
                    </div>

                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 flex items-center gap-1 shrink-0 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        In Stock
                      </span>
                    )}
                  </div>

                  <div className="my-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 block font-medium">Available</span>
                      <div className="text-xl font-extrabold font-mono text-neutral-900">
                        {item.quantity} <span className="text-xs font-sans text-neutral-500 font-semibold">{item.unit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400 block font-medium">Estimated Value</span>
                      <div className="text-sm font-extrabold font-mono text-neutral-900">
                        ₦{stockValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustQty(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      title="Deduct 1 unit"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAdjustQty(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      title="Add 1 unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAdjustQty(item.id, 5)}
                      className="px-2 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono text-xs font-bold transition-colors cursor-pointer"
                      title="Bulk add +5"
                    >
                      +5
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
