export interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number; // in NGN
  annualPrice: number;  // in NGN
  maxTables: number | null; // null = unlimited
  tagline: string;
  features: string[];
  recommended?: boolean;
}

export const DEFAULT_PLANS: PlanTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 8000,
    annualPrice: 80000,
    maxTables: 10,
    tagline: 'Ideal for small cafes, juice bars & neighborhood bistros',
    features: [
      'Up to 10 Dining Tables',
      'Realistic 3D Flipbook Digital Menu',
      'Custom Restaurant URL Slug',
      'Table QR Stand Codes Generator',
      'Live Kitchen Order Tickets (KDS)',
      'Digital Table Assistance Buzzer',
      'Direct POS / Transfer / Cash Payments',
      'Standard Support'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: 'Popular',
    monthlyPrice: 19000,
    annualPrice: 190000,
    maxTables: 20,
    tagline: 'Perfect for fast-growing restaurants & casual dining',
    features: [
      'Up to 20 Dining Tables',
      'Everything in Basic',
      'Digital Card & NFC Encoding Ready',
      'Signature Leather & Foil Customization',
      'Dish Photo Uploads & Badges',
      'Instant Sold-Out Item Toggle',
      'Multi-Device Kitchen & Waiter Sync',
      'Priority Phone & Chat Support'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: 'High Volume',
    monthlyPrice: 30000,
    annualPrice: 300000,
    maxTables: 60,
    tagline: 'For busy lounges, clubs, rooftop bars & multi-floor dining',
    features: [
      'Up to 60 Dining Tables',
      'Everything in Standard',
      'VIP, Bar & Patio Custom Sections',
      'Instant Category & Page Outline',
      'Kitchen Order Prep Time Tracking',
      'Dedicated Onboarding Assistance',
      'Direct Account Manager (Lagos / Abuja)'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Unlimited',
    monthlyPrice: 70000,
    annualPrice: 700000,
    maxTables: null,
    tagline: 'For restaurant chains, hotel dining & large hospitality venues',
    features: [
      'Unlimited Dining Tables & Bars',
      'Everything in Premium',
      'Multi-Branch & Central Management',
      'Custom Domain Integration (e.g. menu.brand.com)',
      'Custom Printed Acrylic Table Stands Package',
      '99.9% High-Availability Uptime SLA',
      '24/7 VIP Concierge Support'
    ]
  }
];

const STORAGE_KEY_PLANS = 'dinetap_subscription_plans_v1';

export function getStoredPlans(): PlanTier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored plans', e);
  }
  return DEFAULT_PLANS;
}

export function saveStoredPlans(plans: PlanTier[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.warn('Failed to save plans', e);
  }
}

export function resetPlansToDefault(): PlanTier[] {
  saveStoredPlans(DEFAULT_PLANS);
  return DEFAULT_PLANS;
}
