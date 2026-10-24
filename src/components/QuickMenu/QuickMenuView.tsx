import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodItem } from '../../types';
import { 
  Search, 
  BookOpen, 
  Plus, 
  Clock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

const BADGE_FILTERS = [
  { value: 'all', label: 'All', icon: '🍽️' },
  { value: 'Chef Special', label: 'Chef Special', icon: '👨‍🍳' },
  { value: 'Bestseller', label: 'Bestseller', icon: '🔥' },
  { value: 'Spicy', label: 'Spicy', icon: '🌶️' },
  { value: 'Popular', label: 'Popular', icon: '⭐' },
];

export const QuickMenuView: React.FC<{ onSelectItem: (item: FoodItem) => void }> = ({ onSelectItem }) => {
  const { activeRestaurant, setCurrentView, currentTable, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');

  const design = activeRestaurant.design;

  // Flatten all items from all non-cover pages
  const allItemsWithPage = useMemo(() => {
    return activeRestaurant.pages
      .filter(p => p.layout !== 'cover')
      .flatMap(p => p.items.map(it => ({ ...it, pageTitle: p.title, pageId: p.id })));
  }, [activeRestaurant.pages]);

  const categories = useMemo(() => {
    return activeRestaurant.pages
      .filter(p => p.layout !== 'cover')
      .map(p => ({ id: p.id, title: p.title, count: p.items.length }));
  }, [activeRestaurant.pages]);

  const filteredItems = useMemo(() => {
    return allItemsWithPage.filter(it => {
      const matchesSearch = searchQuery === '' || 
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || it.pageId === selectedCategory;
      const matchesBadge = selectedBadge === 'all' || it.badge === selectedBadge;

      return matchesSearch && matchesCategory && matchesBadge;
    });
  }, [allItemsWithPage, searchQuery, selectedCategory, selectedBadge]);

  const availableCount = filteredItems.filter(it => !it.isSoldOut).length;
  const soldOutCount = filteredItems.filter(it => it.isSoldOut).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {activeRestaurant.logo && (activeRestaurant.logo.startsWith('data:') || activeRestaurant.logo.startsWith('http') || activeRestaurant.logo.startsWith('/')) ? (
            <img src={activeRestaurant.logo} alt={activeRestaurant.name} className="w-12 h-12 rounded-xl object-cover border border-amber-200" />
          ) : (
            <div className="text-3xl p-2 bg-amber-50 rounded-xl">{activeRestaurant.logo}</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-neutral-900">{activeRestaurant.name}</h1>
              {currentTable && (
                <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold">
                  {currentTable}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{activeRestaurant.tagline}</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('flipbook')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Switch to Flipbook</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, ingredients, drinks, or spices..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 shadow-sm"
          />
        </div>

        {/* Category Filter Horizontal Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All Items ({allItemsWithPage.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {cat.title} ({cat.count})
            </button>
          ))}
        </div>

        {/* Badge Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {BADGE_FILTERS.map(bf => (
            <button
              key={bf.value}
              onClick={() => setSelectedBadge(bf.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedBadge === bf.value
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>{bf.icon}</span>
              <span>{bf.label}</span>
            </button>
          ))}
        </div>

        {/* Result summary indicator */}
        {(searchQuery || selectedCategory !== 'all' || selectedBadge !== 'all') && (
          <div className="text-[11px] text-neutral-500 flex items-center gap-3 pt-1">
            <span>Showing {availableCount} available dish{availableCount !== 1 ? 'es' : ''}</span>
            {soldOutCount > 0 && <span className="text-red-500">({soldOutCount} sold out)</span>}
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedBadge('all'); }}
              className="text-amber-700 font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Menu Item Cards Grid */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => !item.isSoldOut && onSelectItem(item)}
            className={`bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm transition-all flex gap-4 group ${
              item.isSoldOut
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:border-amber-400 hover:shadow-md cursor-pointer'
            }`}
          >
            {item.imageUrl && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-100 relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    !item.isSoldOut ? 'group-hover:scale-105' : 'grayscale'
                  }`}
                />
                {item.isSoldOut && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <h3 className={`text-sm font-bold text-neutral-900 truncate ${
                    !item.isSoldOut ? 'group-hover:text-amber-800 transition-colors' : ''
                  }`}>
                    {item.name}
                  </h3>
                  {!item.isSoldOut && item.badge && (
                    <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 rounded shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`font-mono text-sm font-bold whitespace-nowrap ${
                  item.isSoldOut ? 'line-through text-neutral-400' : 'text-amber-800'
                }`}>
                  {design.currencySymbol}{item.price.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-700">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Contains: {item.allergens.join(', ')}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">{item.pageTitle}</span>
                  {item.prepTime && !item.isSoldOut && (
                    <span className="flex items-center gap-0.5 text-neutral-500">
                      <Clock className="w-2.5 h-2.5" /> {item.prepTime}
                    </span>
                  )}
                </div>

                {item.isSoldOut ? (
                  <span className="text-red-500 font-semibold text-[11px]">Sold Out</span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
            <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No matching dishes found</h4>
            <p className="text-xs text-neutral-500 mt-1">Try searching for other ingredients or clear filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
