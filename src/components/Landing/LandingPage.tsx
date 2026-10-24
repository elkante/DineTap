import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  QrCode, 
  Nfc, 
  ChefHat, 
  Coins, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Store, 
  UtensilsCrossed,
  X,
  CreditCard,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { registerRestaurant, loginRestaurantOwner } from '../../utils/supabase';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { showNotification } = useApp();
  const [authModal, setAuthModal] = useState<'signup' | 'login' | null>(null);
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

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(generated);
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
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Navbar */}
      <nav className="border-b border-neutral-900 sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-extrabold text-lg shadow-lg shadow-amber-500/25">
              D
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">DineTap</span>
              <span className="text-[10px] block text-amber-400 font-mono -mt-1 uppercase tracking-wider">Restaurant Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="px-3.5 py-2 text-neutral-300 hover:text-white font-semibold transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              Launch Menu Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 sm:pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-semibold text-amber-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NTAG213 NFC & QR Digital Menu Book Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
          Turn Your Dining Tables into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Interactive Digital Menus</span> & Direct Orders.
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto mt-5 leading-relaxed">
          Zero app downloads for diners. Customers tap an NFC tag or scan table QR code, browse a luxury flipbook menu, and order straight to your kitchen.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <span>Create Your Menu in 60s</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-2xl text-sm border border-neutral-800 transition-colors"
          >
            Restaurant Portal Login
          </button>
        </div>

        {/* Feature Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Direct Table Payments (POS / Cash)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Per-Table QR Code Generator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Real-time Kitchen Display</span>
          </div>
        </div>
      </section>

      {/* Visual Menu Book Preview Showcase */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Preview</span>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">What Your Diners Experience</h2>
            <p className="text-xs text-neutral-400 mt-1">Authentic leather-bound digital book feel with real page flipping.</p>
          </div>

          {/* Interactive Card Mockup */}
          <div className="max-w-md mx-auto bg-[#FAF8F5] text-neutral-900 rounded-2xl p-5 shadow-xl border-4 border-amber-950/40 relative">
            {/* Book Spine Crease Shadow */}
            <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/25 to-transparent pointer-events-none rounded-l-xl" />

            <div className="flex items-baseline justify-between border-b border-stone-300 pb-2 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                  Table 5
                </span>
                <h3 className="font-serif font-black text-lg mt-1 text-amber-950">Specialities & Grills</h3>
              </div>
              <span className="text-xs font-mono text-neutral-400 font-bold">P. 2</span>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="font-bold text-xs text-neutral-900">Charcoal Beef Suya Skewers</div>
                  <div className="text-[10px] text-neutral-500 line-clamp-1">Tender beef charred over open coals with spicy yaji blend.</div>
                  <div className="font-mono text-xs font-bold text-amber-800 mt-0.5">₦4,500</div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold shrink-0">
                  + Add
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="font-bold text-xs text-neutral-900">Whole Grilled Tilapia Feast</div>
                  <div className="text-[10px] text-neutral-500 line-clamp-1">Scotch bonnet marinade, yam fries and pepper sauce.</div>
                  <div className="font-mono text-xs font-bold text-amber-800 mt-0.5">₦9,500</div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold shrink-0">
                  + Add
                </span>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-stone-200 text-center">
              <span className="text-[10px] text-stone-500 font-medium">Swipe or tap edge to turn pages &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Unique Table QRs</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every table gets its own scannable link. Table 5 orders automatically display as Table 5.
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Direct Payments</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Diners pay directly via wireless POS at table, Cash, or Direct Transfer. Zero deductions.
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Live Kitchen Tickets</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Orders appear on kitchen tablets/screens instantly with sound chime and order notes.
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white mb-1">Instant Menu Updates</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Upload photos, adjust prices, or mark dishes sold out in 1 tap across all dining tables.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 text-center text-xs text-neutral-500">
        <p>DineTap &copy; {new Date().getFullYear()} &middot; Digital Menu Books & Table Ordering Platform</p>
      </footer>

      {/* AUTH MODAL (SIGNUP / LOGIN) */}
      {authModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl mb-4 border border-neutral-800">
              <button
                onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  authModal === 'signup' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Create Menu
              </button>
              <button
                onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  authModal === 'login' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 mb-3 text-center">
                {errorMsg}
              </div>
            )}

            {authModal === 'signup' ? (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Lagos Bites & Grill"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Menu URL Slug *</label>
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                    <span className="text-neutral-500 font-mono text-[11px]">/?r=</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      className="w-full bg-transparent text-amber-400 font-mono font-bold focus:outline-none ml-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@food.com"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="₦">₦ (NGN)</option>
                      <option value="$">$ (USD)</option>
                      <option value="£">£ (GBP)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="KSh">KSh (KES)</option>
                      <option value="GH₵">GH₵ (GHS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow mt-2"
                >
                  {loading ? 'Creating Menu...' : 'Launch Digital Menu'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Email or Restaurant Slug *</label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="owner@restaurant.com or slug"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow mt-2"
                >
                  {loading ? 'Logging In...' : 'Sign In'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
