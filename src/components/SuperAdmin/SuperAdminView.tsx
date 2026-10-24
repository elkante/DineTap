import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantTenant } from '../../types';
import { 
  fetchAllRestaurantsFromSupabase, 
  updateRestaurantStatusInSupabase, 
  deleteRestaurantFromSupabase,
  setActiveSession,
  registerRestaurant 
} from '../../utils/supabase';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Store, 
  CreditCard, 
  Package, 
  KeyRound, 
  Utensils, 
  PhoneCall, 
  Clock,
  Sparkles,
  Eye
} from 'lucide-react';

const ADMIN_MASTER_PIN = 'dinetap2026';
const PIN_SESSION_KEY = 'dinetap_admin_unlocked';

export const SuperAdminView: React.FC = () => {
  const { showNotification } = useApp();

  // Master PIN Gate
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Data
  const [tenants, setTenants] = useState<RestaurantTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'revenue' | 'hardware'>('restaurants');

  // Modal: Onboard new restaurant
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('pass1234');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Growth' | 'Enterprise'>('Growth');

  const loadAllTenants = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRestaurantsFromSupabase();
      setTenants(data);
    } catch (e) {
      console.warn('Failed to load tenants', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadAllTenants();
    }
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_MASTER_PIN) {
      setIsUnlocked(true);
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    const slugified = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setNewSlug(slugified);
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) return;

    const res = await registerRestaurant({
      name: newName.trim(),
      slug: newSlug.trim(),
      email: newEmail.trim() || `admin@${newSlug}.com`,
      password: newPassword,
    });

    if (res.success && res.restaurant) {
      showNotification(`🎉 Provisioned restaurant "${res.restaurant.name}"!`);
      setIsOnboardModalOpen(false);
      setNewName('');
      setNewSlug('');
      setNewEmail('');
      loadAllTenants();
    } else {
      showNotification(res.error || 'Failed to provision restaurant');
    }
  };

  const handleToggleStatus = async (restaurantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateRestaurantStatusInSupabase(restaurantId, nextStatus);
    setTenants(prev => prev.map(t => t.id === restaurantId ? { ...t, status: nextStatus } : t));
    showNotification(`Restaurant status updated to ${nextStatus}`);
  };

  const handleDeleteRestaurant = async (restaurantId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This removes all menu items and orders.`)) {
      return;
    }
    await deleteRestaurantFromSupabase(restaurantId);
    setTenants(prev => prev.filter(t => t.id !== restaurantId));
    showNotification(`Deleted "${name}"`);
  };

  const handleLoginAs = (tenant: RestaurantTenant) => {
    setActiveSession({
      userId: `admin-${tenant.id}`,
      email: `admin@${tenant.slug}.com`,
      restaurantId: tenant.id,
      restaurantSlug: tenant.slug
    });
    showNotification(`Switched into ${tenant.name} dashboard`);
    window.location.href = '/';
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Platform Metrics
  const totalRestaurants = tenants.length;
  const totalTables = tenants.reduce((acc, t) => acc + (t.tables?.length || 0), 0);
  const totalDishes = tenants.reduce((acc, t) => 
    acc + t.pages.reduce((pAcc, p) => pAcc + p.items.length, 0), 0
  );
  // Estimated MRR based on plans
  const estimatedMrr = tenants.reduce((acc, t) => {
    if (t.plan?.includes('Enterprise')) return acc + 90000;
    if (t.plan?.includes('Growth')) return acc + 50000;
    return acc + 25000; // Starter
  }, 0);

  // If locked, render Master PIN access screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-extrabold text-white">Platform Super Admin</h1>
          <p className="text-xs text-neutral-400 mt-1 mb-6">
            Enter your master passcode to manage all DineTap restaurants, subscriptions, and hardware.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Master PIN (dinetap2026)"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-center text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              {pinError && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">
                  Invalid passcode. Try "dinetap2026"
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              Unlock Admin Portal
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800">
            <a href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
              ← Return to DineTap
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Admin Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-serif font-black text-lg shadow-md">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">DineTap Super-Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Master Control
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 block -mt-0.5">
                Multi-Tenant PostgreSQL & Hardware Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              onClick={() => {
                sessionStorage.removeItem(PIN_SESSION_KEY);
                setIsUnlocked(false);
              }}
              className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              Lock
            </button>
            <a
              href="/"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors font-semibold"
            >
              Live Site
            </a>
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Restaurant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Restaurants
            </span>
            <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
              {totalRestaurants}
            </span>
            <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Real tenants in Supabase
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Table QR/NFCs
            </span>
            <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
              {totalTables}
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Active table points deployed
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Dishes Published
            </span>
            <span className="text-3xl font-extrabold font-mono text-amber-400 mt-1 block">
              {totalDishes}
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Live menu items in cloud
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Estimated Monthly MRR
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-1 block">
              ₦{estimatedMrr.toLocaleString()}
            </span>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              SaaS subscription pipeline
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'restaurants'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            All Registered Restaurants ({totalRestaurants})
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'hardware'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Table Cards & Stands Fulfillment
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'revenue'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Pricing & Subscriptions Architecture
          </button>
        </div>

        {/* TAB 1: ALL RESTAURANTS */}
        {activeTab === 'restaurants' && (
          <div className="space-y-4">
            {/* Search and Refresh Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant name or slug..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={loadAllTenants}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs text-neutral-300 font-semibold transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                <span>Sync with Supabase</span>
              </button>
            </div>

            {/* Restaurants Table */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Restaurant</th>
                      <th className="py-3.5 px-4">Slug & Live URL</th>
                      <th className="py-3.5 px-4">Plan</th>
                      <th className="py-3.5 px-4">Tables / Dishes</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredTenants.map((t) => {
                      const dishCount = t.pages.reduce((sum, p) => sum + p.items.length, 0);
                      const customerUrl = `/?r=${t.slug}&table=Table+1`;

                      return (
                        <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl p-1 bg-neutral-800 rounded-lg">{t.logo || '🛡️'}</span>
                              <div>
                                <div className="font-bold text-white text-sm">{t.name}</div>
                                <div className="text-[11px] text-neutral-400">{t.tagline || 'Kitchen & Bar'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <a
                              href={customerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <span>/?r={t.slug}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold rounded-lg text-[10px]">
                              {t.plan || 'Growth Plan'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-neutral-300 text-[11px]">
                            {t.tables?.length || 0} tables &middot; {dishCount} dishes
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(t.id, t.status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                t.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                              <span>{t.status === 'active' ? 'Active' : 'Suspended'}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleLoginAs(t)}
                                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold text-[11px] transition-colors"
                                title="Login and manage this restaurant's menu"
                              >
                                Manage
                              </button>

                              <button
                                onClick={() => handleDeleteRestaurant(t.id, t.name)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete restaurant from database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTenants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-500">
                          No matching restaurants found in Supabase database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HARDWARE FULFILLMENT */}
        {activeTab === 'hardware' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-base font-bold text-white mb-2">Digital Cards & Table Stand Logistics</h3>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                Physical hardware fulfillment generates immediate upfront revenue on every table deployment in Nigeria. 
                Average production cost is ₦1,800 – ₦2,500 per acrylic stand with embedded digital card, charged at ₦5,000 – ₦7,500.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">A6 Acrylic T-Stand</span>
                    <span className="font-mono text-amber-400 font-bold">₦45,000 / 10pk</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Double-sided UV printing with embedded digital NFC chip. Shomolu local print hub.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Epoxy Waterproof Discs</span>
                    <span className="font-mono text-amber-400 font-bold">₦25,000 / 25pk</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Adhesive round pucks for outdoor tables, bar counters, and patio tables.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Laser Etched Hardwood</span>
                    <span className="font-mono text-amber-400 font-bold">₦75,000 / 10pk</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Solid mahogany / oak wood stands for ultra-luxury steak houses and VIP lounges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICING ARCHITECTURE */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-base font-bold text-white mb-2">SaaS Pricing Architecture (Nigeria)</h3>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed mb-6">
                Recurring revenue tiers displayed on the public <a href="/?page=pricing" className="text-amber-400 underline">Pricing Page</a>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Starter Tier</div>
                  <div className="text-2xl font-mono font-extrabold text-white mb-2">₦25,000 <span className="text-xs text-neutral-400 font-normal">/ mo</span></div>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                    <li>&bull; Up to 10 tables</li>
                    <li>&bull; Realistic 3D Leather Flipbook</li>
                    <li>&bull; Unlimited dishes & device photos</li>
                    <li>&bull; Table waiter buzzer</li>
                    <li>&bull; 0% commission on orders</li>
                  </ul>
                </div>

                <div className="p-5 bg-neutral-950 rounded-2xl border-2 border-amber-500/60">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Growth Tier (Best Seller)</div>
                  <div className="text-2xl font-mono font-extrabold text-amber-400 mb-2">₦50,000 <span className="text-xs text-neutral-400 font-normal">/ mo</span></div>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                    <li>&bull; Up to 30 tables</li>
                    <li>&bull; Live Kitchen Display System (KDS)</li>
                    <li>&bull; Custom signature leather colors</li>
                    <li>&bull; Real-time "Sold Out" toggling</li>
                    <li>&bull; Priority 24/7 WhatsApp support</li>
                  </ul>
                </div>

                <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Enterprise VIP Tier</div>
                  <div className="text-2xl font-mono font-extrabold text-white mb-2">₦90,000 <span className="text-xs text-neutral-400 font-normal">/ mo</span></div>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                    <li>&bull; Unlimited tables</li>
                    <li>&bull; Multi-branch & multi-kitchen</li>
                    <li>&bull; Custom domain branding</li>
                    <li>&bull; First 15 table stands free</li>
                    <li>&bull; Dedicated account manager</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: Onboard Restaurant */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Provision New Restaurant Tenant</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Instantly provisions a cloud database row, private dashboard, and public flipbook URL.
            </p>

            <form onSubmit={handleCreateRestaurant} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Suya Kingdom, Lekki Bistro"
                  className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">Menu URL Slug *</label>
                <div className="flex items-center px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl font-mono text-neutral-400">
                  <span>dinetap.com/?r=</span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    className="w-full bg-transparent text-white font-bold focus:outline-none ml-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1">Subscription Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Starter">Starter (₦25k/mo)</option>
                    <option value="Growth">Growth (₦50k/mo)</option>
                    <option value="Enterprise">Enterprise (₦90k/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-colors shadow-md"
                >
                  Provision Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
