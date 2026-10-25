import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantTenant } from '../../types';
import { 
  fetchAllRestaurantsFromSupabase, 
  updateRestaurantStatusInSupabase, 
  deleteRestaurantFromSupabase,
  updateRestaurantPlanInSupabase,
  setActiveSession,
  registerRestaurant,
  fetchPlatformContactConfig,
  savePlatformContactConfig,
  PlatformContactConfig,
  DEFAULT_PLATFORM_CONTACT,
  supabase
} from '../../utils/supabase';
import { 
  getStoredPlans, 
  saveStoredPlans, 
  resetPlansToDefault, 
  syncRemotePlans,
  PlanTier 
} from '../../utils/pricingConfig';
import { NotchedBottomBar } from '../Navigation/NotchedBottomBar';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  MessageCircle,
  Settings,
  Phone,
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
  RotateCcw,
  AlertCircle
} from 'lucide-react';

// Cryptographic Salt & Precomputed SHA-256 Hashes
// (The plain-text passcodes never exist in source code or client JS bundles)
const PASSCODE_SALT = 'tapmenu_salt_2026_x9';
const VALID_HASHES = [
  '56101a6eebd4fafbe3defe7901bfcaebc67c4347654ce45f68e4bbcc41f42113', // primary hash
  '2c0b5d2dd923a8005745f5034338ab93f2f8a73fe9661f4c21c9e76bd55fefb9'  // legacy fallback hash
];

async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_TOKEN_KEY = 'tapmenu_admin_session_sig';
const SESSION_TIME_KEY = 'tapmenu_admin_session_ts';
const SESSION_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes auto-timeout
const LOCKOUT_KEY = 'tapmenu_admin_lockout_ts';
const ATTEMPTS_KEY = 'tapmenu_admin_failed_attempts';

