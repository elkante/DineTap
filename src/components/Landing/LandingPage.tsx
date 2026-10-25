import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Store,
  KeyRound,
  Mail,
  Smartphone
} from 'lucide-react';
import { 
  registerRestaurant, 
  loginRestaurantOwner,
  fetchPlatformContactConfig,
  getStoredPlatformContact,
  PlatformContactConfig
} from '../../utils/supabase';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../PWAInstallButton';

export const LandingPage: React.FC<{ onOpenPricing?: () => void }> = ({ onOpenPricing }) => {
  const { showNotification } = useApp();
  const [authModal, setAuthModal] = useState<'signup' | 'login' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contactConfig, setContactConfig] = useState<PlatformContactConfig>(() => getStoredPlatformContact());

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

  // Lock body scroll while modal is open to prevent screen shaking on mobile
  useEffect(() => {
    if (authModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [authModal]);

  // Load and listen for dynamic platform WhatsApp contact configuration
  useEffect(() => {
    fetchPlatformContactConfig().then(cfg => {
      if (cfg) setContactConfig(cfg);
    });
    const handleContactUpdate = (e: any) => {
      if (e.detail) setContactConfig(e.detail);
    };
    window.addEventListener('tapmenu_contact_updated', handleContactUpdate);
    return () => {
      window.removeEventListener('tapmenu_contact_updated', handleContactUpdate);
    };
  }, []);

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
    <div className="relative min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950 overflow-x-hidden">
      {/* Top Navbar: Modern, Ultra-clean & Mobile-first */}
      <nav className="border-b border-stone-200/80 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo with secret 6-tap easter egg to /sys-hq */}
          <button 
            onClick={handleLogoTap}
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none select-none active:scale-95 transition-transform group"
            title="TapMenu - Tap 6 times for Super Admin"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center font-serif font-black text-base sm:text-xl shadow-md border border-[#D4AF37]/40 shrink-0 group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="min-w-0">
              <span className="font-serif font-extrabold text-base sm:text-xl tracking-tight text-stone-900 block leading-tight">TapMenu</span>
              <span className="text-[9px] sm:text-[10px] block text-amber-800 font-mono uppercase tracking-wider font-bold truncate">Realistic Menus &amp; Orders</span>
            </div>
          </button>

          {/* Center Navigation Links (Tablet/Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-stone-600">
            <a href="#hero" className="text-amber-900 border-b-2 border-amber-900 pb-0.5">Home</a>
            <button onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')} className="hover:text-amber-900 transition-colors">Pricing</button>
            <a href="#features" className="hover:text-amber-900 transition-colors">Why TapMenu</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <PWAInstallButton variant="nav" />
            <button
              onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')}
              className="md:hidden px-2.5 py-1.5 text-stone-700 hover:text-stone-950 font-bold transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="px-3.5 sm:px-4 py-1.5 text-stone-800 hover:text-stone-950 font-bold transition-colors border border-stone-300 rounded-full bg-white/80 hover:bg-white shadow-xs"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Full-bleed background with atmospheric vignette */}
      <section id="hero" className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] flex items-center justify-center text-center overflow-hidden bg-stone-900">
        {/* Full-bleed background restaurant hero photography */}
        <img
          src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=2000&q=90"
          alt="Warm Luxury Restaurant Dining Tables"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-105 contrast-105"
        />

        {/* Balanced Light Scrim & Atmospheric Vignette */}
        <div className="absolute inset-0 bg-stone-950/45 sm:bg-stone-950/40 z-2" />
        <div 
          className="absolute inset-0 pointer-events-none z-2"
          style={{
            background: 'radial-gradient(circle at center, rgba(12, 46, 34, 0.35) 0%, rgba(10, 14, 12, 0.75) 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-transparent to-stone-950/45 pointer-events-none z-2" />

        {/* Hero Content directly ON TOP of the background image */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center">
          {/* Luxury Gold & Emerald Medallion Seal */}
          <div className="mb-4 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0c2e22] via-[#144233] to-[#091f17] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.6),0_0_20px_rgba(212,175,55,0.3)]">
              <span className="font-serif font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2A8] via-[#D4AF37] to-[#997715] drop-shadow">
                T
              </span>
            </div>
          </div>

          {/* Subtle Luxury Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] sm:text-xs font-bold mb-4 shadow-xl max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="truncate">Smart NFC &bull; Table QR &bull; Live PWA Kitchen Alerts</span>
          </div>

          {/* Main Headline with Highlighted Gradient Word/Phrase */}
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl mx-auto leading-[1.12] sm:leading-[1.1] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            Turn Dining Tables into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#D4AF37] to-amber-400 italic">
              Realistic 3D Menu Books
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-stone-200/95 max-w-xl mx-auto mt-4 sm:mt-5 leading-relaxed font-normal drop-shadow">
            Zero app downloads. Guests tap an NFC card or scan table QR to flip through an authentic leather menu and order directly to your kitchen.
          </p>

          {/* CTA Buttons side-by-side right on the image */}
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-xl mx-auto w-full">
            <button
              onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-[#D4AF37] hover:bg-[#c59f2e] text-stone-950 font-black rounded-full text-xs sm:text-sm transition-all shadow-xl shadow-black/50 flex items-center justify-center gap-2 active:scale-95 border border-amber-200"
            >
              <span>Create Your Menu Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-xs sm:text-sm border border-white/40 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              Restaurant Portal Login
            </button>

            <PWAInstallButton variant="hero" />
          </div>

          {/* Value Prop Badges */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-stone-300 font-medium">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Direct Table Payments (POS / Cash)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Custom Slug &amp; Signature Folio Color</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero 3rd-Party Payment Withholding</span>
            </div>
          </div>
        </div>

        {/* Angled Accent Ribbon at Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-2.5 bg-gradient-to-r from-[#0c2e22] via-[#D4AF37] to-amber-600 shadow-md z-10" />
      </section>

      {/* 3 Pillars Section with Liquid Glass Cards */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16 border-t border-stone-200">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
            Why Top Restaurants Choose TapMenu
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Built from the ground up for authentic hospitality, higher table turn rates, and total payment autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-4 shadow-xs">
              📖
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Authentic Menu Book</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Not another clinical PDF or generic web form. TapMenu provides a realistic luxury leather folio with realistic turning pages, debossed foil, and category tabs.
            </p>
          </div>

          <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold mb-4 shadow-xs">
              📱
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Tap Digital Card or Scan QR</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Encode durable digital smart table pucks or print scannable QR stand cards. Orders always carry the specific table number straight to the kitchen.
            </p>
          </div>

          <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-4 shadow-xs">
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
              <span className="w-7 h-7 rounded-lg bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center text-xs shadow-sm font-serif font-black">T</span>
              <span>TapMenu Nigeria</span>
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
            &copy; {new Date().getFullYear()} TapMenu Inc. Lagos, Nigeria.
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SIGNUP MODAL (With Custom Slug & Signature Color Picker!) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SIGNUP MODAL (With Custom Slug & Signature Color Picker!) */}
      {/* ========================================================================= */}
      {authModal === 'signup' && (
        <div className="fixed inset-0 bg-stone-950/80 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative text-xs my-auto">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Custom Menu Slug *</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-500 font-mono text-base sm:text-sm">
                  <span>/?r=</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="corner-table"
                    className="w-full bg-transparent text-stone-900 font-bold focus:outline-none ml-1 text-base sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm font-mono font-bold focus:outline-none focus:border-stone-900"
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
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Staff Password *</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2 border border-[#D4AF37]/35 cursor-pointer"
              >
                {loading ? 'Creating Menu Book...' : 'Create My Restaurant Menu →'}
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
        <div className="fixed inset-0 bg-stone-950/80 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative text-xs my-auto">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
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
                <label className="block font-bold text-stone-700 mb-1">Email or Restaurant Slug</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. backyardgrill or manager@email.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                />
                <span className="block text-[11px] text-stone-400 mt-1">Enter your restaurant slug or the owner email address.</span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2 border border-[#D4AF37]/35 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Kitchen →'}
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

      {/* Floating WhatsApp Quick Contact Button (dynamically managed in Platform Admin) */}
      <a
        href={`https://wa.me/${contactConfig.whatsappNumber}?text=${encodeURIComponent(contactConfig.whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white group"
        title={`Chat with TapMenu Support on WhatsApp (+${contactConfig.whatsappNumber})`}
      >
        <span className="sr-only">Chat on WhatsApp</span>
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 fill-current">
          <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 1.969.563 3.813 1.547 5.375L2 22l4.828-1.547A9.94 9.94 0 0 0 12.03 22c5.516 0 10-4.484 10-10s-4.484-10-10-10zm5.953 14.281c-.25.703-1.453 1.344-2 1.406-.547.063-1.25.094-3.641-.89-2.89-1.188-4.734-4.14-4.875-4.329-.14-.187-1.156-1.547-1.156-2.953 0-1.406.734-2.094 1-2.375.25-.281.562-.344.75-.344.187 0 .375 0 .547.016.187 0 .422-.078.656.484.25.594.844 2.062.922 2.219.078.156.125.344.031.547-.094.203-.14.328-.281.5-.14.156-.312.359-.437.484-.14.14-.297.297-.125.594.172.297.766 1.266 1.64 2.047 1.125 1 2.078 1.312 2.375 1.453.297.14.469.125.64-.078.172-.203.75-.875.953-1.172.203-.297.406-.25.688-.14.281.109 1.797.844 2.109 1 .312.156.516.234.594.359.078.141.078.797-.172 1.5z"/>
        </svg>
      </a>
    </div>
  );
};
