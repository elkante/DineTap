import { RestaurantTenant, MenuBookDesign, MenuTemplateId } from '../types';

export const TEMPLATE_PRESETS: Record<MenuTemplateId, { name: string; description: string; previewColor: string; accentColor: string; design: MenuBookDesign }> = {
  emerald_gold: {
    name: 'The Corner Table Emerald & Gold',
    description: 'Deep British racing green leather binder, debossed gold perimeter stitching, and rich metallic gold typography.',
    previewColor: '#0c2e22',
    accentColor: '#d4af37',
    design: {
      templateId: 'emerald_gold',
      paperTexture: 'emerald_leather',
      fontStyle: 'serif_luxury',
      primaryColor: '#0c2e22',
      accentColor: '#d4af37',
      coverColor: '#0c2e22',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  burgundy_gold: {
    name: 'Burgundy Velvet & Gold',
    description: 'Deep royal wine leather casing with embossed gold foil details and warm parchment pages.',
    previewColor: '#4a0e17',
    accentColor: '#d4af37',
    design: {
      templateId: 'burgundy_gold',
      paperTexture: 'leather_burgundy',
      fontStyle: 'serif_luxury',
      primaryColor: '#4a0e17',
      accentColor: '#d4af37',
      coverColor: '#4a0e17',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  navy_gold: {
    name: 'Midnight Navy & Gold',
    description: 'Sophisticated deep sapphire leather with gold foil stamping for upscale cocktail lounges and bistros.',
    previewColor: '#0f172a',
    accentColor: '#eab308',
    design: {
      templateId: 'navy_gold',
      paperTexture: 'leather_navy',
      fontStyle: 'serif_luxury',
      primaryColor: '#0f172a',
      accentColor: '#eab308',
      coverColor: '#0f172a',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  espresso_amber: {
    name: 'Espresso Leather & Amber',
    description: 'Rich dark roast leather with burnished amber brass accents and cream linen paper.',
    previewColor: '#2b1810',
    accentColor: '#f59e0b',
    design: {
      templateId: 'espresso_amber',
      paperTexture: 'leather_espresso',
      fontStyle: 'serif_luxury',
      primaryColor: '#2b1810',
      accentColor: '#f59e0b',
      coverColor: '#2b1810',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  charcoal_brass: {
    name: 'Charcoal Slate & Brass',
    description: 'Refined modern dark graphite with metallic brass highlights and sharp typography.',
    previewColor: '#1f2421',
    accentColor: '#d97706',
    design: {
      templateId: 'charcoal_brass',
      paperTexture: 'leather_charcoal',
      fontStyle: 'serif_luxury',
      primaryColor: '#1f2421',
      accentColor: '#d97706',
      coverColor: '#1f2421',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  warm_terracotta: {
    name: 'Warm Terracotta & Sand',
    description: 'Earthy Mediterranean terracotta tones with warm golden ochre accents and parchment texture.',
    previewColor: '#7c2d12',
    accentColor: '#f59e0b',
    design: {
      templateId: 'warm_terracotta',
      paperTexture: 'parchment',
      fontStyle: 'retro_bistro',
      primaryColor: '#7c2d12',
      accentColor: '#f59e0b',
      coverColor: '#7c2d12',
      textColor: '#292524',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  nigerian: {
    name: 'Warm Bistro & Eatery',
    description: 'Warm terracotta & golden amber tones spotlighting authentic culinary traditions.',
    previewColor: '#c25e2e',
    accentColor: '#d97706',
    design: {
      templateId: 'nigerian',
      paperTexture: 'parchment',
      fontStyle: 'retro_bistro',
      primaryColor: '#7c2d12',
      accentColor: '#d97706',
      coverColor: '#7c2d12',
      textColor: '#292524',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  luxury: {
    name: 'Luxury Dining & Lounge',
    description: 'Deep obsidian matte backdrops, gold foil accents, and high-end editorial serif typography for fine dining.',
    previewColor: '#d4af37',
    accentColor: '#d4af37',
    design: {
      templateId: 'luxury',
      paperTexture: 'dark_slate',
      fontStyle: 'serif_luxury',
      primaryColor: '#0c2e22',
      accentColor: '#d4af37',
      coverColor: '#0c2e22',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  fast_food: {
    name: 'Fast Casual & Burgers',
    description: 'High energy, bold headers, and high-contrast cards designed for quick service.',
    previewColor: '#dc2626',
    accentColor: '#eab308',
    design: {
      templateId: 'fast_food',
      paperTexture: 'clean_cardstock',
      fontStyle: 'bold_punchy',
      primaryColor: '#dc2626',
      accentColor: '#eab308',
      coverColor: '#1c1917',
      textColor: '#18181b',
      secondaryTextColor: '#71717a',
      borderColor: '#e4e4e7',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  cafe: {
    name: 'Artisan Café & Bakery',
    description: 'Warm oat parchment, sage green accents, and airy minimalism for coffees, pastries, and brunch.',
    previewColor: '#059669',
    accentColor: '#10b981',
    design: {
      templateId: 'cafe',
      paperTexture: 'warm_kraft',
      fontStyle: 'modern_sans',
      primaryColor: '#065f46',
      accentColor: '#10b981',
      coverColor: '#065f46',
      textColor: '#1c1917',
      secondaryTextColor: '#78716c',
      borderColor: '#e7e5e4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  grill_bbq: {
    name: 'Smokehouse & BBQ',
    description: 'Charcoal textures, flame orange highlights, and rugged typography built for barbecue.',
    previewColor: '#ea580c',
    accentColor: '#f97316',
    design: {
      templateId: 'grill_bbq',
      paperTexture: 'dark_slate',
      fontStyle: 'bold_punchy',
      primaryColor: '#ea580c',
      accentColor: '#f97316',
      coverColor: '#1c1917',
      textColor: '#fafaf9',
      secondaryTextColor: '#a8a29e',
      borderColor: '#44403c',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  modern_minimal: {
    name: 'Modern Minimalist',
    description: 'Clean monochrome lines, whitespace-forward layout, and refined typography.',
    previewColor: '#18181b',
    accentColor: '#71717a',
    design: {
      templateId: 'modern_minimal',
      paperTexture: 'clean_cardstock',
      fontStyle: 'modern_sans',
      primaryColor: '#18181b',
      accentColor: '#d4af37',
      coverColor: '#18181b',
      textColor: '#18181b',
      secondaryTextColor: '#71717a',
      borderColor: '#e4e4e7',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  }
};

/**
 * ABSOLUTELY ZERO MOCK RESTAURANTS.
 * Restaurants are created organically by owners or loaded from Supabase.
 */
export const INITIAL_RESTAURANTS: RestaurantTenant[] = [];

/**
 * Creates a brand new empty restaurant tenant structure
 */
export function createDefaultRestaurantTenant(
  name: string,
  slug: string,
  options?: {
    templateId?: MenuTemplateId;
    coverColor?: string;
    currency?: string;
    tagline?: string;
    logo?: string;
  }
): RestaurantTenant {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const templateId = options?.templateId || 'emerald_gold';
  const preset = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS.emerald_gold;
  const currency = options?.currency || '₦';
  const customCoverColor = options?.coverColor || preset.design.coverColor || '#0c2e22';

  const newId = `rest-${Date.now()}`;

  // Default initial 5 tables for QR / NFC
  const tables = [1, 2, 3, 4, 5].map(num => ({
    id: `tbl-${newId}-${num}`,
    tableNumber: `Table ${num}`,
    label: `Table ${num}`,
    section: 'Dining Room',
    ntagSerial: `04:FA:${num.toString().padStart(2, '0')}:88:22:90:${num.toString().padStart(2, '0')}`,
    nfcStatus: 'active' as const,
    totalTaps: 0,
    totalScans: 0,
    urlPayload: `${origin}/?r=${slug}&table=Table+${num}`
  }));

  // Initial menu pages: Cover + 1 starter category ready for adding dishes
  const pages = [
    {
      id: `p-${newId}-cover`,
      pageNumber: 1,
      title: name,
      subtitle: options?.tagline || 'Kitchen & Bar',
      layout: 'cover' as const,
      items: []
    },
    {
      id: `p-${newId}-mains`,
      pageNumber: 2,
      title: 'Menu',
      subtitle: 'Prepared fresh to order',
      layout: 'chef_specials' as const,
      items: []
    }
  ];

  return {
    id: newId,
    slug,
    name,
    tagline: options?.tagline || 'Kitchen & Bar',
    logo: options?.logo || '🛡️',
    coverImage: '',
    address: '',
    phone: '',
    openingHours: 'Open Daily: 11:00 AM - 11:00 PM',
    plan: 'Growth QR+Menu',
    status: 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      ...preset.design,
      coverColor: customCoverColor,
      currencySymbol: currency,
    },
    tables,
    pages
  };
}
