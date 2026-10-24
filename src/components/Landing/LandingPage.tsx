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
  ChevronRight,
  Palette
} from 'lucide-react';
import { registerRestaurant, loginRestaurantOwner } from '../../utils/supabase';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC<{ onOpenPricing?: () => void }> = ({ onOpenPricing }) => {
  const { showNotification } = useApp();
  const [authModal, setAuthModal] = useState<'signup' | 'login' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Secret 6-tap easter egg for platform super admin (/sys-hq)
  const [logoTaps, setLogoTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 3000) {
      setLogoTaps(1);
    } else {
      const next = logoTaps + 1;
      if (next >= 6) {
        setLogoTaps(0);
        window.location.href = '/sys-hq';
        return;
      }
      setLogoTaps(next);
    }
    setLastTapTime(now);
  };

  // Signup fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('₦');
  const [chosenColor] = useState('#0c2e22');

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
        coverColor: chosenColor,
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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950 overflow-x-hidden">
      {/* Top Navbar: Modern, Ultra-clean & Mobile-first */}
      <nav className="border-b border-stone-200/80 sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo with secret 6-tap easter egg to /sys-hq */}
          <button 
            onClick={handleLogoTap}
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none select-none active:scale-95 transition-transform"
            title="DineTap"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center font-serif font-black text-base sm:text-xl shadow-md border border-[#D4AF37]/40 shrink-0">
              D
            </div>
            <div className="min-w-0">
              <span className="font-serif font-extrabold text-base sm:text-xl tracking-tight text-stone-900 block leading-tight">DineTap</span>
              <span className="text-[9px] sm:text-[10px] block text-amber-800 font-mono uppercase tracking-wider font-bold truncate">Luxury Menus</span>
            </div>
          </button>

          {/* Nav Actions */}
          <div className="flex items-center gap-1 sm:gap-3 text-xs">
            <button
              onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')}
              className="px-2.5 sm:px-3.5 py-1.5 text-stone-700 hover:text-stone-950 font-bold transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="px-2.5 sm:px-3.5 py-1.5 text-stone-700 hover:text-stone-950 font-bold transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl transition-all shadow-md active:scale-95 border border-[#D4AF37]/30 text-xs whitespace-nowrap"
            >
              <span className="hidden xs:inline">Create Menu </span>Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 sm:pt-16 pb-12 sm:pb-16 text-center">
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-300/80 text-[10px] sm:text-[11px] font-bold text-amber-900 mb-5 shadow-xs max-w-full truncate">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate">Digital Smart Cards &bull; Instant QR &bull; Direct Table Orders</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.18] sm:leading-[1.15] text-stone-900">
          Turn Your Dining Tables into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 italic">Luxury Digital Books</span> & Direct Orders.
        </h1>

        <p className="text-xs sm:text-base md:text-lg text-stone-600 max-w-2xl mx-auto mt-4 sm:mt-6 leading-relaxed">
          Zero app downloads for diners. Customers tap an NFC card or scan table QR code, browse a realistic leather-bound flipbook menu, and order straight to your kitchen.
        </p>

        {/* CTA Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 max-w-md mx-auto w-full">
          <button
            onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 active:scale-95 border border-[#D4AF37]/35"
          >
            <span>Create Your Restaurant Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-2xl text-xs sm:text-sm border border-stone-300 transition-colors shadow-xs"
          >
            Restaurant Portal Login
          </button>
        </div>

        {/* Value Prop Badges */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-stone-600 font-medium">
          <div className="flex items-center gap-1.5 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-stone-200 sm:border-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>100% Direct Table Payments (POS / Cash)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-stone-200 sm:border-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Custom Slug & Signature Book Color</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-stone-200 sm:border-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Zero 3rd-Party Payment Withholding</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO SHOWCASE IMAGE: LUXURY DIGITAL DINING EXPERIENCE */}
        {/* ========================================================================= */}
        <div className="mt-10 sm:mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-900/15 bg-stone-950 group">
            {/* High-res luxury restaurant dining photography */}
            <div className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85"
                alt="Luxury Dining Experience with DineTap Digital Menus"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            </div>

            {/* Overlaid Badges & Interactive Highlights */}
            <div className="absolute inset-0 p-3 sm:p-6 md:p-8 flex flex-col justify-between pointer-events-none">
              {/* Top Bar Highlights */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-900/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-[9px] sm:text-xs font-bold shadow-lg">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Interactive Luxury Folio &bull; Instant Tap</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live KDS Kitchen Network</span>
                </div>
              </div>

              {/* Bottom Feature Pill Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-left">
                <div className="bg-stone-950/85 backdrop-blur-md border border-stone-800/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs sm:text-sm mb-0.5">
                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Zero App Download</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-300 line-clamp-2">
                    Customers tap table cards or scan QR to immediately open your branded menu.
                  </p>
                </div>

                <div className="hidden xs:block bg-stone-950/85 backdrop-blur-md border border-stone-800/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm mb-0.5">
                    <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Live Kitchen KDS</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-300 line-clamp-2">
                    Orders route immediately to line cooks with exact table number and customer notes.
                  </p>
                </div>

                <div className="hidden xs:block bg-stone-950/85 backdrop-blur-md border border-stone-800/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm mb-0.5">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Direct POS & Cash</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-300 line-clamp-2">
                    Zero percentage cuts withheld. Collect 100% of revenue at the table directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 border-t border-stone-200">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
            Why Top Restaurants Choose DineTap
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Built from the ground up for authentic hospitality, higher table turn rates, and total payment autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-4">
              📖
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Authentic Menu Book</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Not another clinical PDF or generic web form. DineTap provides a realistic luxury leather folio with 3D turning pages, debossed foil, and category tabs.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold mb-4">
              📱
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Tap Digital Card or Scan QR</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Encode durable digital smart table pucks or print scannable QR stand cards. Orders always carry the specific table number straight to the kitchen.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-4">
              💳
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">100% Direct Table Payments</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              No online payment gateways withholding your funds for days. Diners pay your staff directly via Card POS terminal, Cash, or Instant Bank Transfer.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-10 sm:py-12 bg-white text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleLogoTap}
              type="button"
              className="flex items-center gap-2 font-serif font-bold text-stone-900 text-sm focus:outline-none select-none active:scale-95 transition-transform"
            >
              <span className="w-7 h-7 rounded-lg bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center text-xs shadow-sm font-serif font-black">D</span>
              <span>DineTap Nigeria</span>
            </button>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="text-stone-500 text-[11px]">Luxury 3D Digital Menus & Smart Tap Standees</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs font-semibold text-stone-600">
            <button
              onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')}
              className="hover:text-amber-900 transition-colors"
            >
              Pricing Plans
            </button>
            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="hover:text-amber-900 transition-colors"
            >
              Kitchen & Staff Sign In
            </button>
          </div>

          <div className="text-[11px] text-stone-400">
            &copy; {new Date().getFullYear()} DineTap Inc. Lagos, Nigeria.
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SIGNUP MODAL (With Custom Slug & Signature Color Picker!) */}
      {/* ========================================================================= */}
      {authModal === 'signup' && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative text-xs">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">Create Restaurant</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">Launch Your Digital Menu</h2>
              <p className="text-stone-500 text-xs mt-1">Ready for diners in 60 seconds. Customize your signature color.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. The Corner Table"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Custom Menu Slug *</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-500 font-mono text-xs">
                  <span>/?r=</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="corner-table"
                    className="w-full bg-transparent text-stone-900 font-bold focus:outline-none ml-1"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                  >
                    <option value="₦">₦ (NGN)</option>
                    <option value="$">$ (USD)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="₵">₵ (GHS)</option>
                    <option value="KSh">KSh (KES)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Staff Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2 border border-[#D4AF37]/35"
              >
                {loading ? 'Creating Menu Book...' : 'Create My Restaurant Menu &rarr;'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-200 text-center text-stone-500">
              Already have an account?{' '}
              <button
                onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
                className="text-amber-900 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOGIN MODAL */}
      {/* ========================================================================= */}
      {authModal === 'login' && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative text-xs">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">Restaurant Portal</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">Staff & Kitchen Sign In</h2>
              <p className="text-stone-500 text-xs mt-1">Access your live Kitchen KDS and table QR manager.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Email or Slug</label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="corner-table or manager@email.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2 border border-[#D4AF37]/35"
              >
                {loading ? 'Authenticating...' : 'Sign In to Kitchen &rarr;'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-200 text-center text-stone-500">
              Need a menu for your restaurant?{' '}
              <button
                onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
                className="text-amber-900 font-bold hover:underline"
              >
                Create One Free
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
