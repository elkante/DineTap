import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  X
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
      <nav className="border-b border-stone-200/80 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
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

          {/* Center Navigation Links (Tablet/Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-stone-600">
            <a href="#hero" className="text-amber-900 border-b-2 border-amber-900 pb-0.5">Home</a>
            <button onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')} className="hover:text-amber-900 transition-colors">Pricing</button>
            <a href="#features" className="hover:text-amber-900 transition-colors">Why DineTap</a>
            <button onClick={() => { setAuthModal('login'); setErrorMsg(null); }} className="hover:text-amber-900 transition-colors">Kitchen KDS</button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs">
            <button
              onClick={() => onOpenPricing ? onOpenPricing() : (window.location.search = '?page=pricing')}
              className="md:hidden px-2.5 py-1.5 text-stone-700 hover:text-stone-950 font-bold transition-colors"
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
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-extrabold rounded-full transition-all shadow-md active:scale-95 border border-[#D4AF37]/40 text-xs flex items-center gap-1 whitespace-nowrap"
            >
              <span>Create Menu Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Full-bleed background image with text directly overlaying it */}
      <section id="hero" className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] flex items-center justify-center text-center overflow-hidden bg-stone-950">
        {/* Full-bleed background restaurant hero photography */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85"
          alt="Luxury Restaurant Dining Scene"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105"
        />

        {/* Dark Scrim & Atmosphere Gradient Overlays for High Text Contrast */}
        <div className="absolute inset-0 bg-stone-950/75 sm:bg-stone-950/70" />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(12, 46, 34, 0.55) 0%, rgba(10, 14, 12, 0.88) 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/80 pointer-events-none" />

        {/* Hero Content directly ON TOP of the background image */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center">
          {/* Subtle Luxury Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] sm:text-xs font-bold mb-6 shadow-xl max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="truncate">Digital Smart Cards &bull; Instant QR &bull; Direct Table Orders</span>
          </div>

          {/* Main Headline with Highlighted Gradient Word/Phrase */}
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.14] sm:leading-[1.12] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            Turn Dining Tables into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#D4AF37] to-amber-400 italic">
              Luxury Digital Books
            </span>{' '}
            &amp; Direct Orders
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-stone-200/90 max-w-2xl mx-auto mt-5 sm:mt-6 leading-relaxed font-normal drop-shadow">
            Zero app downloads for diners. Customers tap an NFC card or scan table QR code, browse a realistic leather-bound flipbook menu, and order straight to your kitchen.
          </p>

          {/* CTA Buttons side-by-side right on the image */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto w-full">
            <button
              onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-[#D4AF37] hover:bg-[#c59f2e] text-stone-950 font-black rounded-full text-xs sm:text-sm transition-all shadow-xl shadow-black/50 flex items-center justify-center gap-2 active:scale-95 border border-amber-200"
            >
              <span>Create Your Menu Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-xs sm:text-sm border border-white/40 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              Restaurant Portal Login
            </button>
          </div>

          {/* Value Prop Badges */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-stone-300 font-medium">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Direct Table Payments (POS / Cash)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Custom Slug & Signature Folio Color</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero 3rd-Party Payment Withholding</span>
            </div>
          </div>
        </div>

        {/* Angled Accent Ribbon at Bottom Edge (Like the reference screenshot's vibrant accent band) */}
        <div className="absolute bottom-0 left-0 right-0 h-2 sm:h-2.5 bg-gradient-to-r from-[#0c2e22] via-[#D4AF37] to-amber-600 shadow-md z-10" />
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

      {/* Floating WhatsApp Quick Contact Button (matches screenshot) */}
      <a
        href="https://wa.me/2348000000000?text=Hello%20DineTap%20Team!%20I'd%20like%20to%20learn%20more%20about%20digital%20menus%20for%20my%20restaurant."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white"
        title="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 fill-current">
          <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 1.969.563 3.813 1.547 5.375L2 22l4.828-1.547A9.94 9.94 0 0 0 12.03 22c5.516 0 10-4.484 10-10s-4.484-10-10-10zm5.953 14.281c-.25.703-1.453 1.344-2 1.406-.547.063-1.25.094-3.641-.89-2.89-1.188-4.734-4.14-4.875-4.329-.14-.187-1.156-1.547-1.156-2.953 0-1.406.734-2.094 1-2.375.25-.281.562-.344.75-.344.187 0 .375 0 .547.016.187 0 .422-.078.656.484.25.594.844 2.062.922 2.219.078.156.125.344.031.547-.094.203-.14.328-.281.5-.14.156-.312.359-.437.484-.14.14-.297.297-.125.594.172.297.766 1.266 1.64 2.047 1.125 1 2.078 1.312 2.375 1.453.297.14.469.125.64-.078.172-.203.75-.875.953-1.172.203-.297.406-.25.688-.14.281.109 1.797.844 2.109 1 .312.156.516.234.594.359.078.141.078.797-.172 1.5z"/>
        </svg>
      </a>
    </div>
  );
};
