export type MenuTemplateId = 
  | 'emerald_gold'
  | 'burgundy_gold'
  | 'navy_gold'
  | 'espresso_amber'
  | 'charcoal_brass'
  | 'warm_terracotta'
  | 'nigerian'
  | 'luxury'
  | 'fast_food'
  | 'cafe'
  | 'grill_bbq'
  | 'modern_minimal';

export type PageLayoutType = 
  | 'cover'
  | 'hero_three_items'
  | 'two_column_grid'
  | 'editorial_list'
  | 'drinks_beverage'
  | 'chef_specials';

export type PaperTexture = 
  | 'emerald_leather'
  | 'leather_burgundy'
  | 'leather_navy'
  | 'leather_espresso'
  | 'leather_charcoal'
  | 'parchment' 
  | 'dark_slate' 
  | 'clean_cardstock' 
  | 'warm_kraft' 
  | 'classic_linen';

export type FontStyle = 'serif_luxury' | 'modern_sans' | 'bold_punchy' | 'retro_bistro';

export interface MenuBookDesign {
  templateId: MenuTemplateId;
  paperTexture: PaperTexture;
  fontStyle: FontStyle;
  primaryColor: string;
  accentColor: string;
  coverColor?: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  showPageNumbers: boolean;
  enableAudioEffect: boolean;
  showPriceSymbols: boolean;
  currencySymbol: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  badge?: 'Chef Special' | 'Spicy' | 'Bestseller' | 'Vegetarian' | 'Halal' | 'Popular' | '';
  isSoldOut?: boolean;
  prepTime?: string;
  calories?: string;
  allergens?: string[];
}

export interface MenuBookPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  layout: PageLayoutType;
  items: FoodItem[];
  customNote?: string;
  backgroundImage?: string;
  headerImage?: string;
}

export type NfcStatus = 'active' | 'unassigned' | 'damaged' | 'replaced';

export interface TableNfcTag {
  id: string;
  tableNumber: string;
  label: string;
  section: string;
  ntagSerial: string;
  nfcStatus: NfcStatus;
  totalTaps: number;
  totalScans: number;
  lastTappedAt?: string;
  urlPayload: string;
}

export interface RestaurantTenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  openingHours: string;
  design: MenuBookDesign;
  pages: MenuBookPage[];
  tables: TableNfcTag[];
  /** Plan ID: 'basic' | 'standard' | 'premium' | 'enterprise' (or legacy string) */
  plan: string;
  /** Optional per-restaurant table limit override set by super admin (overrides plan maxTables) */
  tableLimit?: number | null;
  status: 'active' | 'pending' | 'suspended';
  quickMenuEnabled: boolean;
  allowOrdering: boolean;
  tableOrderingEnabled: boolean;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  notes?: string;
  tableNumber?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal?: number;
  vat?: number;
  total: number;
  paymentMethod?: 'pos' | 'cash' | 'transfer';
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  createdAtTimestamp?: number;
  source: 'nfc' | 'qr' | 'web';
}

export interface DailyShift {
  id: string;
  restaurantId: string;
  startedAt: string;
  startedAtTimestamp: number;
  endedAt?: string;
  endedAtTimestamp?: number;
  isActive: boolean;
  totalOrders: number;
  totalRevenue: number;
  totalVat: number;
  totalCustomers: number;
  breakdown: {
    pos: number;
    cash: number;
    transfer: number;
  };
}

export interface WaiterCall {
  id: string;
  restaurantId: string;
  tableNumber: string;
  reason: 'Request Bill' | 'Need Waiter' | 'Water Refill' | 'General';
  timestamp: string;
  status: 'active' | 'resolved';
}
