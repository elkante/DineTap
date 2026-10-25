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

  const pages = activeRestaurant.pages || [];
  const design = activeRestaurant.design;
  const coverThemeColor = design?.coverColor || design?.primaryColor || '#0c2e22';

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [fromPageIndex, setFromPageIndex] = useState<number | null>(null);
  const [targetPageIndex, setTargetPageIndex] = useState<number | null>(null);

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
    
    setFromPageIndex(currentPageIndex);
    setTargetPageIndex(newIndex);
    setIsFlipping(true);
    setFlipDirection(direction);

    if (isAudioEnabled && design.enableAudioEffect) {
      playPageTurnSound();
    }

    setTimeout(() => {
      setCurrentPageIndex(newIndex);
      setIsFlipping(false);
      setFromPageIndex(null);
      setTargetPageIndex(null);
    }, 520);
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

  const currentPage = pages[currentPageIndex] || pages[0] || {
    id: 'cover',
    pageNumber: 1,
    title: activeRestaurant.name || 'Menu',
    layout: 'cover' as const,
    items: []
  };

  // Extract category pages for bottom pill navigation (Ref: The Corner Table)
  const categoryPages = pages
    .map((p, idx) => ({ ...p, pageIndex: idx }))
    .filter(p => p.layout !== 'cover');

  return (
    <div 
      className="min-h-[calc(100vh-3.5rem)] text-neutral-100 flex flex-col justify-between py-2 sm:py-4 px-2 sm:px-6 relative select-none overflow-x-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${coverThemeColor}55 0%, #111412 85%, #0a0c0b 100%)`
      }}
    >
      {/* Top Subtle Status Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between text-xs px-2 mb-1.5 text-neutral-400 relative z-10">
        <div className="flex items-center gap-2 truncate">
          <span className="font-serif font-bold text-amber-200/90 truncate tracking-wide">
            {currentPage.layout === 'cover' ? activeRestaurant.name : currentPage.title}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-[11px] text-amber-400/90 font-bold">
            {currentPageIndex + 1} / {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
            title={isAudioEnabled ? 'Mute page sound' : 'Enable page sound'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
          </button>
        </div>
      </div>

      {/* Main Authentic Book Spread (Matching The Corner Table & Open Brochure) */}
      <div 
        className="flex-1 flex items-center justify-center my-auto w-full relative py-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left (Desktop) */}
        <button
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 border border-amber-600/30 shadow-2xl transition-all mr-4 shrink-0 ${
            currentPageIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* PHYSICAL LEATHER-BOUND RESTAURANT MENU BOOK */}
        {/* ========================================================================= */}
        <div className="relative w-[calc(100vw-1.25rem)] max-w-sm xs:max-w-md sm:max-w-lg mx-auto">
          {/* Outer Leather Folio Casing with Stacked Paper Edge Depth */}
          <div 
            className="relative w-full p-2 sm:p-3 rounded-[22px] sm:rounded-[32px] transition-transform duration-300"
            style={{
              backgroundColor: coverThemeColor,
              backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.45)',
              boxShadow: '0 25px 65px -15px rgba(0,0,0,0.85), inset 0 0 35px rgba(0,0,0,0.7)'
            }}
          >
            {/* Book Spine on the Left */}
            <div 
              className="absolute top-3 bottom-3 left-2 sm:left-3 w-4 sm:w-5 z-30 pointer-events-none rounded-l-md"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)'
              }}
            />

            {/* Brass Corner Braces in 4 corners */}
            <div className="absolute top-2.5 left-2.5 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-lg pointer-events-none z-30" />
            <div className="absolute top-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-lg pointer-events-none z-30" />
            <div className="absolute bottom-2.5 left-2.5 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-lg pointer-events-none z-30" />
            <div className="absolute bottom-2.5 right-2.5 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-[#D4AF37] rounded-br-lg pointer-events-none z-30" />

            {/* Layered Paper Stack Edge (Bottom & Right) to give true 3D book thickness */}
            <div 
              className="w-full h-[490px] xs:h-[550px] sm:h-[620px] relative rounded-2xl overflow-hidden bg-[#FAF7F2]"
              style={{
                boxShadow: `${Math.min(4, Math.max(1, Math.ceil((pages.length - 1 - currentPageIndex) / 2))) >= 1 ? '2px 2px 0 #ede8db, ' : ''}${Math.min(4, Math.max(1, Math.ceil((pages.length - 1 - currentPageIndex) / 2))) >= 2 ? '4px 4px 0 #e0d9c8, ' : ''}${Math.min(4, Math.max(1, Math.ceil((pages.length - 1 - currentPageIndex) / 2))) >= 3 ? '6px 6px 0 #d5ccb8, ' : ''}${Math.min(4, Math.max(1, Math.ceil((pages.length - 1 - currentPageIndex) / 2))) >= 4 ? '8px 8px 0 #c8bfa7, ' : ''}12px 14px 28px rgba(0,0,0,0.55)`,
                perspective: '2200px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Spine Gutter Shadow overlay down the left side */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-8 z-30 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 50%, transparent 100%)'
                }}
              />

              {/* Spine stitching line detail */}
              <div className="absolute top-0 bottom-0 left-2.5 w-[1px] bg-amber-400/20 z-30 pointer-events-none" />

              {!isFlipping ? (
                /* Resting State Page Leaf */
                <div className="w-full h-full relative">
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
              ) : (
                /* Active 3D Flipping Animation: Base Layer + Turning Leaf */
                <div className="w-full h-full relative" style={{ perspective: '2200px', transformStyle: 'preserve-3d' }}>
                  {/* Base Underneath Layer (Revealed page or background) */}
                  <div className="absolute inset-0 w-full h-full">
                    <FlipPageRenderer
                      page={flipDirection === 'next' ? (pages[targetPageIndex ?? 0] || currentPage) : (pages[fromPageIndex ?? 0] || currentPage)}
                      design={design}
                      restaurantName={activeRestaurant.name}
                      restaurantLogo={activeRestaurant.logo}
                      restaurantTagline={activeRestaurant.tagline}
                      restaurantHours={activeRestaurant.openingHours}
                      restaurantAddress={activeRestaurant.address}
                      isCover={(flipDirection === 'next' ? targetPageIndex : fromPageIndex) === 0 || (pages[flipDirection === 'next' ? (targetPageIndex ?? 0) : (fromPageIndex ?? 0)]?.layout === 'cover')}
                      pageNumberDisplay={(flipDirection === 'next' ? (targetPageIndex ?? 0) : (fromPageIndex ?? 0)) + 1}
                    />
                    {/* Shadow cast on the revealed page while turning leaf is overhead */}
                    <div className="absolute inset-0 bg-black animate-book-cast-shadow pointer-events-none z-10" />
                  </div>

                  {/* Top Turning Sheet (Physically turning in 3D perspective around the left spine) */}
                  <div 
                    className={`absolute inset-0 w-full h-full z-20 ${
                      flipDirection === 'next' ? 'animate-book-flip-next' : 'animate-book-flip-prev'
                    }`}
                  >
                    <FlipPageRenderer
                      page={flipDirection === 'next' ? (pages[fromPageIndex ?? 0] || currentPage) : (pages[targetPageIndex ?? 0] || currentPage)}
                      design={design}
                      restaurantName={activeRestaurant.name}
                      restaurantLogo={activeRestaurant.logo}
                      restaurantTagline={activeRestaurant.tagline}
                      restaurantHours={activeRestaurant.openingHours}
                      restaurantAddress={activeRestaurant.address}
                      isCover={(flipDirection === 'next' ? fromPageIndex : targetPageIndex) === 0 || (pages[flipDirection === 'next' ? (fromPageIndex ?? 0) : (targetPageIndex ?? 0)]?.layout === 'cover')}
                      pageNumberDisplay={(flipDirection === 'next' ? (fromPageIndex ?? 0) : (targetPageIndex ?? 0)) + 1}
                    />
                    {/* Dynamic cylindrical reflection and crease highlight across turning paper */}
                    <div 
                      className={`absolute inset-0 animate-book-curl-sheen pointer-events-none ${
                        flipDirection === 'next' 
                          ? 'bg-gradient-to-r from-transparent via-white/30 to-black/40' 
                          : 'bg-gradient-to-l from-transparent via-white/30 to-black/40'
                      }`} 
                    />
                  </div>
                </div>
              )}

              {/* Dog-ear corner fold in bottom right (Next Page Peel) */}
              {currentPageIndex < pages.length - 1 && !isFlipping && (
                <button 
                  onClick={goToNextPage}
                  className="absolute bottom-0 right-0 w-14 h-14 z-30 cursor-pointer group flex items-end justify-end focus:outline-none"
                  title="Turn to next page"
                  aria-label="Next page"
                >
                  <div 
                    className="w-0 h-0 border-solid border-t-[32px] border-r-[32px] border-t-amber-400/40 border-r-transparent group-hover:border-t-amber-400/80 group-hover:scale-110 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] origin-bottom-right"
                    style={{ transform: 'rotate(180deg)' }}
                  />
                  <div className="absolute bottom-1.5 right-1.5 text-[9px] font-black text-amber-950/70 group-hover:text-amber-950 transition-colors pointer-events-none">
                    ▶
                  </div>
                </button>
              )}

              {/* Dog-ear corner fold in bottom left (Previous Page Peel) */}
              {currentPageIndex > 0 && !isFlipping && (
                <button 
                  onClick={goToPrevPage}
                  className="absolute bottom-0 left-0 w-14 h-14 z-30 cursor-pointer group flex items-end justify-start focus:outline-none"
                  title="Turn to previous page"
                  aria-label="Previous page"
                >
                  <div 
                    className="w-0 h-0 border-solid border-t-[32px] border-l-[32px] border-t-amber-400/40 border-l-transparent group-hover:border-t-amber-400/80 group-hover:scale-110 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] origin-bottom-left"
                    style={{ transform: 'rotate(-90deg)' }}
                  />
                  <div className="absolute bottom-1.5 left-1.5 text-[9px] font-black text-amber-950/70 group-hover:text-amber-950 transition-colors pointer-events-none">
                    ◀
                  </div>
                </button>
              )}

              {/* Mobile Tap Zones */}
              <div 
                onClick={goToPrevPage}
                className="absolute top-0 bottom-0 left-0 w-16 z-25 cursor-pointer"
                title="Tap left edge to go back"
              />
              <div 
                onClick={goToNextPage}
                className="absolute top-0 bottom-0 right-0 w-16 z-25 cursor-pointer"
                title="Tap right edge to go forward"
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrow Right (Desktop) */}
        <button
          onClick={goToNextPage}
          disabled={currentPageIndex >= pages.length - 1 || isFlipping}
          className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-amber-300 border border-amber-600/30 shadow-2xl transition-all ml-4 shrink-0 ${
            currentPageIndex >= pages.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING PILL NAVIGATION BAR (Exact replica of The Corner Table reference!) */}
      {/* ========================================================================= */}
      <div className="max-w-xl mx-auto w-full px-2 pt-2 pb-1">
        <div className="bg-[#121614]/95 backdrop-blur-md rounded-full py-1.5 px-2.5 sm:px-4 border border-[#D4AF37]/40 flex items-center justify-between gap-1 shadow-2xl text-xs">
          {/* < Prev */}
          <button
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-0.5 font-bold text-neutral-300 hover:text-[#D4AF37] disabled:opacity-30 transition-colors whitespace-nowrap px-2 py-1 text-xs shrink-0"
          >
            <span>&lsaquo; Prev</span>
          </button>

          {/* Contents Index Modal Trigger */}
          <button
            onClick={() => setContentsOpen(true)}
            className="font-bold text-amber-200 hover:text-white transition-colors whitespace-nowrap px-2 py-1 text-xs flex items-center gap-1 shrink-0"
          >
            <BookMarked className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Contents</span>
          </button>

          {/* Horizontally scrollable Category Pills */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
            {categoryPages.map(cat => {
              const isActive = currentPageIndex === cat.pageIndex;
              return (
                <button
                  key={cat.id}
                  onClick={() => jumpToPage(cat.pageIndex)}
                  className={`font-semibold whitespace-nowrap px-2.5 py-1 rounded-full transition-all text-[11px] sm:text-xs shrink-0 ${
                    isActive
                      ? 'bg-[#D4AF37] text-neutral-950 font-bold shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>

          {/* Next > */}
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex >= pages.length - 1}
            className="flex items-center gap-0.5 font-bold text-neutral-300 hover:text-[#D4AF37] disabled:opacity-30 transition-colors whitespace-nowrap px-2 py-1 text-xs shrink-0"
          >
            <span>Next &rsaquo;</span>
          </button>
        </div>
      </div>

      {/* Full Contents Drawer Modal */}
      {contentsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151c18] border border-[#D4AF37]/45 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-amber-200">Table of Contents</h3>
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
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-amber-200 font-bold'
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
              <span className="text-[11px] text-amber-200/70">
                Tap any section to jump directly to it
              </span>
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
          <div className="bg-[#1c1917] border border-amber-600/40 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
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
                  <span className="absolute bottom-2.5 left-3 px-2 py-0.5 bg-[#D4AF37] text-neutral-950 font-bold text-[10px] rounded shadow">
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
                  className="flex-1 py-2.5 px-3 bg-[#D4AF37] hover:bg-[#e6c148] text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
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
