import { RestaurantTenant, MenuBookDesign, MenuTemplateId } from '../types';

export const TEMPLATE_PRESETS: Record<MenuTemplateId, { name: string; description: string; previewColor: string; design: MenuBookDesign }> = {
  nigerian: {
    name: 'Nigerian Bistro & Eatery',
    description: 'Warm terracotta & golden amber tones, spotlighting authentic culinary traditions and rich food photography.',
    previewColor: '#C25E2E',
    design: {
      templateId: 'nigerian',
      paperTexture: 'parchment',
      fontStyle: 'retro_bistro',
      primaryColor: '#7C2D12',
      accentColor: '#D97706',
      textColor: '#292524',
      secondaryTextColor: '#78716C',
      borderColor: '#E7E5E4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  luxury: {
    name: 'Luxury Dining & Lounge',
    description: 'Deep obsidian matte backdrops, gold foil accents, and high-end editorial serif typography for fine dining.',
    previewColor: '#D4AF37',
    design: {
      templateId: 'luxury',
      paperTexture: 'dark_slate',
      fontStyle: 'serif_luxury',
      primaryColor: '#F59E0B',
      accentColor: '#D4AF37',
      textColor: '#F8FAFC',
      secondaryTextColor: '#94A3B8',
      borderColor: '#334155',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  grill_bbq: {
    name: 'Grill & Suya Smokehouse',
    description: 'Charcoal textures, flame orange highlights, and rugged typography built for barbecue, skewers, and grills.',
    previewColor: '#EA580C',
    design: {
      templateId: 'grill_bbq',
      paperTexture: 'dark_slate',
      fontStyle: 'bold_punchy',
      primaryColor: '#EA580C',
      accentColor: '#F97316',
      textColor: '#FAFAF9',
      secondaryTextColor: '#A8A29E',
      borderColor: '#44403C',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  fast_food: {
    name: 'Fast Casual & Burgers',
    description: 'High energy, bold headers, and high-contrast cards designed for quick service and gourmet burgers.',
    previewColor: '#DC2626',
    design: {
      templateId: 'fast_food',
      paperTexture: 'clean_cardstock',
      fontStyle: 'bold_punchy',
      primaryColor: '#DC2626',
      accentColor: '#EAB308',
      textColor: '#18181B',
      secondaryTextColor: '#71717A',
      borderColor: '#E4E4E7',
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
    design: {
      templateId: 'cafe',
      paperTexture: 'warm_kraft',
      fontStyle: 'modern_sans',
      primaryColor: '#065F46',
      accentColor: '#10B981',
      textColor: '#1C1917',
      secondaryTextColor: '#78716C',
      borderColor: '#E7E5E4',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  },
  modern_minimal: {
    name: 'Modern Minimalist',
    description: 'Architectural whitespace, razor-thin hairlines, and contemporary sans for modern gastropubs.',
    previewColor: '#2563EB',
    design: {
      templateId: 'modern_minimal',
      paperTexture: 'clean_cardstock',
      fontStyle: 'modern_sans',
      primaryColor: '#0F172A',
      accentColor: '#2563EB',
      textColor: '#0F172A',
      secondaryTextColor: '#64748B',
      borderColor: '#E2E8F0',
      showPageNumbers: true,
      enableAudioEffect: true,
      showPriceSymbols: true,
      currencySymbol: '₦',
    }
  }
};

export const INITIAL_RESTAURANTS: RestaurantTenant[] = [
  {
    id: 'rest-lagos-bites',
    slug: 'lagos-bites',
    name: 'Lagos Bites & Grill',
    tagline: 'Afro-Fusion, Charcoal Suya & Vibrant Flavours',
    logo: '🔥',
    coverImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
    address: '14 Adeola Odeku St, Victoria Island, Lagos',
    phone: '+234 803 555 0192',
    openingHours: 'Mon - Sun: 11:30 AM - 11:00 PM',
    plan: 'Pro NFC Suite',
    status: 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      ...TEMPLATE_PRESETS.nigerian.design,
    },
    tables: [
      {
        id: 'tbl-1',
        tableNumber: 'Table 01',
        label: 'Front Patio 01',
        section: 'Outdoor Patio',
        ntagSerial: '04:8A:2F:9C:3E:11:80',
        nfcStatus: 'active',
        totalTaps: 142,
        totalScans: 89,
        lastTappedAt: '12 mins ago',
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=lagos-bites&table=Table+01&src=nfc`
      },
      {
        id: 'tbl-2',
        tableNumber: 'Table 02',
        label: 'Indoor Dining 02',
        section: 'Main Hall',
        ntagSerial: '04:7B:A2:1F:5C:80:91',
        nfcStatus: 'active',
        totalTaps: 230,
        totalScans: 112,
        lastTappedAt: '4 mins ago',
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=lagos-bites&table=Table+02&src=nfc`
      },
      {
        id: 'tbl-3',
        tableNumber: 'Table 03',
        label: 'VIP Booth 03',
        section: 'VIP Lounge',
        ntagSerial: '04:6C:D3:4E:2A:77:15',
        nfcStatus: 'active',
        totalTaps: 98,
        totalScans: 45,
        lastTappedAt: '35 mins ago',
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=lagos-bites&table=Table+03&src=nfc`
      },
      {
        id: 'tbl-4',
        tableNumber: 'Table 04',
        label: 'Terrace Window 04',
        section: 'Rooftop Terrace',
        ntagSerial: '04:9E:11:88:FF:43:02',
        nfcStatus: 'active',
        totalTaps: 310,
        totalScans: 174,
        lastTappedAt: 'Just now',
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=lagos-bites&table=Table+04&src=nfc`
      },
      {
        id: 'tbl-5',
        tableNumber: 'Table 05',
        label: 'Bar Counter 05',
        section: 'Cocktail Bar',
        ntagSerial: '04:1A:33:77:BC:90:54',
        nfcStatus: 'damaged',
        totalTaps: 41,
        totalScans: 85,
        lastTappedAt: '2 days ago',
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=lagos-bites&table=Table+05&src=nfc`
      }
    ],
    pages: [
      {
        id: 'p-cover',
        pageNumber: 1,
        title: 'Cover Page',
        subtitle: 'Welcome to Lagos Bites & Grill',
        layout: 'cover',
        customNote: 'Scan QR code or Tap NFC tag on table to view specials and call waitstaff.',
        backgroundImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
        items: []
      },
      {
        id: 'p-starters',
        pageNumber: 2,
        title: 'Starters & Small Chops',
        subtitle: 'Kick off your meal with bold Nigerian street flavours',
        layout: 'hero_three_items',
        headerImage: '/src/assets/images/dish_suya_platter_1792837967531.jpg',
        customNote: 'All small chops are fried fresh to order with house dipping sauce.',
        items: [
          {
            id: 'it-1',
            name: 'Artisan Beef Suya Skewers',
            description: 'Thinly sliced tender beef skewered and charred over open coals, coated in authentic spicy yaji peanut spice blend, sliced red onions and lime wedges.',
            price: 4500,
            imageUrl: '/src/assets/images/dish_suya_platter_1792837967531.jpg',
            badge: 'Chef Special',
            prepTime: '12 min',
            allergens: ['Peanuts']
          },
          {
            id: 'it-2',
            name: 'Catfish Pepper Soup',
            description: 'Traditional slow-simmered herbal broth with fresh catfish, aromatic scent leaves, alligator pepper, and uziza.',
            price: 5200,
            badge: 'Spicy',
            prepTime: '15 min'
          },
          {
            id: 'it-3',
            name: 'Gourmet Small Chops Platter',
            description: 'Golden puff puff, beef samosas, crispy spring rolls, and peppered chicken bites served with hot chili dip.',
            price: 6000,
            badge: 'Popular',
            prepTime: '10 min'
          }
        ]
      },
      {
        id: 'p-mains',
        pageNumber: 3,
        title: 'Signature Rice & Bowls',
        subtitle: 'Our celebrated firewood pot rice specialities',
        layout: 'two_column_grid',
        headerImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
        items: [
          {
            id: 'it-4',
            name: 'Smoky Firewood Jollof Platter',
            description: 'Authentic party-style jollof cooked with rich tomato-pepper reduction, served with charred quarter chicken, golden dodo (fried plantains), and fresh salad.',
            price: 6500,
            imageUrl: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
            badge: 'Bestseller',
            prepTime: '15 min'
          },
          {
            id: 'it-5',
            name: 'Chef Seafood Fried Rice',
            description: 'Wok-tossed basmati rice with tiger prawns, calamari rings, sweet corn, spring onions, and oriental spices.',
            price: 7800,
            badge: 'Chef Special',
            prepTime: '18 min'
          },
          {
            id: 'it-6',
            name: 'Ofada Royal Bowl',
            description: 'Traditional unpolished indigenous rice served in banana leaves with rich green pepper Ayamase sauce, boiled egg, assorted meat cuts, and fried plantain.',
            price: 7200,
            badge: 'Spicy',
            prepTime: '20 min'
          },
          {
            id: 'it-7',
            name: 'Spicy Asun Fried Rice',
            description: 'Smoky stir-fried rice infused with chopped peppered goat meat, habanero chunks, and fresh herbs.',
            price: 6800,
            prepTime: '15 min'
          }
        ]
      },
      {
        id: 'p-grills',
        pageNumber: 4,
        title: 'From The Charcoal Grill',
        subtitle: 'Marinated in signature rubs and flame-roasted to perfection',
        layout: 'chef_specials',
        headerImage: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
        items: [
          {
            id: 'it-8',
            name: 'Whole Grilled Tilapia Feast',
            description: 'Fresh whole fish marinated in Scotch bonnet paste, roasted over charcoal, served with pepper sauce, lime wedges, and crisp yam fries.',
            price: 9500,
            imageUrl: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
            badge: 'Bestseller',
            prepTime: '25 min'
          },
          {
            id: 'it-9',
            name: 'Lagos Gourmet Brioche Burger',
            description: 'Flame-grilled prime wagyu patty, melted smoked cheddar, spicy caramelized onion jam, and garlic aioli in a buttered brioche bun with truffle fries.',
            price: 7000,
            imageUrl: '/src/assets/images/dish_gourmet_burger_1792837968226.jpg',
            badge: 'Popular',
            prepTime: '15 min'
          },
          {
            id: 'it-10',
            name: 'Peppered Goat Meat (Asun)',
            description: 'Charcoal-smoked diced goat meat sautéed with fiery habanero peppers and sliced red onions.',
            price: 5500,
            badge: 'Spicy',
            prepTime: '15 min',
            isSoldOut: true
          }
        ]
      },
      {
        id: 'p-sides',
        pageNumber: 5,
        title: 'Sides & Local Complements',
        subtitle: 'Authentic sides to accompany your feast',
        layout: 'editorial_list',
        items: [
          {
            id: 'it-11',
            name: 'Caramelized Sweet Dodo (Plantain)',
            description: 'Ripe plantains sliced thick and fried until golden mahogany with sweet caramelized edges.',
            price: 1800,
            badge: 'Popular'
          },
          {
            id: 'it-12',
            name: 'Crisp Fried Yam Batons',
            description: 'Tender on the inside, golden crisp outside, seasoned with sea salt and served with pepper dip.',
            price: 2200
          },
          {
            id: 'it-13',
            name: 'Steamed Leaf Moin Moin',
            description: 'Silky bean pudding seasoned with crayfish, flaked mackerel fish, and red bell peppers, wrapped in traditional leaves.',
            price: 2500,
            badge: 'Chef Special'
          },
          {
            id: 'it-14',
            name: 'Extra Charcoal Chicken Quarter',
            description: 'Juicy chicken leg and thigh slow-roasted with thyme and paprika.',
            price: 3200
          }
        ]
      },
      {
        id: 'p-drinks',
        pageNumber: 6,
        title: 'Signature Drinks & Mocktails',
        subtitle: 'Refreshing beverages crafted for tropical evenings',
        layout: 'drinks_beverage',
        items: [
          {
            id: 'it-15',
            name: 'The Legendary Lagos Chapman',
            description: 'Iconic Nigerian cooler blended with Angostura bitters, Fanta, Sprite, cucumber slices, fresh mint, and cocktail cherries.',
            price: 3000,
            badge: 'Bestseller'
          },
          {
            id: 'it-16',
            name: 'Zobo Spiced Hibiscus Spritz',
            description: 'Chilled brewed organic roselle petals infused with cloves, dried ginger, fresh pineapple juice, and sparkling soda.',
            price: 2800,
            badge: 'Popular'
          },
          {
            id: 'it-17',
            name: 'Fresh Palm Wine Cooler',
            description: 'Sweet naturally fermented tapping blended with passionfruit puree and crushed ice.',
            price: 3500,
            badge: 'Chef Special'
          },
          {
            id: 'it-18',
            name: 'Cold Pressed Tropical Citrus',
            description: 'Pure orange, sweet pineapple, ginger, and lime over ice.',
            price: 2500
          }
        ]
      }
    ]
  },
  {
    id: 'rest-ocean-grill',
    slug: 'ocean-grill',
    name: 'Ocean Grill & Rooftop',
    tagline: 'Seaside Dining, Cocktails & Prime Cuts',
    logo: '🌊',
    coverImage: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
    address: 'Plot 3 Admiralty Way, Lekki Phase 1, Lagos',
    phone: '+234 812 400 9988',
    openingHours: 'Tue - Sun: 1:00 PM - 12:00 AM',
    plan: 'Pro NFC Suite',
    status: 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      ...TEMPLATE_PRESETS.luxury.design,
    },
    tables: [
      {
        id: 'og-1',
        tableNumber: 'Table 10',
        label: 'Rooftop Sea View',
        section: 'Rooftop',
        ntagSerial: '04:B1:88:55:77:22:11',
        nfcStatus: 'active',
        totalTaps: 412,
        totalScans: 280,
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=ocean-grill&table=Table+10&src=nfc`
      }
    ],
    pages: [
      {
        id: 'og-p1',
        pageNumber: 1,
        title: 'Cover Page',
        subtitle: 'Ocean Grill & Lounge',
        layout: 'cover',
        backgroundImage: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
        items: []
      },
      {
        id: 'og-p2',
        pageNumber: 2,
        title: 'Catch of the Day',
        subtitle: 'Fresh Atlantic seafood flame-grilled to order',
        layout: 'hero_three_items',
        headerImage: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
        items: [
          {
            id: 'og-it-1',
            name: 'Grilled Atlantic Red Snapper',
            description: 'Garlic butter herb crust, charred lemon, served with rosemary baby potatoes.',
            price: 14500,
            imageUrl: '/src/assets/images/dish_grilled_fish_1792837967875.jpg',
            badge: 'Chef Special'
          },
          {
            id: 'og-it-2',
            name: 'Jumbo Tiger Prawn Skewers',
            description: 'Charcoal-grilled king prawns brushed with chili lime butter.',
            price: 16000,
            badge: 'Bestseller'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-mamas-kitchen',
    slug: 'mamas-kitchen',
    name: "Mama's Kitchen",
    tagline: 'Authentic Traditional Nigerian Comfort Food',
    logo: '🍲',
    coverImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
    address: '8 Isaac John Street, Ikeja GRA, Lagos',
    phone: '+234 802 333 4455',
    openingHours: 'Mon - Sat: 9:00 AM - 9:00 PM',
    plan: 'Growth QR+Menu',
    status: 'active',
    quickMenuEnabled: true,
    allowOrdering: true,
    tableOrderingEnabled: true,
    design: {
      ...TEMPLATE_PRESETS.nigerian.design,
    },
    tables: [
      {
        id: 'mk-1',
        tableNumber: 'Table 01',
        label: 'Main Hall',
        section: 'Ground Floor',
        ntagSerial: '04:99:AA:BB:CC:DD:EE',
        nfcStatus: 'active',
        totalTaps: 85,
        totalScans: 60,
        urlPayload: `${typeof window !== 'undefined' ? window.location.origin : ''}/?tenant=mamas-kitchen&table=Table+01&src=nfc`
      }
    ],
    pages: [
      {
        id: 'mk-p1',
        pageNumber: 1,
        title: 'Cover Page',
        subtitle: "Welcome to Mama's Kitchen",
        layout: 'cover',
        backgroundImage: '/src/assets/images/dish_jollof_chicken_1792837966503.jpg',
        items: []
      },
      {
        id: 'mk-p2',
        pageNumber: 2,
        title: 'Traditional Soups & Swallows',
        subtitle: 'Pounded Yam, Eba, Amala served with authentic homemade soups',
        layout: 'editorial_list',
        items: [
          {
            id: 'mk-it-1',
            name: 'Egusi Soup with Assorted Meat & Pounded Yam',
            description: 'Melon seed soup rich in spinach, smoked fish, stockfish, and shaki.',
            price: 4800,
            badge: 'Bestseller'
          },
          {
            id: 'mk-it-2',
            name: 'Banga Soup with Starch',
            description: 'Delta-style palm nut soup with fresh catfish and dried herbs.',
            price: 5500,
            badge: 'Chef Special'
          }
        ]
      }
    ]
  }
];