export const SuperAdminView: React.FC = () => {
  const { showNotification } = useApp();

  // Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'passcode' | 'supabase'>('passcode');
  const [pinInput, setPinInput] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Data
  const [tenants, setTenants] = useState<RestaurantTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'plans' | 'settings' | 'hardware'>('restaurants');

  // Live Subscription Plans
  const [plans, setPlans] = useState<PlanTier[]>(() => getStoredPlans());
  const [hasPlanChanges, setHasPlanChanges] = useState(false);

  // Platform WhatsApp & Contact Settings
  const [contactConfig, setContactConfig] = useState<PlatformContactConfig>(DEFAULT_PLATFORM_CONTACT);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Modal: Onboard new restaurant
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('pass1234');
  const [newPlan, setNewPlan] = useState<'Basic' | 'Standard' | 'Premium' | 'Enterprise'>('Standard');

  // Load all restaurants from Supabase (merging local cache)
  const loadAllTenants = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRestaurantsFromSupabase();
      setTenants(data);
    } catch (err) {
      console.warn('Failed to load restaurants from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync latest remote plans on mount
  useEffect(() => {
    syncRemotePlans().then(live => {
      if (live) setPlans(live);
    });
    fetchPlatformContactConfig().then(cfg => {
      if (cfg) setContactConfig(cfg);
    });
  }, []);

  // Fetch tenants whenever SuperAdmin becomes unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadAllTenants();
      fetchPlatformContactConfig().then(cfg => {
        if (cfg) setContactConfig(cfg);
      });
    }
  }, [isUnlocked]);

  // Verify cryptographic session on load
  useEffect(() => {
    const verifyStoredSession = async () => {
      const ts = sessionStorage.getItem(SESSION_TIME_KEY);
      const sig = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (!ts || !sig) {
        setIsUnlocked(false);
        return;
      }
      const age = Date.now() - parseInt(ts, 10);
      if (isNaN(age) || age < 0 || age > SESSION_MAX_AGE_MS) {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_TIME_KEY);
        setIsUnlocked(false);
        return;
      }
      const expectedSig = await computeSha256(ts + PASSCODE_SALT + 'authenticated_super_admin');
      if (sig === expectedSig) {
        setIsUnlocked(true);
      } else {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_TIME_KEY);
        setIsUnlocked(false);
      }
    };

    // Check lockout on load
    const lockoutUntil = Number(sessionStorage.getItem(LOCKOUT_KEY) || 0);
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (remaining > 0) {
      setLockoutSeconds(remaining);
      setAuthError(`Security lockout active. Try again in ${remaining}s.`);
    }

    verifyStoredSession();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem(LOCKOUT_KEY);
          sessionStorage.removeItem(ATTEMPTS_KEY);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const recordFailedAttempt = () => {
    const attempts = Number(sessionStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    sessionStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= 4) {
      const lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
      sessionStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
      setLockoutSeconds(300);
      setAuthError('Too many failed attempts. Security lockout active for 5 minutes.');
    } else {
      setAuthError(`Access Denied: Invalid credentials. (${4 - attempts} attempt${4 - attempts !== 1 ? 's' : ''} left before lockout)`);
    }
  };

  const createAuthorizedSession = async () => {
    const now = Date.now().toString();
    const sig = await computeSha256(now + PASSCODE_SALT + 'authenticated_super_admin');
    sessionStorage.setItem(SESSION_TIME_KEY, now);
    sessionStorage.setItem(SESSION_TOKEN_KEY, sig);
    sessionStorage.removeItem(ATTEMPTS_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
    setIsUnlocked(true);
    setAuthError(null);
  };

  const handlePasscodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const clean = pinInput.trim().toLowerCase();
      const hash = await computeSha256(PASSCODE_SALT + clean);
      if (VALID_HASHES.includes(hash)) {
        await createAuthorizedSession();
        setPinInput('');
        showNotification('Super-Admin identity verified.');
      } else {
        recordFailedAttempt();
      }
    } catch {
      recordFailedAttempt();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSupabaseUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!supabase) {
      setAuthError('Supabase is not configured.');
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error || !data?.user) {
        recordFailedAttempt();
      } else {
        await createAuthorizedSession();
        setAdminPassword('');
        showNotification(`Welcome, ${data.user.email}! Super-Admin identity verified.`);
      }
    } catch {
      recordFailedAttempt();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TIME_KEY);
    setIsUnlocked(false);
    showNotification('Super-Admin locked.');
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

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      await savePlatformContactConfig(contactConfig);
      showNotification('🎉 WhatsApp contact settings saved! Live on homepage.');
    } catch (err) {
      showNotification('Failed to save WhatsApp settings.');
    } finally {
      setIsSavingContact(false);
    }
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
  const standardPrice = plans.find(p => p.id === 'standard')?.monthlyPrice || 13000;
  const premiumPrice = plans.find(p => p.id === 'premium')?.monthlyPrice || 21000;
  const enterprisePrice = plans.find(p => p.id === 'enterprise')?.monthlyPrice || 35000;

  // Estimated MRR based on dynamically configured plans
  const estimatedMrr = tenants.reduce((acc, t) => {
    const pl = (t.plan || '').toLowerCase();
    if (pl.includes('enterprise')) return acc + enterprisePrice;
    if (pl.includes('premium')) return acc + premiumPrice;
    if (pl.includes('standard') || pl.includes('growth')) return acc + standardPrice;
    return acc + basicPrice;
  }, 0);

  const handleUpdatePlan = (planId: string, updates: Partial<PlanTier>) => {
    setPlans(prev => {
      const updated = prev.map(p => p.id === planId ? { ...p, ...updates } : p);
      // Immediately persist to storage and dispatch event so updates reflect across the entire site
      saveStoredPlans(updated);
      return updated;
    });
    setHasPlanChanges(true);
  };

  const handleSavePlans = () => {
    saveStoredPlans(plans);
    setHasPlanChanges(false);
    showNotification('🎉 Pricing plans saved! Live across all pages.');
  };

  const handleResetPlans = () => {
    const defaults = resetPlansToDefault();
    setPlans(defaults);
    setHasPlanChanges(false);
    showNotification('Reset pricing plans to platform defaults.');
  };

  // If locked, render Secure Access Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-extrabold text-white">Platform Super Admin</h1>
          <p className="text-xs text-neutral-400 mt-1 mb-5">
            Encrypted Administrative Master Control
          </p>

          {/* Auth Mode Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('passcode'); setAuthError(null); }}
              className={`py-1.5 rounded-lg transition-colors ${
                authMode === 'passcode'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Master Key
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('supabase'); setAuthError(null); }}
              className={`py-1.5 rounded-lg transition-colors ${
                authMode === 'supabase'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Supabase Auth
            </button>
          </div>

          {/* Error / Lockout Alert */}
          {authError && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Security Notice</span>
              </div>
              <div className="mt-1 text-[11px] leading-tight">
                {authError}
              </div>
            </div>
          )}

          {/* Form 1: Master Passcode */}
          {authMode === 'passcode' && (
            <form onSubmit={handlePasscodeUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  disabled={lockoutSeconds > 0 || isAuthenticating}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Master Security Key"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-center text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={lockoutSeconds > 0 || isAuthenticating || !pinInput.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? 'Verifying Cryptographic Hash...' : lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Verify Master Key'}
              </button>
            </form>
          )}

          {/* Form 2: Direct Supabase Admin Auth */}
          {authMode === 'supabase' && (
            <form onSubmit={handleSupabaseUnlock} className="space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  disabled={lockoutSeconds > 0 || isAuthenticating}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@tapmenu.com"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  disabled={lockoutSeconds > 0 || isAuthenticating}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={lockoutSeconds > 0 || isAuthenticating || !adminEmail.trim() || !adminPassword}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isAuthenticating ? 'Authenticating with Supabase...' : lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Sign In via Supabase'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Protected</span>
            </span>
            <a href="/" className="hover:text-neutral-300">
              ← Return Home
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-serif font-black text-base sm:text-lg shadow-md shrink-0">
              T
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-xs sm:text-base text-white truncate">TapMenu Admin</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-bold border border-amber-500/30 shrink-0">
                  Master
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block -mt-0.5 truncate hidden sm:block">
                Multi-Tenant PostgreSQL & Hardware Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
            <button
              onClick={handleLock}
              className="px-2.5 sm:px-3 py-1.5 text-neutral-400 hover:text-white transition-colors text-[11px]"
              title="Lock Admin Session"
            >
              Lock
            </button>
            <a
              href="/"
              className="px-2.5 sm:px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors font-semibold text-[11px]"
            >
              Live Site
            </a>
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Restaurant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (with bottom padding on mobile for app tab bar) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-28 md:pb-8">
        
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Restaurants
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1 block">
              {totalRestaurants}
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" /> Live Supabase
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Table QR/NFCs
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1 block">
              {totalTables}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 block truncate">
              Active table points
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Dishes Published
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 mt-1 block">
              {totalDishes}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 block truncate">
              Live menu items
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Estimated Monthly MRR
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1 block truncate">
              ₦{estimatedMrr.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 block truncate">
              SaaS subscription pipeline
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Desktop view) */}
        <div className="hidden md:flex items-center gap-2 border-b border-neutral-800 pb-3">
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
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Homepage WhatsApp Chat</span>
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

            {/* Desktop Restaurants Table */}
            <div className="hidden md:block bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-lg">
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

            {/* Mobile Restaurant Cards List */}
            <div className="space-y-3.5 md:hidden">
              {filteredTenants.map((t) => {
                const dishCount = t.pages.reduce((sum, p) => sum + p.items.length, 0);
                const customerUrl = `/?r=${t.slug}&table=Table+1`;

                return (
                  <div key={t.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 shadow-md space-y-3">
                    {/* Header: Logo, Name, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                          {t.logo && (t.logo.startsWith('data:') || t.logo.startsWith('http') || t.logo.startsWith('/')) ? (
                            <img src={t.logo} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{t.logo || '🛡️'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                          <p className="text-[11px] text-neutral-400 truncate">{t.tagline || 'Kitchen & Bar'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(t.id, t.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors shrink-0 ${
                          t.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        <span>{t.status === 'active' ? 'Active' : 'Suspended'}</span>
                      </button>
                    </div>

                    {/* Live URL Link & Table/Dish Counts */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/80">
                      <a
                        href={customerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[50%]"
                      >
                        <span className="truncate">/?r={t.slug}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <div className="font-mono text-[11px] text-neutral-300 shrink-0">
                        <span className="font-bold text-white">{t.tables?.length || 0}</span>
                        <span className="text-neutral-500">/</span>
                        <span className="text-amber-300 font-semibold">
                          {t.tableLimit !== undefined && t.tableLimit !== null
                            ? `${t.tableLimit}`
                            : (() => {
                                const pl = (t.plan || 'basic').toLowerCase();
                                if (pl.includes('enterprise')) return '∞';
                                if (pl.includes('premium')) return '60';
                                if (pl.includes('standard') || pl.includes('growth')) return '20';
                                return '10';
                              })()
                          }
                        </span>
                        <span className="text-neutral-400 ml-1">tbls</span>
                        <span className="text-neutral-500 mx-1">·</span>
                        <span className="text-neutral-400">{dishCount} dishes</span>
                      </div>
                    </div>

                    {/* Plan & Limit Overrides */}
                    <div className="bg-neutral-950/70 rounded-xl p-2.5 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Plan</label>
                        <select
                          value={(t.plan || 'basic').toLowerCase()}
                          onChange={(e) => handleUpdateTenantPlan(t.id, e.target.value)}
                          className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="basic">Basic (10 tables)</option>
                          <option value="standard">Standard (20 tables)</option>
                          <option value="premium">Premium (60 tables)</option>
                          <option value="enterprise">Enterprise (Unlimited)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Table Limit Override</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            placeholder="Auto"
                            value={t.tableLimit ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10));
                              handleUpdateTenantCustomTableLimit(t.id, val);
                            }}
                            className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-center text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                          {t.tableLimit !== undefined && t.tableLimit !== null && (
                            <span className="text-amber-400 font-bold text-[9px]">(custom)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleLoginAs(t)}
                        className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manage Venue</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(t.id, t.name)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-neutral-800 transition-colors"
                        title="Delete venue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredTenants.length === 0 && (
                <div className="py-8 text-center text-neutral-500 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs">
                  No matching restaurants found in Supabase database.
                </div>
              )}
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
                Average production cost is ₦1,600 per card, charged at ₦7,000 per card (generating ₦5,400 net profit per table setup).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Plain White Digital Card</span>
                    <span className="font-mono text-amber-400 font-bold">₦7,000 / card</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    High-grade waterproof digital card with scannable QR. Cost: ₦1,600 &middot; <strong className="text-emerald-400">₦5,400 profit per table</strong>.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Custom Logo / Branded Card</span>
                    <span className="font-mono text-amber-400 font-bold">₦11,000 / card</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    ₦7k base + ₦4k custom full-color logo / restaurant artwork UV printing. <strong className="text-emerald-400">₦7,500+ profit per table</strong>.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Heavy Clear Acrylic Stand</span>
                    <span className="font-mono text-amber-400 font-bold">₦3,500 / stand</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Crystal-clear tabletop display standee holds the smart card upright and spill-proof for high-turn dining tables.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HOMEPAGE WHATSAPP & CONTACT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span>Homepage WhatsApp Chat Bubble Configuration</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Control the floating WhatsApp contact bubble in the bottom right corner of the TapMenu homepage for customer inquiries & onboardings.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-neutral-200 mb-1 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Phone Number (International Format) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactConfig.whatsappNumber}
                    onChange={(e) => setContactConfig(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="e.g. 2348000000000 or +234 800 000 0000"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-colors"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                    Enter the phone number with country code. Symbols will be cleaned automatically. Examples: <span className="font-mono text-amber-300">2348012345678</span> (Nigeria), <span className="font-mono text-amber-300">14155551234</span> (USA), <span className="font-mono text-amber-300">447123456789</span> (UK).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-200 mb-1 flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Default Chat Welcome Message *</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={contactConfig.whatsappMessage}
                    onChange={(e) => setContactConfig(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                    placeholder="Hello TapMenu Team! I'd like to learn more about digital menus for my restaurant."
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs leading-relaxed focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-colors"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Pre-filled message when the visitor taps the chat bubble on the landing page.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-200 mb-1">
                    Support Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactConfig.supportEmail || ''}
                    onChange={(e) => setContactConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                    placeholder="support@tapmenu.me"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Live Preview & Direct Test Card */}
                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                    <span>Live Interactive Chat Bubble Preview</span>
                    <span className="text-[11px] text-emerald-400 font-mono">Status: Connected</span>
                  </div>

                  <div className="flex items-center gap-3.5 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shrink-0">
                      <MessageCircle className="w-6 h-6 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>WhatsApp Chat Link</span>
                        <span className="font-mono text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          +{contactConfig.whatsappNumber.replace(/[^0-9]/g, '') || '2348000000000'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        "{contactConfig.whatsappMessage}"
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${contactConfig.whatsappNumber.replace(/[^0-9]/g, '') || '2348000000000'}?text=${encodeURIComponent(contactConfig.whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-neutral-700"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingContact}
                    className="px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-neutral-950 font-black rounded-xl text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingContact ? 'Saving Settings...' : 'Save WhatsApp Settings'}</span>
                  </button>
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>View Live on Homepage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </form>
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

                      {/* Annual Incentive Perk */}
                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                          🎁 Annual Incentive Perk
                        </label>
                        <input
                          type="text"
                          value={p.annualIncentive || ''}
                          placeholder="e.g. Save ₦26k (2 Mos Free) + 5 Free Smart Cards"
                          onChange={(e) => handleUpdatePlan(p.id, { annualIncentive: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
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

      {/* ALWAYS-VISIBLE MOBILE FLOATING ACTION BUTTON */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOnboardModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-full shadow-2xl shadow-amber-500/40 active:scale-95 border border-amber-300 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-bold uppercase tracking-wide">Onboard</span>
        </button>
      </div>

      {/* MOBILE APP-STYLE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 md:hidden px-3 py-2 flex items-center justify-around safe-bottom shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('restaurants')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'restaurants' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Venues ({totalRestaurants})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'plans' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Plans & Pricing</span>
          {hasPlanChanges && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MessageCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'hardware' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Cards</span>
        </button>
      </nav>

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

      {/* Mobile Ergonomic Notched Floating Bottom Navigation Bar */}
      <NotchedBottomBar
        variant="super_admin"
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
        totalRestaurants={totalRestaurants}
        hasPlanChanges={hasPlanChanges}
        onLockSession={handleLock}
      />
    </div>
  );
};
