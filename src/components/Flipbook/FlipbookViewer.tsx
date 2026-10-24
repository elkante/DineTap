import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FlipPageRenderer } from './FlipPageRenderer';
import { FoodItem } from '../../types';
import { playPageTurnSound } from '../../utils/audio';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookMarked, 
  Volume2, 
  VolumeX, 
  X, 
  Plus, 
  Minus, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const FlipbookViewer: React.FC = () => {
  const { 
    activeRestaurant, 
    setCurrentView, 
    addToCart, 
  } = useApp();

  const pages = activeRestaurant.pages;
  const design = activeRestaurant.design;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  // Touch swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItem) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length, selectedItem, isAudioEnabled]);

  const triggerFlip = (direction: 'next' | 'prev', newIndex: number) => {
    if (newIndex < 0 || newIndex >= pages.length || isFlipping) return;
    
    setIsFlipping(true);
    setFlipDirection(direction);

    if (isAudioEnabled && design.enableAudioEffect) {
      playPageTurnSound();
    }

    setTimeout(() => {
      setCurrentPageIndex(newIndex);
      setIsFlipping(false);
    }, 320);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      triggerFlip('next', currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      triggerFlip('prev', currentPageIndex - 1);
    }
  };

  const jumpToPage = (index: number) => {
    if (index === currentPageIndex) {
      setContentsOpen(false);
      return;
    }
    const dir = index > currentPageIndex ? 'next' : 'prev';
    triggerFlip(dir, index);
    setContentsOpen(false);
  };

  const handleAddItemToCart = () => {
    if (!selectedItem || selectedItem.isSoldOut) return;
    for (let i = 0; i < itemQuantity; i++) {
      addToCart(selectedItem, itemNotes);
    }
    setSelectedItem(null);
    setItemQuantity(1);
    setItemNotes('');
  };

  const currentPage = pages[currentPageIndex] || pages[0];

  // Group pages for bookmark tabs (exclude cover)
  const categoryTabs = pages
    .map((p, idx) => ({ ...p, pageIndex: idx }))
    .filter(p => p.layout !== 'cover');

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#121110] text-neutral-100 flex flex-col justify-between py-2 sm:py-4 px-2 sm:px-6 relative select-none overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between text-xs px-2 mb-2 text-neutral-400">
        <div className="flex items-center gap-2 truncate">
          <span className="font-serif font-bold text-amber-200 truncate tracking-wide">
            {currentPage.layout === 'cover' ? 'Menu Cover' : currentPage.title}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-[11px] text-amber-400/90 font-bold">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Sound toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
            title={isAudioEnabled ? 'Mute page sound' : 'Enable page sound'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* Contents trigger */}
          <button
            onClick={() => setContentsOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200 hover:text-white bg-neutral-900/90 border border-amber-600/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span>Index</span>
          </button>
        </div>
      </div>

      {/* Main Authentic Book Spread Presentation */}
      <div 
        className="flex-1 flex items-center justify-center my-auto w-full relative py-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left (Desktop) */}
        <button
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-600/30 shadow-2xl transition-all mr-4 shrink-0 ${
            currentPageIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* THE PHYSICAL LUXURY RESTAURANT BOOK FOLIO */}
        {/* ========================================================================= */}
        <div className="relative flex items-center">
          {/* Outer Leather Folio Casing with Stitched Seam */}
          <div 
            className="relative p-2.5 sm:p-4 rounded-[26px] sm:rounded-[34px] shadow-2xl"
            style={{
              backgroundColor: '#1c1714',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(60, 45, 35, 0.4) 0%, rgba(20, 16, 14, 0.95) 100%)',
              border: '2px solid rgba(217, 119, 6, 0.35)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 35px rgba(0,0,0,0.8)'
            }}
          >
            {/* Brass Corner Brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-500/80 rounded-tl-xl pointer-events-none z-30" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-500/80 rounded-tr-xl pointer-events-none z-30" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-500/80 rounded-bl-xl pointer-events-none z-30" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-500/80 rounded-br-xl pointer-events-none z-30" />

            {/* Inner Gold Foil Filigree Trim */}
            <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-500/20 rounded-[20px] sm:rounded-[26px] pointer-events-none z-30" />

            {/* Book Spine Crease & Binding Stitch on Left Edge */}
            <div 
              className="absolute top-4 bottom-4 left-2.5 sm:left-4 w-4 z-30 pointer-events-none rounded-l-md"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
              }}
            />

            {/* Paper Stack Edge Depth Effect on the Right Edge */}
            <div 
              className="w-full max-w-md sm:max-w-lg h-[540px] xs:h-[590px] sm:h-[640px] relative rounded-2xl overflow-hidden bg-white"
              style={{
                boxShadow: '2px 0 0 #f0ece1, 4px 0 0 #e6dfcf, 6px 0 0 #ded6c2, 10px 5px 25px rgba(0,0,0,0.45)',
                perspective: '1600px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Spine Gutter Shadow overlay down the left side of every page */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-8 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)'
                }}
              />

              {/* 3D Flipping Page Container */}
              <div 
                className={`w-full h-full transition-transform duration-300 ease-out origin-left ${
                  isFlipping
                    ? (flipDirection === 'next' ? '-rotate-y-12 scale-[0.985] opacity-90' : 'rotate-y-12 scale-[0.985] opacity-90')
                    : 'rotate-y-0 scale-100 opacity-100'
                }`}
                style={{
                  transformOrigin: 'left center'
                }}
              >
                <FlipPageRenderer
                  page={currentPage}
                  design={design}
                  restaurantName={activeRestaurant.name}
                  restaurantLogo={activeRestaurant.logo}
                  restaurantTagline={activeRestaurant.tagline}
                  restaurantHours={activeRestaurant.openingHours}
                  restaurantAddress={activeRestaurant.address}
                  isCover={currentPageIndex === 0 || currentPage.layout === 'cover'}
                  onSelectItem={(it) => {
                    if (!it.isSoldOut) setSelectedItem(it);
                  }}
                  pageNumberDisplay={currentPageIndex + 1}
                />
              </div>

              {/* Dynamic Page Turn Dynamic Light / Shadow Sheen */}
              {isFlipping && (
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-20 ${
                    flipDirection === 'next'
                      ? 'bg-gradient-to-r from-transparent via-black/10 to-black/35'
                      : 'bg-gradient-to-l from-transparent via-black/10 to-black/35'
                  }`}
                />
              )}

              {/* Dog-ear corner fold in bottom right */}
              {currentPageIndex < pages.length - 1 && !isFlipping && (
                <div 
                  onClick={goToNextPage}
                  className="absolute bottom-0 right-0 w-12 h-12 z-25 cursor-pointer group"
                  title="Turn to next page"
                >
                  <div 
                    className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[28px] border-r-[28px] border-t-amber-400/30 border-r-transparent group-hover:border-t-amber-400/60 transition-all drop-shadow"
                    style={{ transform: 'rotate(180deg)' }}
                  />
                  <div className="absolute bottom-1 right-1 text-[8px] font-bold text-amber-900/60 pointer-events-none">
                    ▶
                  </div>
                </div>
              )}

              {/* Mobile Tap Zones */}
              <div 
                onClick={goToPrevPage}
                className="absolute top-0 bottom-0 left-0 w-16 z-20 cursor-pointer"
                title="Tap left edge to go back"
              />
              <div 
                onClick={goToNextPage}
                className="absolute top-0 bottom-0 right-0 w-16 z-20 cursor-pointer"
                title="Tap right edge to go forward"
              />
            </div>
          </div>

          {/* Bookmark Category Tabs protruding from the right edge */}
          <div className="hidden lg:flex flex-col gap-2 ml-1 z-10">
            {categoryTabs.map(tab => {
              const isActive = currentPageIndex === tab.pageIndex;
              return (
                <button
                  key={tab.id}
                  onClick={() => jumpToPage(tab.pageIndex)}
                  className={`px-3 py-2 rounded-r-xl text-[11px] font-bold tracking-tight text-left transition-all border-y border-r shadow-md flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 border-amber-300 translate-x-1 font-extrabold shadow-lg'
                      : 'bg-neutral-900/90 text-amber-200/80 hover:text-white hover:bg-neutral-800 border-amber-600/30'
                  }`}
                  style={{
                    boxShadow: isActive ? '3px 3px 10px rgba(217, 119, 6, 0.4)' : undefined
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span className="truncate max-w-[90px]">{tab.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrow Right (Desktop) */}
        <button
          onClick={goToNextPage}
          disabled={currentPageIndex >= pages.length - 1 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-600/30 shadow-2xl transition-all ml-4 shrink-0 ${
            currentPageIndex >= pages.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Bottom Ergonomic Navigation Bar */}
      <div className="max-w-md sm:max-w-lg mx-auto w-full pt-2 pb-1">
        <div className="bg-neutral-900/95 backdrop-blur-md rounded-2xl p-2 px-3 border border-amber-600/30 flex items-center justify-between gap-3 shadow-2xl">
          {/* Prev Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 disabled:opacity-25 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Dots & Title */}
          <div className="flex-1 text-center truncate">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToPage(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentPageIndex 
                      ? 'w-5 bg-amber-400 shadow-sm' 
                      : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
            <div className="text-[11px] font-semibold text-neutral-300 truncate">
              {currentPage.layout === 'cover' ? 'Welcome Cover' : currentPage.title}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex >= pages.length - 1}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 disabled:opacity-25 transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table of Contents Drawer */}
      {contentsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1714] border border-amber-600/40 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-200">Menu Book Index</h3>
              </div>
              <button 
                onClick={() => setContentsOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => jumpToPage(idx)}
                  className={`w-full p-2.5 text-left rounded-xl border transition-all flex items-center justify-between ${
                    idx === currentPageIndex
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 text-neutral-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs">{p.title}</div>
                    {p.subtitle && (
                      <div className="text-[10px] text-neutral-500 truncate">{p.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 ml-2">
                    {p.layout === 'cover' ? 'Cover' : `Page ${idx + 1}`}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setContentsOpen(false);
                  setCurrentView('quick_menu');
                }}
                className="text-amber-400 hover:underline text-[11px] font-bold"
              >
                Switch to Quick List View &rarr;
              </button>
              <button
                onClick={() => setContentsOpen(false)}
                className="text-neutral-400 hover:text-white text-[11px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            {selectedItem.imageUrl && (
              <div className="w-full h-44 relative overflow-hidden bg-neutral-950">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {selectedItem.badge && (
                  <span className="absolute bottom-2.5 left-3 px-2 py-0.5 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded shadow">
                    {selectedItem.badge}
                  </span>
                )}
              </div>
            )}

            <div className="p-5">
              {!selectedItem.imageUrl && (
                <div className="flex justify-end mb-2">
                  <button onClick={() => setSelectedItem(null)} className="text-neutral-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <h3 className="text-base font-bold text-white truncate">{selectedItem.name}</h3>
                <span className="font-mono text-base font-bold text-amber-400 whitespace-nowrap">
                  {design.currencySymbol}{selectedItem.price.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                {selectedItem.description}
              </p>

              {/* Badges / Prep Time / Allergens */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                {selectedItem.prepTime && (
                  <span className="flex items-center gap-1 text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-amber-400" /> {selectedItem.prepTime}
                  </span>
                )}
                {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3 text-amber-400" /> Allergens: {selectedItem.allergens.join(', ')}
                  </span>
                )}
              </div>

              {/* Kitchen Notes */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Kitchen Notes / Dietary Requests
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="e.g. Extra spicy, sauce on side, no onions..."
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quantity selector & Add Button */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center gap-2 bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-neutral-700">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold text-white w-5 text-center">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddItemToCart}
                  className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    Add · {design.currencySymbol}{(selectedItem.price * itemQuantity).toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
