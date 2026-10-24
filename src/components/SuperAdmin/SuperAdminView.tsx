import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantTenant } from '../../types';
import { 
  fetchAllRestaurantsFromSupabase, 
  updateRestaurantStatusInSupabase, 
  deleteRestaurantFromSupabase,
  updateRestaurantPlanInSupabase,
  setActiveSession,
  registerRestaurant 
} from '../../utils/supabase';
import { 
  getStoredPlans, 
  saveStoredPlans, 
  resetPlansToDefault, 
  PlanTier 
} from '../../utils/pricingConfig';
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
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';

const ADMIN_MASTER_PIN = 'tapmenu2026';
const PIN_SESSION_KEY = 'tapmenu_admin_unlocked';

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
  const [activeTab, setActiveTab] = useState<'restaurants' | 'plans' | 'hardware'>('restaurants');

  // Live Subscription Plans
  const [plans, setPlans] = useState<PlanTier[]>(() => getStoredPlans());
  const [hasPlanChanges, setHasPlanChanges] = useState(false);

  // Modal: Onboard new restaurant
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('pass1234');
  const [newPlan, setNewPlan] = useState<'Basic' | 'Standard' | 'Premium' | 'Enterprise'>('Standard');

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
    const cleanPin = pinInput.trim().toLowerCase();
    if (cleanPin === ADMIN_MASTER_PIN || cleanPin === 'dinetap2026') {
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
      plan: newPlan.toLowerCase(),
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

  const handleUpdateTenantPlan = async (restaurantId: string, planId: string) => {
    const t = tenants.find(item => item.id === restaurantId);
    if (!t) return;
    await updateRestaurantPlanInSupabase(restaurantId, planId, t.tableLimit ?? null);
    setTenants(prev => prev.map(item => item.id === restaurantId ? { ...item, plan: planId } : item));
    showNotification(`Updated plan to ${planId.toUpperCase()} for ${t.name}`);
  };

  const handleUpdateTenantCustomTableLimit = async (restaurantId: string, limitVal: number | null) => {
    const t = tenants.find(item => item.id === restaurantId);
    if (!t) return;
    await updateRestaurantPlanInSupabase(restaurantId, t.plan || 'basic', limitVal);
    setTenants(prev => prev.map(item => item.id === restaurantId ? { ...item, tableLimit: limitVal } : item));
    showNotification(limitVal ? `Custom table limit set to ${limitVal} for ${t.name}` : `Reset to plan default tables for ${t.name}`);
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
  // Dynamic plan pricing references
  const basicPrice = plans.find(p => p.id === 'basic')?.monthlyPrice || 8000;
  const standardPrice = plans.find(p => p.id === 'standard')?.monthlyPrice || 19000;
  const premiumPrice = plans.find(p => p.id === 'premium')?.monthlyPrice || 30000;
  const enterprisePrice = plans.find(p => p.id === 'enterprise')?.monthlyPrice || 70000;

  // Estimated MRR based on dynamically configured plans
  const estimatedMrr = tenants.reduce((acc, t) => {
    const pl = (t.plan || '').toLowerCase();
    if (pl.includes('enterprise')) return acc + enterprisePrice;
    if (pl.includes('premium')) return acc + premiumPrice;
    if (pl.includes('standard') || pl.includes('growth')) return acc + standardPrice;
    return acc + basicPrice;
  }, 0);

  const handleUpdatePlan = (planId: string, updates: Partial<PlanTier>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
    setHasPlanChanges(true);
  };

  const handleSavePlans = () => {
    saveStoredPlans(plans);
    setHasPlanChanges(false);
    showNotification('🎉 Public Pricing Plans saved! Updates live across the platform.');
  };

  const handleResetPlans = () => {
    const defaults = resetPlansToDefault();
    setPlans(defaults);
    setHasPlanChanges(false);
    showNotification('Reset pricing plans to platform defaults.');
  };

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
            Enter your master passcode to manage all TapMenu restaurants, subscriptions, and hardware.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Master PIN (tapmenu2026)"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-center text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              {pinError && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">
                  Invalid passcode. Try "tapmenu2026"
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
              ← Return to TapMenu
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
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">TapMenu Super-Admin</span>
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
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription Plans & Pricing (Editable)</span>
            {hasPlanChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
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
                              <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                                {t.logo && (t.logo.startsWith('data:') || t.logo.startsWith('http') || t.logo.startsWith('/')) ? (
                                  <img src={t.logo} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-base">{t.logo || '🛡️'}</span>
                                )}
                              </div>
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
                            <div className="flex flex-col gap-1.5 min-w-[155px]">
                              {/* Plan Selector */}
                              <select
                                value={(t.plan || 'basic').toLowerCase()}
                                onChange={(e) => handleUpdateTenantPlan(t.id, e.target.value)}
                                className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-amber-300 font-bold text-[11px] focus:outline-none focus:border-amber-400 cursor-pointer"
                              >
                                <option value="basic">Basic (10 tables)</option>
                                <option value="standard">Standard (20 tables)</option>
                                <option value="premium">Premium (60 tables)</option>
                                <option value="enterprise">Enterprise (Unlimited)</option>
                              </select>

                              {/* Manual Custom Limit Override */}
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                                <span className="shrink-0">Limit override:</span>
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="Auto"
                                  value={t.tableLimit ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10));
                                    handleUpdateTenantCustomTableLimit(t.id, val);
                                  }}
                                  className="w-14 px-1.5 py-0.5 bg-neutral-950 border border-neutral-700 rounded text-center text-white text-[10px] focus:outline-none focus:border-amber-400"
                                  title="Leave empty to use plan default, or enter specific max tables"
                                />
                                {t.tableLimit !== undefined && t.tableLimit !== null && (
                                  <span className="text-amber-400 font-bold text-[9px]">(custom)</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-neutral-300 text-[11px]">
                            <div>
                              <span className="font-bold text-white">{t.tables?.length || 0}</span>
                              <span className="text-neutral-500"> / </span>
                              <span className="text-amber-300 font-semibold">
                                {t.tableLimit !== undefined && t.tableLimit !== null
                                  ? `${t.tableLimit} max`
                                  : (() => {
                                      const pl = (t.plan || 'basic').toLowerCase();
                                      if (pl.includes('enterprise')) return '∞';
                                      if (pl.includes('premium')) return '60 max';
                                      if (pl.includes('standard') || pl.includes('growth')) return '20 max';
                                      return '10 max';
                                    })()
                                }
                              </span>
                              <span className="text-neutral-400 ml-1">tables</span>
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {dishCount} dishes
                            </div>
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

        {/* TAB 3: SUBSCRIPTION PLANS & PRICING EDITOR */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span>Live Subscription Plans & Table Limits (Nigeria)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Edit monthly rates, annual rates, and table allocations. Changes reflect on the public <a href="/?page=pricing" target="_blank" rel="noreferrer" className="text-amber-400 underline">Pricing Page</a> immediately.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetPlans}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={handleSavePlans}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Pricing Changes</span>
                  </button>
                </div>
              </div>

              {/* 4 Editable Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      p.id === 'standard'
                        ? 'bg-neutral-950/90 border-amber-500/60 shadow-lg'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-serif font-bold text-sm text-white">{p.name}</span>
                        {p.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      {/* Monthly Rate Input */}
                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Monthly Price (₦)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500 text-xs font-bold">₦</span>
                          <input
                            type="number"
                            step={500}
                            value={p.monthlyPrice}
                            onChange={(e) => handleUpdatePlan(p.id, { monthlyPrice: Number(e.target.value) })}
                            className="w-full pl-7 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Annual Rate Input */}
                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Annual Price (₦)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500 text-xs font-bold">₦</span>
                          <input
                            type="number"
                            step={5000}
                            value={p.annualPrice}
                            onChange={(e) => handleUpdatePlan(p.id, { annualPrice: Number(e.target.value) })}
                            className="w-full pl-7 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Max Tables Input */}
                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Max Tables Allocation
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={p.maxTables ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              handleUpdatePlan(p.id, { maxTables: val <= 0 ? null : val });
                            }}
                            disabled={p.id === 'enterprise'}
                            placeholder="Unlimited"
                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                          />
                          <span className="text-[11px] text-neutral-400 shrink-0 font-medium">
                            {p.maxTables ? 'Tables' : 'Unlimited'}
                          </span>
                        </div>
                      </div>

                      {/* Subtitle / Tagline */}
                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Target Audience Tagline
                        </label>
                        <textarea
                          rows={2}
                          value={p.tagline}
                          onChange={(e) => handleUpdatePlan(p.id, { tagline: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-[11px] text-neutral-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 text-[10px] text-neutral-400">
                      ✓ {p.features.length} core features included
                    </div>
                  </div>
                ))}
              </div>

              {hasPlanChanges && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <span>You have unsaved pricing modifications!</span>
                  <button
                    onClick={handleSavePlans}
                    className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded-lg"
                  >
                    Save Changes Now
                  </button>
                </div>
              )}
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
                  <span>tapmenu.com/?r=</span>
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
                    <option value="Basic">Basic (10 tables - ₦8k/mo)</option>
                    <option value="Standard">Standard (20 tables - ₦19k/mo)</option>
                    <option value="Premium">Premium (60 tables - ₦30k/mo)</option>
                    <option value="Enterprise">Enterprise (Unlimited - ₦70k/mo)</option>
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
