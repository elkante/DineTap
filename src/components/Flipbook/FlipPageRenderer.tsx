import React from 'react';
import { MenuBookPage, MenuBookDesign, FoodItem } from '../../types';
import { Plus, Clock, AlertCircle } from 'lucide-react';

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
  const getTextureStyle = () => {
    switch (design.paperTexture) {
      case 'dark_slate':
        return 'bg-neutral-900 text-neutral-100 border-neutral-800';
      case 'parchment':
        return 'bg-[#FDFBF7] text-stone-800 border-amber-900/10';
      case 'warm_kraft':
        return 'bg-[#F5EFE6] text-stone-900 border-stone-300';
      case 'classic_linen':
        return 'bg-[#FAF8F5] text-neutral-900 border-neutral-200';
      case 'clean_cardstock':
      default:
        return 'bg-white text-neutral-900 border-neutral-200';
    }
  };

  const isDarkTheme = design.paperTexture === 'dark_slate';

  const getFontFamily = () => {
    switch (design.fontStyle) {
      case 'serif_luxury':
        return 'font-serif';
      case 'bold_punchy':
        return 'font-sans font-bold tracking-tight';
      case 'retro_bistro':
      case 'modern_sans':
      default:
        return 'font-sans';
    }
  };

  // COVER PAGE LAYOUT
  if (page.layout === 'cover' || isCover) {
    return (
      <div
        className={`w-full h-full flex flex-col justify-between border relative overflow-hidden select-none ${getTextureStyle()}`}
        style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.04)' }}
      >
        {/* Full-bleed or hero background image */}
        {page.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={page.backgroundImage}
              alt={restaurantName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Decorative inner border */}
        <div
          className="absolute inset-2.5 sm:inset-4 border pointer-events-none rounded-2xl z-10"
          style={{ borderColor: design.accentColor, opacity: 0.5 }}
        />

        {/* Top Header */}
        <div className="relative z-10 text-center pt-6 px-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              backgroundColor: design.accentColor + '22',
              color: page.backgroundImage ? '#fff' : design.accentColor,
              border: `1px solid ${design.accentColor}44`
            }}
          >
            <span>Digital Menu Book</span>
          </div>
          <div className="text-4xl mb-1">{restaurantLogo}</div>
        </div>

        {/* Centerpiece Info */}
        <div className="relative z-10 text-center px-6 my-auto">
          <h1
            className={`text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md ${getFontFamily()}`}
            style={{ color: page.backgroundImage ? '#ffffff' : design.primaryColor }}
          >
            {restaurantName}
          </h1>
          <p
            className="text-sm italic font-medium drop-shadow"
            style={{ color: page.backgroundImage ? 'rgba(255,255,255,0.85)' : design.secondaryTextColor }}
          >
            &ldquo;{restaurantTagline}&rdquo;
          </p>

          {page.customNote && (
            <div
              className="mt-4 mx-auto max-w-xs text-[11px] px-4 py-2 rounded-xl"
              style={{
                backgroundColor: page.backgroundImage ? 'rgba(0,0,0,0.45)' : design.accentColor + '18',
                color: page.backgroundImage ? 'rgba(255,255,255,0.75)' : design.secondaryTextColor,
                border: `1px solid ${design.accentColor}33`
              }}
            >
              {page.customNote}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className="relative z-10 text-center pb-5 px-5 pt-3"
          style={{
            borderTop: page.backgroundImage ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${design.borderColor}`,
          }}
        >
          <div
            className="text-[10px] font-medium mb-1 truncate"
            style={{ color: page.backgroundImage ? 'rgba(255,255,255,0.6)' : design.secondaryTextColor }}
          >
            {restaurantHours || 'Open Daily for Dine-In & Takeaway'}
          </div>
          {restaurantAddress && (
            <div
              className="text-[10px] truncate max-w-xs mx-auto mb-1"
              style={{ color: page.backgroundImage ? 'rgba(255,255,255,0.5)' : design.secondaryTextColor }}
            >
              {restaurantAddress}
            </div>
          )}
          <div
            className="text-[11px] font-bold uppercase tracking-widest pt-1"
            style={{ color: page.backgroundImage ? design.accentColor : design.primaryColor }}
          >
            Swipe or tap to browse dishes &rarr;
          </div>
        </div>
      </div>
    );
  }

  // CHEF SPECIALS LAYOUT
  if (page.layout === 'chef_specials') {
    const featuredItem = page.items[0];
    const otherItems = page.items.slice(1);
    return (
      <div
        className={`w-full h-full p-4 sm:p-5 flex flex-col border relative overflow-hidden select-none ${getTextureStyle()}`}
        style={{ boxShadow: 'inset 0 0 25px rgba(0,0,0,0.03)' }}
      >
        {/* Header */}
        <div className="mb-3 shrink-0">
          <div className="flex items-baseline justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${design.borderColor}80` }}>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: design.accentColor + '25', color: design.accentColor }}>
                  Exclusive
                </span>
                <h2 className={`text-base sm:text-lg font-extrabold tracking-tight truncate ${getFontFamily()}`} style={{ color: design.primaryColor }}>
                  {page.title}
                </h2>
              </div>
              {page.subtitle && <p className="text-[11px] mt-0.5 truncate" style={{ color: design.secondaryTextColor }}>{page.subtitle}</p>}
            </div>
            <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: design.secondaryTextColor }}>
              {pageNumberDisplay || page.pageNumber}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 pb-2">
          {/* Featured hero item */}
          {featuredItem && (
            <div
              onClick={() => !featuredItem.isSoldOut && onSelectItem?.(featuredItem)}
              className={`relative rounded-2xl overflow-hidden shadow-sm transition-all border ${
                featuredItem.isSoldOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md active:scale-[0.99]'
              }`}
              style={{ borderColor: design.borderColor }}
            >
              {featuredItem.imageUrl ? (
                <div className="w-full h-36 xs:h-44 relative bg-neutral-900">
                  <img src={featuredItem.imageUrl} alt={featuredItem.name} referrerPolicy="no-referrer" className={`w-full h-full object-cover ${featuredItem.isSoldOut ? 'grayscale' : ''}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  {featuredItem.isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">Sold Out</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        {featuredItem.badge && !featuredItem.isSoldOut && (
                          <span className="inline-block mb-1 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: design.accentColor, color: '#000' }}>
                            ⭐ {featuredItem.badge}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-extrabold text-white drop-shadow truncate">{featuredItem.name}</h3>
                        <p className="text-[10px] sm:text-[11px] text-white/80 line-clamp-1 mt-0.5">{featuredItem.description}</p>
                      </div>
                      <span className="font-mono font-bold text-sm sm:text-base shrink-0" style={{ color: design.accentColor }}>
                        {design.currencySymbol}{featuredItem.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl" style={{ backgroundColor: design.primaryColor + '12' }}>
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-extrabold text-sm" style={{ color: design.primaryColor }}>{featuredItem.name}</h3>
                    <span className="font-mono font-bold text-sm" style={{ color: design.accentColor }}>
                      {design.currencySymbol}{featuredItem.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2" style={{ color: design.secondaryTextColor }}>{featuredItem.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Other specials list / grid */}
          {otherItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherItems.map(item => (
                <FoodItemRow key={item.id} item={item} design={design} isDark={isDarkTheme} onSelect={() => onSelectItem?.(item)} />
              ))}
            </div>
          )}
        </div>

        {design.showPageNumbers && (
          <div className="pt-2 shrink-0 flex items-center justify-between text-[10px]" style={{ borderTop: `1px solid ${design.borderColor}60`, color: design.secondaryTextColor }}>
            <span className="truncate">{restaurantName}</span>
            <span className="font-mono">P.{pageNumberDisplay || page.pageNumber}</span>
          </div>
        )}
      </div>
    );
  }

  // STANDARD CONTENT PAGES
  return (
    <div
      className={`w-full h-full p-4 sm:p-6 flex flex-col justify-between border relative overflow-hidden select-none ${getTextureStyle()}`}
      style={{ boxShadow: 'inset 0 0 25px rgba(0,0,0,0.03)' }}
    >
      {/* Page Header */}
      <div className="mb-3 shrink-0">
        <div className="flex items-baseline justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${design.borderColor}60` }}>
          <div className="min-w-0">
            <h2
              className={`text-base sm:text-xl font-extrabold tracking-tight truncate ${getFontFamily()}`}
              style={{ color: design.primaryColor }}
            >
              {page.title}
            </h2>
            {page.subtitle && (
              <p className="text-[11px] mt-0.5 truncate" style={{ color: design.secondaryTextColor }}>{page.subtitle}</p>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: design.secondaryTextColor }}>
            {pageNumberDisplay || page.pageNumber}
          </span>
        </div>
      </div>

      {/* Header image if present */}
      {page.headerImage && page.layout !== 'editorial_list' && page.layout !== 'drinks_beverage' && (
        <div className="w-full h-24 xs:h-28 rounded-xl overflow-hidden shadow-sm mb-3 shrink-0">
          <img src={page.headerImage} alt={page.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pr-0.5 pb-2">
        {/* Layout: hero_three_items */}
        {page.layout === 'hero_three_items' && (
          <div className="space-y-2.5">
            {page.items.map((item) => (
              <FoodItemRow key={item.id} item={item} design={design} isDark={isDarkTheme} onSelect={() => onSelectItem?.(item)} />
            ))}
          </div>
        )}

        {/* Layout: two_column_grid */}
        {page.layout === 'two_column_grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {page.items.map((item) => (
              <FoodItemRow key={item.id} item={item} design={design} isDark={isDarkTheme} onSelect={() => onSelectItem?.(item)} />
            ))}
          </div>
        )}

        {/* Layout: editorial_list */}
        {page.layout === 'editorial_list' && (
          <div style={{ borderTop: `1px solid ${design.borderColor}40` }}>
            {page.items.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isSoldOut && onSelectItem?.(item)}
                className={`py-2.5 px-1.5 rounded-lg transition-colors flex items-center justify-between gap-3 ${
                  item.isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:bg-black/[0.04]'
                }`}
                style={{ borderBottom: `1px solid ${design.borderColor}40` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-xs sm:text-sm font-bold truncate" style={{ color: isDarkTheme ? '#f5f5f5' : design.textColor }}>
                      {item.name}
                    </h4>
                    {item.isSoldOut ? (
                      <span className="text-[9px] text-red-500 font-semibold shrink-0">· Sold Out</span>
                    ) : item.badge ? (
                      <span className="text-[9px] font-semibold shrink-0" style={{ color: design.accentColor }}>· {item.badge}</span>
                    ) : null}
                  </div>
                  <p className="text-[11px] mt-0.5 line-clamp-1 leading-relaxed" style={{ color: design.secondaryTextColor }}>
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-xs sm:text-sm" style={{ color: item.isSoldOut ? design.secondaryTextColor : design.accentColor }}>
                    {item.isSoldOut ? <span className="line-through">{design.currencySymbol}{item.price.toLocaleString()}</span> : `${design.currencySymbol}${item.price.toLocaleString()}`}
                  </span>
                  {!item.isSoldOut && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectItem?.(item); }}
                      className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center font-bold transition-colors"
                      style={{ backgroundColor: design.accentColor + '18', color: design.primaryColor }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Layout: drinks_beverage */}
        {page.layout === 'drinks_beverage' && (
          <div className="space-y-2">
            {page.items.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isSoldOut && onSelectItem?.(item)}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-between ${
                  item.isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
                }`}
                style={{
                  border: `1px solid ${design.borderColor}80`,
                  backgroundColor: isDarkTheme ? '#1f1f1f' : 'rgba(255,255,255,0.7)'
                }}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate" style={{ color: isDarkTheme ? '#f5f5f5' : design.textColor }}>{item.name}</span>
                    {item.isSoldOut
                      ? <span className="text-[9px] text-red-500 font-semibold shrink-0">(Sold Out)</span>
                      : item.badge ? <span className="text-[9px] font-semibold shrink-0" style={{ color: design.accentColor }}>({item.badge})</span>
                      : null
                    }
                  </div>
                  <div className="text-[10px] line-clamp-1 mt-0.5" style={{ color: design.secondaryTextColor }}>{item.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold" style={{ color: item.isSoldOut ? design.secondaryTextColor : design.accentColor }}>
                    {design.currencySymbol}{item.price.toLocaleString()}
                  </span>
                  {!item.isSoldOut && (
                    <button
                      className="min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center transition-colors"
                      style={{ backgroundColor: design.accentColor + '18', color: design.primaryColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Page Footer */}
      {design.showPageNumbers && (
        <div
          className="pt-2 flex items-center justify-between text-[10px] shrink-0"
          style={{ borderTop: `1px solid ${design.borderColor}40`, color: design.secondaryTextColor }}
        >
          <span className="truncate">{restaurantName}</span>
          <span className="font-mono">P.{pageNumberDisplay || page.pageNumber}</span>
        </div>
      )}
    </div>
  );
};

// Reusable food item row with sold-out & allergen indicators
const FoodItemRow: React.FC<{
  item: FoodItem;
  design: MenuBookDesign;
  isDark?: boolean;
  onSelect: () => void;
}> = ({ item, design, isDark, onSelect }) => {
  return (
    <div
      onClick={() => !item.isSoldOut && onSelect()}
      className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 group relative ${
        item.isSoldOut
          ? 'opacity-55 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-sm active:bg-black/[0.04]'
      }`}
      style={{
        borderColor: design.borderColor,
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.015)'
      }}
    >
      {item.isSoldOut && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">Sold Out</span>
        </div>
      )}

      {item.imageUrl && (
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !item.isSoldOut ? 'group-hover:scale-105' : 'grayscale'
            }`}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1.5">
          <h4
            className={`text-xs sm:text-sm font-bold truncate transition-colors ${
              !item.isSoldOut ? 'group-hover:text-amber-800' : ''
            }`}
            style={{ color: isDark ? '#f5f5f5' : design.textColor }}
          >
            {item.name}
          </h4>
          <span
            className="font-mono text-xs sm:text-sm font-bold whitespace-nowrap"
            style={{ color: item.isSoldOut ? design.secondaryTextColor : design.accentColor }}
          >
            {item.isSoldOut
              ? <span className="line-through">{design.currencySymbol}{item.price.toLocaleString()}</span>
              : `${design.currencySymbol}${item.price.toLocaleString()}`
            }
          </span>
        </div>
        <p className="text-[11px] line-clamp-1 mt-0.5 leading-relaxed" style={{ color: design.secondaryTextColor }}>
          {item.description}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: design.secondaryTextColor }}>
          {item.badge && !item.isSoldOut && (
            <span className="font-semibold" style={{ color: design.accentColor }}>{item.badge}</span>
          )}
          {item.prepTime && !item.isSoldOut && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {item.prepTime}
            </span>
          )}
          {item.allergens && item.allergens.length > 0 && (
            <span className="flex items-center gap-0.5 text-amber-700">
              <AlertCircle className="w-2.5 h-2.5" /> {item.allergens.join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {!item.isSoldOut ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: design.accentColor + '18', color: design.primaryColor }}
            title="Add to order"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            <AlertCircle className="w-4 h-4" style={{ color: design.secondaryTextColor }} />
          </div>
        )}
      </div>
    </div>
  );
};
