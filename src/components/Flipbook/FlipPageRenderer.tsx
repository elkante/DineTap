import React from 'react';
import { MenuBookPage, MenuBookDesign, FoodItem } from '../../types';
import { Plus, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface FlipPageRendererProps {
  page: MenuBookPage;
  design: MenuBookDesign;
  restaurantName: string;
  restaurantLogo: string;
  restaurantTagline: string;
  restaurantHours?: string;
  restaurantAddress?: string;
  isCover?: boolean;
  onSelectItem?: (item: FoodItem) => void;
  pageNumberDisplay?: string | number;
}

export const FlipPageRenderer: React.FC<FlipPageRendererProps> = ({
  page,
  design,
  restaurantName,
  restaurantLogo,
  restaurantTagline,
  restaurantHours,
  restaurantAddress,
  isCover = false,
  onSelectItem,
  pageNumberDisplay,
}) => {
  const isDark = design.paperTexture === 'dark_slate';

  const getTextureBg = () => {
    switch (design.paperTexture) {
      case 'dark_slate':
        return 'bg-neutral-900 text-neutral-100';
      case 'parchment':
        return 'bg-[#FDFBF7] text-stone-900';
      case 'warm_kraft':
        return 'bg-[#F5EFE6] text-stone-900';
      case 'classic_linen':
        return 'bg-[#FAF8F5] text-neutral-900';
      case 'clean_cardstock':
      default:
        return 'bg-[#FAF9F6] text-neutral-900';
    }
  };

  const getFontFamily = () => {
    switch (design.fontStyle) {
      case 'serif_luxury':
        return 'font-serif';
      case 'bold_punchy':
        return 'font-sans font-black tracking-tight';
      case 'retro_bistro':
      case 'modern_sans':
      default:
        return 'font-serif';
    }
  };

  // =========================================================================
  // COVER PAGE: Luxury Leather/Linen Book Cover with Debossed Gold Details
  // =========================================================================
  if (page.layout === 'cover' || isCover) {
    return (
      <div className="w-full h-full relative flex flex-col justify-between overflow-hidden select-none bg-[#1A1816] text-amber-50">
        {/* Full bleed cover image with rich cinematic gradient */}
        {page.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={page.backgroundImage}
              alt={restaurantName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-35 filter brightness-90 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          </div>
        )}

        {/* Book Spine Crease Shadow (Left side) */}
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none z-20" />

        {/* Luxury Gold/Accent Corner Brackets */}
        <div className="absolute top-4 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-500/50 pointer-events-none z-10" />
        <div className="absolute top-4 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-500/50 pointer-events-none z-10" />

        {/* Inner Gold Foil Filigree Border */}
        <div className="absolute inset-3 sm:inset-5 border border-amber-500/30 rounded-2xl pointer-events-none z-10" />

        {/* Top Header Crest */}
        <div className="relative z-10 text-center pt-8 sm:pt-10 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-3 h-3" />
            <span>Digital Dining Book</span>
          </div>

          {restaurantLogo && (restaurantLogo.startsWith('data:') || restaurantLogo.startsWith('http') || restaurantLogo.startsWith('/')) ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mt-3 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-neutral-900/60 p-1">
              <img src={restaurantLogo} alt={restaurantName} className="w-full h-full object-cover rounded-xl" />
            </div>
          ) : (
            <div className="text-4xl sm:text-5xl mt-3 drop-shadow-md">
              {restaurantLogo}
            </div>
          )}
        </div>

        {/* Center Title & Crest */}
        <div className="relative z-10 text-center px-6 my-auto">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3 opacity-75" />
          
          <h1 className={`text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg text-white ${getFontFamily()}`}>
            {restaurantName}
          </h1>

          <p className="text-xs sm:text-sm italic text-amber-200/90 font-medium mt-2 max-w-xs mx-auto drop-shadow">
            &ldquo;{restaurantTagline}&rdquo;
          </p>
          
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-3 opacity-75" />
        </div>

        {/* Bottom Details */}
        <div className="relative z-10 text-center pb-6 sm:pb-8 px-6">
          <p className="text-[11px] text-neutral-400 truncate mb-1">
            {restaurantHours || 'Open Daily for Dining & Reservations'}
          </p>
          {restaurantAddress && (
            <p className="text-[10px] text-neutral-500 truncate max-w-xs mx-auto mb-2">
              {restaurantAddress}
            </p>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            <span>Tap edge or swipe to open menu &rarr;</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHEF SPECIALS LAYOUT
  // =========================================================================
  if (page.layout === 'chef_specials') {
    const featuredItem = page.items[0];
    const otherItems = page.items.slice(1);

    return (
      <div className={`w-full h-full p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden select-none ${getTextureBg()}`}>
        {/* Book Spine Shadow on left side */}
        <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-10" />

        {/* Header Section */}
        <div className="mb-3 shrink-0 pb-2 border-b border-stone-300/80 dark:border-neutral-800">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-800 font-bold block">
                Signature Showcase
              </span>
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white ${getFontFamily()}`}>
                {page.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-stone-400">
              P. {pageNumberDisplay || page.pageNumber}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 pb-2">
          {/* Featured Hero Dish Card */}
          {featuredItem && (
            <div
              onClick={() => !featuredItem.isSoldOut && onSelectItem?.(featuredItem)}
              className={`rounded-2xl overflow-hidden border shadow-sm transition-all ${
                featuredItem.isSoldOut ? 'opacity-60 cursor-not-allowed border-stone-200' : 'cursor-pointer hover:shadow-md border-stone-300/80 active:scale-[0.99]'
              } ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white'}`}
            >
              {featuredItem.imageUrl ? (
                <div className="w-full h-36 xs:h-44 relative bg-neutral-900">
                  <img
                    src={featuredItem.imageUrl}
                    alt={featuredItem.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${featuredItem.isSoldOut ? 'grayscale' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  {featuredItem.isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        Sold Out
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <div>
                      {featuredItem.badge && !featuredItem.isSoldOut && (
                        <span className="inline-block mb-1 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500 text-neutral-950 shadow-xs">
                          ⭐ {featuredItem.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white drop-shadow truncate">{featuredItem.name}</h3>
                      <p className="text-[10px] text-white/80 line-clamp-1">{featuredItem.description}</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-amber-400 shrink-0 ml-2">
                      {design.currencySymbol}{featuredItem.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{featuredItem.name}</h3>
                    <span className="font-mono font-bold text-sm text-amber-800">
                      {design.currencySymbol}{featuredItem.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2">{featuredItem.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Other Specials Grid */}
          {otherItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {otherItems.map(item => (
                <FoodItemRow
                  key={item.id}
                  item={item}
                  design={design}
                  isDark={isDark}
                  onSelect={() => onSelectItem?.(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 shrink-0 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-200 dark:border-neutral-800">
          <span className="truncate">{restaurantName}</span>
          <span className="font-mono">P. {pageNumberDisplay || page.pageNumber}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD TWO-COLUMN / LIST CONTENT PAGES
  // =========================================================================
  return (
    <div className={`w-full h-full p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden select-none ${getTextureBg()}`}>
      {/* Book Spine Shadow on left */}
      <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-10" />

      {/* Page Header */}
      <div className="mb-3 shrink-0 pb-2 border-b border-stone-300/80 dark:border-neutral-800">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-800 font-bold block">
              Menu Course
            </span>
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight truncate text-neutral-900 dark:text-white ${getFontFamily()}`}>
              {page.title}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-stone-400 shrink-0">
            P. {pageNumberDisplay || page.pageNumber}
          </span>
        </div>
      </div>

      {/* Main Dishes List / Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 pb-2">
        {page.items.map(item => (
          <FoodItemRow
            key={item.id}
            item={item}
            design={design}
            isDark={isDark}
            onSelect={() => onSelectItem?.(item)}
          />
        ))}

        {page.items.length === 0 && (
          <div className="text-center py-12 text-stone-400 text-xs">
            No dishes added to this section yet.
          </div>
        )}
      </div>

      {/* Page Footer */}
      <div className="pt-2 shrink-0 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-200 dark:border-neutral-800">
        <span className="truncate">{restaurantName}</span>
        <span className="font-mono">P. {pageNumberDisplay || page.pageNumber}</span>
      </div>
    </div>
  );
};

// Reusable Dish Row
const FoodItemRow: React.FC<{
  item: FoodItem;
  design: MenuBookDesign;
  isDark?: boolean;
  onSelect: () => void;
}> = ({ item, design, isDark, onSelect }) => {
  return (
    <div
      onClick={() => !item.isSoldOut && onSelect()}
      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        item.isSoldOut
          ? 'opacity-55 cursor-not-allowed bg-stone-100 border-stone-200'
          : 'cursor-pointer hover:shadow-xs active:scale-[0.99] bg-white border-stone-200/90'
      } ${isDark ? '!bg-neutral-800 !border-neutral-700' : ''}`}
    >
      {item.imageUrl && (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-stone-100 relative">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover ${item.isSoldOut ? 'grayscale' : ''}`}
          />
          {item.isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.2 rounded uppercase">
                Sold Out
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1.5">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
            {item.name}
          </h4>
          <span className={`font-mono text-xs sm:text-sm font-bold shrink-0 ${
            item.isSoldOut ? 'line-through text-stone-400' : 'text-amber-800'
          }`}>
            {design.currencySymbol}{item.price.toLocaleString()}
          </span>
        </div>

        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
          {item.badge && !item.isSoldOut && (
            <span className="font-semibold text-amber-800 px-1.5 py-0.2 bg-amber-50 rounded">
              {item.badge}
            </span>
          )}
          {item.prepTime && !item.isSoldOut && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {item.prepTime}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {!item.isSoldOut ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center font-bold transition-colors"
            title="Add to order"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[10px] text-red-500 font-bold">Sold Out</span>
        )}
      </div>
    </div>
  );
};
