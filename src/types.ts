export type MenuTemplateId = 
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

export type PaperTexture = 'parchment' | 'dark_slate' | 'clean_cardstock' | 'warm_kraft' | 'classic_linen';

export type FontStyle = 'serif_luxury' | 'modern_sans' | 'bold_punchy' | 'retro_bistro';

export interface MenuBookDesign {
  templateId: MenuTemplateId;
  paperTexture: PaperTexture;
  fontStyle: FontStyle;
  primaryColor: string;
  accentColor: string;
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
  plan: 'Starter Digital' | 'Growth QR+Menu' | 'Pro NFC Suite';
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
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  source: 'nfc' | 'qr' | 'web';
}

export interface WaiterCall {
  id: string;
  restaurantId: string;
  tableNumber: string;
  reason: 'Request Bill' | 'Need Waiter' | 'Water Refill' | 'General';
  timestamp: string;
  status: 'active' | 'resolved';
}
