import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { registerRestaurant, loginRestaurantOwner } from '../../utils/supabase';
import { 
  UtensilsCrossed, 
  Sparkles, 
  ArrowRight, 
  Store, 
  KeyRound, 
  Mail, 
  Globe, 
  Coins, 
  CheckCircle2, 
  QrCode,
  ShieldCheck
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { switchRestaurant, showNotification } = useApp();
  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Signup fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('₦');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Auto-slugify restaurant name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await registerRestaurant({
        name,
        slug,
        email,
        password,
        currency,
      });

      if (!res.success || !res.restaurant) {
        setErrorMsg(res.error || 'Failed to create restaurant. Please try another slug.');
        setLoading(false);
        return;
      }

      showNotification(`🎉 Restaurant "${res.restaurant.name}" created!`);
      // Reload or navigate to dashboard
      window.location.href = window.location.pathname;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginRestaurantOwner(loginEmail, loginPassword);
      if (!res.success || !res.restaurant) {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      showNotification(`Welcome back to ${res.restaurant.name}!`);
      window.location.href = window.location.pathname;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-amber-500/20">
            D
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight">DineTap</span>
            <span className="text-[10px] block text-amber-400 font-mono -mt-1">RESTAURANT SAAS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/?r=demo&table=Table+5"
            className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            Live Demo Menu &rarr;
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {tab === 'signup' ? 'Launch Your Digital Menu' : 'Restaurant Portal Login'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-sm mx-auto">
            {tab === 'signup'
              ? 'Get a dedicated URL slug, unique table QR codes, and a live kitchen display in seconds.'
              : 'Log in to manage your menu items, table QR codes, and live kitchen orders.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl mb-6">
          <button
            onClick={() => { setTab('signup'); setErrorMsg(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'signup' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Restaurant
          </button>
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'login' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* SIGN UP FORM */}
        {tab === 'signup' ? (
          <form onSubmit={handleRegister} className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Restaurant Name *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Lagos Grill & Bistro"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Menu URL Slug *</span>
              </label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-3 focus-within:border-amber-500">
                <span className="text-[11px] text-neutral-500 font-mono">/?r=</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="lagos-grill"
                  className="w-full py-2.5 bg-transparent text-xs text-amber-400 font-mono font-bold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Your diners will access your menu via: <span className="font-mono text-neutral-400">/?r={slug || 'your-slug'}&table=1</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Currency</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="₦">₦ (Naira)</option>
                  <option value="$">$ (USD)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="KSh">KSh (KES)</option>
                  <option value="GH₵">GH₵ (GHS)</option>
                  <option value="R">R (ZAR)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password *</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating Your Menu...' : 'Create Restaurant & Open Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-500">
                🔒 Direct payments only. Diners pay via Card/POS or Cash to your staff.
              </span>
            </div>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form onSubmit={handleLogin} className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Restaurant Email or Slug *</span>
              </label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="owner@restaurant.com or slug"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Logging In...' : 'Sign In to Restaurant Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-[11px] text-neutral-600 border-t border-neutral-900">
        DineTap &copy; {new Date().getFullYear()} &middot; Digital Menus, Table QR Codes & Kitchen Display System
      </footer>
    </div>
  );
};
