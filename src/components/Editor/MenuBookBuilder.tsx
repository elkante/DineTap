import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FlipPageRenderer } from '../Flipbook/FlipPageRenderer';
import { 
  MenuBookPage, 
  FoodItem, 
  PageLayoutType, 
  MenuTemplateId, 
  PaperTexture, 
  FontStyle 
} from '../../types';
import { TEMPLATE_PRESETS } from '../../data/initialData';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Save, 
  Palette, 
  Layers, 
  Layout,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';

const AVAILABLE_IMAGES = [
  { name: 'Jollof & Chicken', url: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg' },
  { name: 'Suya Skewers', url: '/src/assets/images/dish_suya_platter_1792837967531.jpg' },
  { name: 'Grilled Fish Feast', url: '/src/assets/images/dish_grilled_fish_1792837967875.jpg' },
  { name: 'Gourmet Burger', url: '/src/assets/images/dish_gourmet_burger_1792837968226.jpg' },
];

export const MenuBookBuilder: React.FC = () => {
  const { 
    activeRestaurant, 
    updateDesign, 
    applyTemplate, 
    updatePage, 
    addPage, 
    deletePage, 
    duplicatePage, 
    reorderPages, 
    addFoodItem, 
    updateFoodItem, 
    deleteFoodItem,
    toggleSoldOut,
    setCurrentView,
    showNotification 
  } = useApp();

  const pages = activeRestaurant.pages;
  const design = activeRestaurant.design;

  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [mobileTab, setMobileTab] = useState<'preview' | 'items' | 'pages' | 'themes'>('preview');
  const [editingItem, setEditingItem] = useState<{ pageId: string; item: FoodItem } | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(3500);
  const [newItemBadge, setNewItemBadge] = useState<FoodItem['badge']>('');
  const [newItemImage, setNewItemImage] = useState(AVAILABLE_IMAGES[0].url);

  const safePageIndex = Math.min(Math.max(0, selectedPageIndex), pages.length - 1);
  const selectedPage = pages[safePageIndex] || pages[0];

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      showNotification('Please enter a valid dish name.');
      return;
    }

    const priceNum = Number(newItemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showNotification('Please enter a valid price (0 or higher).');
      return;
    }

    addFoodItem(selectedPage.id, {
      name: trimmedName,
      description: newItemDesc.trim(),
      price: priceNum,
      badge: newItemBadge,
      imageUrl: newItemImage,
      prepTime: '15 min'
    });

    setNewItemName('');
    setNewItemDesc('');
    setIsNewItemModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-100 flex flex-col justify-between">
      {/* Top Mobile-Friendly Toolbar */}
      <div className="bg-white border-b border-neutral-200 px-3 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 shrink-0"
            title="Back to menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="truncate">
            <h1 className="text-xs font-bold text-neutral-900 truncate flex items-center gap-1.5">
              <span>Menu Book Builder</span>
            </h1>
            <p className="text-[10px] text-neutral-500 truncate">
              {activeRestaurant.name} · P.{safePageIndex + 1} of {pages.length}
            </p>
          </div>
        </div>

        {/* View / Publish Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden xs:inline">Preview</span>
          </button>

          <button
            onClick={() => showNotification('Menu book changes published to public flipbook & NFC tags!')}
            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Page Carousel / Horizontal Stepper */}
      <div className="bg-white border-b border-neutral-200 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => setSelectedPageIndex(Math.max(0, safePageIndex - 1))}
          disabled={safePageIndex === 0}
          className="p-1.5 rounded-lg bg-neutral-100 disabled:opacity-30 shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-neutral-700" />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPageIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                idx === safePageIndex
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {p.layout === 'cover' ? 'Cover' : `P${idx + 1}: ${p.title.split(' ')[0]}`}
            </button>
          ))}
          <button
            onClick={() => {
              addPage('two_column_grid');
              setSelectedPageIndex(pages.length);
            }}
            className="px-2 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-0.5 shrink-0"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <button
          onClick={() => setSelectedPageIndex(Math.min(pages.length - 1, safePageIndex + 1))}
          disabled={safePageIndex >= pages.length - 1}
          className="p-1.5 rounded-lg bg-neutral-100 disabled:opacity-30 shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 text-neutral-700" />
        </button>
      </div>

      {/* Main Responsive Canvas & Editor Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center">
        {/* TAB 1: LIVE CANVAS PREVIEW */}
        {mobileTab === 'preview' && (
          <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center">
            {/* Page Header Bar */}
            <div className="w-full bg-white rounded-xl border border-neutral-200 p-2.5 mb-3 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <Layout className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-bold truncate">{selectedPage.title}</span>
              </div>
              {selectedPage.layout !== 'cover' && (
                <button
                  onClick={() => setIsNewItemModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add Dish
                </button>
              )}
            </div>

            {/* Canvas Frame */}
            <div className="w-full h-[520px] xs:h-[580px] bg-white rounded-2xl shadow-lg border border-neutral-300 overflow-hidden relative">
              <FlipPageRenderer
                page={selectedPage}
                design={design}
                restaurantName={activeRestaurant.name}
                restaurantLogo={activeRestaurant.logo}
                restaurantTagline={activeRestaurant.tagline}
                restaurantHours={activeRestaurant.openingHours}
                restaurantAddress={activeRestaurant.address}
                isCover={selectedPage.layout === 'cover'}
                onSelectItem={(it) => setEditingItem({ pageId: selectedPage.id, item: it })}
                pageNumberDisplay={safePageIndex + 1}
              />
            </div>
            <div className="text-[11px] text-neutral-400 mt-2 text-center">
              Tap any dish on the preview above to edit prices or description.
            </div>
          </div>
        )}

        {/* TAB 2: DISHES ON THIS PAGE */}
        {mobileTab === 'items' && (
          <div className="w-full max-w-md space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="font-bold text-xs text-neutral-900">
                  Page Details: {selectedPage.title}
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">P.{safePageIndex + 1}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">Page Title</label>
                <input
                  type="text"
                  value={selectedPage.title}
                  onChange={(e) => updatePage(selectedPage.id, { title: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={selectedPage.subtitle || ''}
                  onChange={(e) => updatePage(selectedPage.id, { subtitle: e.target.value })}
                  placeholder="e.g. Traditional firewood pot recipes"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">Layout</label>
                <select
                  value={selectedPage.layout}
                  onChange={(e) => updatePage(selectedPage.id, { layout: e.target.value as PageLayoutType })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                >
                  <option value="cover">Cover Page</option>
                  <option value="two_column_grid">Cards with Photos</option>
                  <option value="hero_three_items">Hero Photo + 3 Feature Dishes</option>
                  <option value="chef_specials">Chef Specials Showcase</option>
                  <option value="editorial_list">Classic Dotted List</option>
                  <option value="drinks_beverage">Drinks & Beverage Rows</option>
                </select>
              </div>
            </div>

            {selectedPage.layout !== 'cover' && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-neutral-900">
                    Dishes on this Page ({selectedPage.items.length})
                  </h3>
                  <button
                    onClick={() => setIsNewItemModalOpen(true)}
                    className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> Add Dish
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedPage.items.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => setEditingItem({ pageId: selectedPage.id, item: it })}
                      className="p-3 border border-neutral-200 rounded-xl flex items-center justify-between hover:border-amber-400 bg-neutral-50/50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 text-xs truncate">{it.name}</span>
                          {it.isSoldOut && (
                            <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.2 rounded">Sold Out</span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-amber-800 font-bold mt-0.5">
                          {design.currencySymbol}{it.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSoldOut(selectedPage.id, it.id)}
                          className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors ${
                            it.isSoldOut
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                          title="Toggle Sold Out"
                        >
                          {it.isSoldOut ? 'Restock' : 'Mark Sold Out'}
                        </button>
                        <button
                          onClick={() => setEditingItem({ pageId: selectedPage.id, item: it })}
                          className="text-[11px] text-neutral-500 bg-white border border-neutral-200 px-2 py-1 rounded-md font-medium hover:border-neutral-400"
                        >
                          Edit →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE PAGES */}
        {mobileTab === 'pages' && (
          <div className="w-full max-w-md space-y-3">
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-neutral-900">All Pages ({pages.length})</h3>
                <button
                  onClick={() => addPage('two_column_grid')}
                  className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Page
                </button>
              </div>

              <div className="space-y-2">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPageIndex(idx);
                      setMobileTab('preview');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      idx === safePageIndex
                        ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] opacity-70">
                        {p.layout === 'cover' ? 'C' : `P${idx + 1}`}
                      </span>
                      <span className="truncate">{p.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => reorderPages(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 hover:opacity-80 disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorderPages(idx, idx + 1)}
                        disabled={idx === pages.length - 1}
                        className="p-1 hover:opacity-80 disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={() => deletePage(p.id)}
                          className="p-1 text-red-400 hover:text-red-500"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THEMES & STYLES */}
        {mobileTab === 'themes' && (
          <div className="w-full max-w-md space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
              <h3 className="font-bold text-xs text-neutral-900 mb-1">Professional Style Presets</h3>
              <p className="text-[11px] text-neutral-500 mb-3">
                1-tap styling for your digital menu book. Dish prices stay preserved!
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TEMPLATE_PRESETS) as MenuTemplateId[]).map((tplKey) => {
                  const tpl = TEMPLATE_PRESETS[tplKey];
                  const isCurrent = design.templateId === tplKey;
                  return (
                    <button
                      key={tplKey}
                      onClick={() => applyTemplate(tplKey)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.previewColor }} />
                        <span className="text-[11px] truncate">{tpl.name.split(' ')[0]}</span>
                      </div>
                      <div className={`text-[10px] line-clamp-2 ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {tpl.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Design Tweaks */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-neutral-900">Custom Colors & Currency</h3>

              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Accent Color</span>
                <input
                  type="color"
                  value={design.accentColor}
                  onChange={(e) => updateDesign({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Currency</span>
                <div className="flex gap-1.5 font-mono font-bold">
                  {['₦', '$', '£', '€'].map((sym) => (
                    <button
                      key={sym}
                      onClick={() => updateDesign({ currencySymbol: sym })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        design.currencySymbol === sym
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'border-neutral-200'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Mobile Mode Tabs */}
      <div className="bg-white border-t border-neutral-200 p-2 shrink-0">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5 text-xs">
          <button
            onClick={() => setMobileTab('preview')}
            className={`py-2 rounded-xl text-center font-bold transition-all ${
              mobileTab === 'preview'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setMobileTab('items')}
            className={`py-2 rounded-xl text-center font-bold transition-all ${
              mobileTab === 'items'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Dishes
          </button>
          <button
            onClick={() => setMobileTab('pages')}
            className={`py-2 rounded-xl text-center font-bold transition-all ${
              mobileTab === 'pages'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setMobileTab('themes')}
            className={`py-2 rounded-xl text-center font-bold transition-all ${
              mobileTab === 'themes'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Themes
          </button>
        </div>
      </div>

      {/* Modal: Add New Food Item */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Add Dish to {selectedPage.title}</h3>
            <p className="text-[11px] text-neutral-500 mb-3">Item appears immediately in your flipbook.</p>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Grilled Lamb Chops"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients and culinary notes..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Price ({design.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Badge</label>
                  <select
                    value={newItemBadge || ''}
                    onChange={(e) => setNewItemBadge(e.target.value as FoodItem['badge'])}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  >
                    <option value="">None</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Spicy">Spicy</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Photo</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {AVAILABLE_IMAGES.map((img) => (
                    <div
                      key={img.url}
                      onClick={() => setNewItemImage(img.url)}
                      className={`h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        newItemImage === img.url ? 'border-amber-600 scale-95' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Add Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Food Item */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Edit Dish</h3>
            <p className="text-[11px] text-neutral-500 mb-3">Live updates reflect immediately in your menu.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingItem.item.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, name: val } } : null);
                    updateFoodItem(editingItem.pageId, editingItem.item.id, { name: val });
                  }}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.item.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, description: val } } : null);
                    updateFoodItem(editingItem.pageId, editingItem.item.id, { description: val });
                  }}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Price ({design.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingItem.item.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, price: val } } : null);
                      updateFoodItem(editingItem.pageId, editingItem.item.id, { price: val });
                    }}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Badge</label>
                  <select
                    value={editingItem.item.badge || ''}
                    onChange={(e) => {
                      const val = e.target.value as FoodItem['badge'];
                      setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, badge: val } } : null);
                      updateFoodItem(editingItem.pageId, editingItem.item.id, { badge: val });
                    }}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
                  >
                    <option value="">None</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Spicy">Spicy</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <span className="font-bold text-neutral-800 text-xs block">Sold Out Status</span>
                  <span className="text-[10px] text-neutral-500">Temporarily disable customer ordering</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !editingItem.item.isSoldOut;
                    setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, isSoldOut: next } } : null);
                    updateFoodItem(editingItem.pageId, editingItem.item.id, { isSoldOut: next });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    editingItem.item.isSoldOut
                      ? 'bg-red-500 text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {editingItem.item.isSoldOut ? 'Sold Out' : 'Available'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    deleteFoodItem(editingItem.pageId, editingItem.item.id);
                    setEditingItem(null);
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Delete Dish
                </button>

                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
