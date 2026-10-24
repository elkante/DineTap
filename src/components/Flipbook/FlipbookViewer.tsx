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
  Clock
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

  // Touch swipe handling
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

    // Horizontal swipe threshold
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
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
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
    }, 280);
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-900 text-neutral-100 flex flex-col justify-between py-3 px-2 sm:px-4 relative select-none">
      {/* Top Subtle Info Bar */}
      <div className="max-w-md sm:max-w-xl mx-auto w-full flex items-center justify-between text-xs px-2 mb-2 text-neutral-400">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-neutral-200 truncate">{currentPage.title}</span>
          <span>·</span>
          <span className="font-mono text-[11px] text-amber-400">
            {currentPageIndex + 1} of {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Sound toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
            title={isAudioEnabled ? 'Mute page sound' : 'Enable page sound'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* Contents trigger */}
          <button
            onClick={() => setContentsOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 px-2 py-1 rounded-md transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span>Contents</span>
          </button>
        </div>
      </div>

      {/* Main Flipbook Book Container */}
      <div 
        className="flex-1 flex items-center justify-center my-auto w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left (Desktop) */}
        <button
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-xl transition-all mr-3 shrink-0 ${
            currentPageIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* BOOK PAGE CANVAS with realistic 3D perspective */}
        <div 
          className="w-full max-w-md sm:max-w-lg h-[580px] xs:h-[620px] sm:h-[660px] relative rounded-3xl shadow-2xl overflow-hidden border border-neutral-700/60 bg-white"
          style={{
            perspective: '1400px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Page Rendering with smooth 3D tilt & curl shading */}
          <div 
            className={`w-full h-full transition-all duration-300 ease-out origin-center ${
              isFlipping 
                ? (flipDirection === 'next' ? 'scale-[0.98] -rotate-y-12 opacity-85' : 'scale-[0.98] rotate-y-12 opacity-85') 
                : 'scale-100 rotate-y-0 opacity-100'
            }`}
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

          {/* Dynamic turn shadow overlay */}
          {isFlipping && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                flipDirection === 'next'
                  ? 'bg-gradient-to-r from-transparent via-black/10 to-black/30'
                  : 'bg-gradient-to-l from-transparent via-black/10 to-black/30'
              }`}
            />
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

        {/* Navigation Arrow Right (Desktop) */}
        <button
          onClick={goToNextPage}
          disabled={currentPageIndex >= pages.length - 1 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-xl transition-all ml-3 shrink-0 ${
            currentPageIndex >= pages.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Bottom Ergonomic Bar */}
      <div className="max-w-md sm:max-w-lg mx-auto w-full pt-2">
        <div className="bg-neutral-800/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-neutral-700/60 flex items-center justify-between gap-3 shadow-lg">
          {/* Prev Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-xl bg-neutral-700/80 hover:bg-neutral-700 text-white disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Indicators */}
          <div className="flex-1 text-center truncate">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToPage(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentPageIndex 
                      ? 'w-5 bg-amber-400' 
                      : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
            <div className="text-[11px] font-medium text-neutral-300 truncate">
              {currentPage.layout === 'cover' ? 'Welcome Cover' : currentPage.title}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex >= pages.length - 1}
            className="p-2 rounded-xl bg-neutral-700/80 hover:bg-neutral-700 text-white disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table of Contents Drawer */}
      {contentsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Menu Sections</h3>
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
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-800/40 text-neutral-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs">{p.title}</div>
                    {p.subtitle && (
                      <div className="text-[10px] text-neutral-500 truncate">{p.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 ml-2">
                    {p.layout === 'cover' ? 'Cover' : `P.${idx + 1}`}
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
                className="text-amber-400 hover:underline text-[11px] font-medium"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
