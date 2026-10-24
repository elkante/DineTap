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

const COLOR_PRESETS = [
  { name: 'Emerald Leather', hex: '#0c2e22', border: '#D4AF37', label: 'The Corner Table' },
  { name: 'Burgundy Wine', hex: '#4a0e17', border: '#D4AF37', label: 'Classic Luxury' },
  { name: 'Midnight Navy', hex: '#0f172a', border: '#eab308', label: 'Modern Lounge' },
  { name: 'Espresso Leather', hex: '#2b1810', border: '#f59e0b', label: 'Steakhouse' },
  { name: 'Warm Terracotta', hex: '#7c2d12', border: '#f59e0b', label: 'Mediterranean' },
  { name: 'Charcoal Slate', hex: '#1f2421', border: '#d97706', label: 'Urban Bistro' },
];

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
  const [chosenColor, setChosenColor] = useState('#0c2e22');
  const [previewColor, setPreviewColor] = useState('#0c2e22');

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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Navbar */}
      <nav className="border-b border-stone-200/80 sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center font-serif font-black text-xl shadow-md border border-[#D4AF37]/40">
              D
            </div>
            <div>
              <span className="font-serif font-extrabold text-xl tracking-tight text-stone-900">DineTap</span>
              <span className="text-[10px] block text-amber-800 font-mono -mt-1 uppercase tracking-wider font-bold">Luxury Digital Menus</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
              className="px-4 py-2 text-stone-700 hover:text-stone-950 font-bold transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
              className="px-5 py-2.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl transition-all shadow-md active:scale-95 border border-[#D4AF37]/30"
            >
              Create Menu Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-16 text-center">
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-300/80 text-[11px] font-bold text-amber-900 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Interactive Luxury Flipbook Menus &middot; NTAG213 NFC &middot; Direct Table Ordering</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.15] text-stone-900">
          Turn Your Dining Tables into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 italic">Luxury Digital Books</span> & Direct Orders.
        </h1>

        <p className="text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto mt-6 leading-relaxed">
          Zero app downloads for diners. Customers tap an NFC tag or scan table QR code, browse a realistic leather-bound flipbook menu, and order straight to your kitchen.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <button
            onClick={() => { setAuthModal('signup'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-7 py-4 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-2xl text-sm transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-2 active:scale-95 border border-[#D4AF37]/35"
          >
            <span>Create Your Restaurant Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setAuthModal('login'); setErrorMsg(null); }}
            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-2xl text-sm border border-stone-300 transition-colors shadow-xs"
          >
            Restaurant Portal Login
          </button>
        </div>

        {/* Value Prop Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-600 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Direct Table Payments (POS / Cash)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Custom Slug & Signature Book Color</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero 3rd-Party Payment Withholding</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE LUXURY MENU BOOK PREVIEW WITH COLOR PALETTE SWITCHER */}
        {/* ========================================================================= */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-stone-100/70 border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Color Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
              <div className="text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Live Menu Book Customizer</span>
                <span className="text-sm font-bold text-stone-800">Choose your restaurant's signature cover leather:</span>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.hex}
                    onClick={() => setPreviewColor(preset.hex)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all border-2 flex items-center justify-center ${
                      previewColor === preset.hex ? 'scale-110 shadow-md ring-2 ring-amber-400' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                    title={preset.name}
                  >
                    {previewColor === preset.hex && (
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* The Luxury Book Graphic */}
            <div className="flex items-center justify-center py-4">
              <div 
                className="w-full max-w-xs sm:max-w-sm h-[440px] sm:h-[500px] rounded-[28px] p-4 relative shadow-2xl transition-colors duration-500 flex flex-col justify-between text-center select-none"
                style={{
                  backgroundColor: previewColor,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45), 2px 2px 0 #ede8db, 4px 4px 0 #e0d9c8, 6px 6px 0 #d5ccb8',
                  border: '2px solid rgba(212, 175, 55, 0.45)'
                }}
              >
                {/* Book Spine Shadow on Left */}
                <div 
                  className="absolute top-3 bottom-3 left-2 w-5 z-20 pointer-events-none rounded-l-md"
                  style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }}
                />

                {/* Stitched Gold Perimeter */}
                <div className="absolute inset-3 border-2 border-dashed border-[#D4AF37]/55 rounded-2xl pointer-events-none z-10" />

                {/* Brass Corner Braces in 4 corners */}
                <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-lg pointer-events-none z-20" />
                <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-lg pointer-events-none z-20" />
                <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-lg pointer-events-none z-20" />
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37] rounded-br-lg pointer-events-none z-20" />

                <div className="pt-6" />

                {/* Center Crest & Gold Title */}
                <div className="relative z-10 px-4 my-auto">
                  <div className="w-12 h-14 mx-auto mb-3 flex items-center justify-center">
                    <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]" fill="none">
                      <path d="M50 5 L90 25 L90 70 C90 95 50 115 50 115 C50 115 10 95 10 70 L10 25 Z" stroke="#D4AF37" strokeWidth="3" fill="rgba(212,175,55,0.1)"/>
                      <path d="M50 20 L50 90 M25 55 L75 55" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="50" cy="55" r="4.5" fill="#D4AF37"/>
                    </svg>
                  </div>

                  <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C0] via-[#D4AF37] to-[#A07818]">
                    Your Restaurant
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E8C868] mt-2">
                    KITCHEN & BAR
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3 max-w-[140px] mx-auto opacity-75">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]" />
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]" />
                  </div>
                </div>

                {/* Bottom Prompt */}
                <div className="relative z-10 pb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
                    TAP OR SWIPE TO OPEN
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom floating pill preview */}
            <div className="max-w-sm mx-auto mt-4">
              <div className="bg-[#121614] rounded-full py-2 px-4 border border-[#D4AF37]/35 flex items-center justify-between text-xs text-stone-300">
                <span className="font-bold text-amber-200">&lsaquo; Prev</span>
                <span className="text-amber-200 font-bold">Contents</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-stone-950 font-bold text-[11px]">Starters</span>
                <span className="text-stone-300">Mains</span>
                <span className="font-bold text-amber-200">Next &rsaquo;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-stone-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
            Why Top Restaurants Choose DineTap
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Built from the ground up for authentic hospitality, higher table turn rates, and total payment autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-4">
              📖
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Authentic Menu Book</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Not another boring, clinical PDF or web form. DineTap provides a realistic luxury leather folio with 3D turning pages, debossed foil, and bookmark category tabs.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold mb-4">
              📱
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Tap NFC or Scan QR</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Program inexpensive NTAG213 table pucks or print scannable QR stand cards. Orders always carry the specific table number straight to the kitchen.
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
      <footer className="border-t border-stone-200 py-10 bg-white text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif font-bold text-stone-800">
            <span className="w-6 h-6 rounded-lg bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center text-xs">D</span>
            <span>DineTap &middot; Luxury Restaurant Dining Platform</span>
          </div>
          <div>&copy; {new Date().getFullYear()} DineTap. All rights reserved.</div>
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

              {/* Signature Book Color Picker (As requested by user!) */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Signature Menu Book Color</label>
                <div className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => setChosenColor(preset.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        chosenColor === preset.hex ? 'scale-110 ring-2 ring-amber-400 shadow-md' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                      title={preset.name}
                    />
                  ))}
                  <div className="h-5 w-[1px] bg-stone-300 mx-1" />
                  <input
                    type="color"
                    value={chosenColor}
                    onChange={(e) => setChosenColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Pick custom hex color"
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
