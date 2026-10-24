import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  Store, 
  Smartphone, 
  Zap, 
  X, 
  Printer, 
  CreditCard,
  ChevronDown
} from 'lucide-react';

interface PricingPageProps {
  onBackToHome: () => void;
  onOpenSignup: () => void;
  onOpenLogin: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToHome,
  onOpenSignup,
  onOpenLogin,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const isAnnual = billingCycle === 'annual';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Navbar */}
      <nav className="border-b border-stone-200/80 sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center font-serif font-black text-xl shadow-md border border-[#D4AF37]/40">
              D
            </div>
            <div>
              <span className="font-serif font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">DineTap</span>
              <span className="text-[10px] block text-amber-800 font-mono -mt-1 uppercase tracking-wider font-bold">Luxury Digital Menus</span>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <button
              onClick={onBackToHome}
              className="hidden sm:inline-block text-stone-600 hover:text-stone-900 font-bold transition-colors"
            >
              ← Back to Overview
            </button>
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-stone-700 hover:text-stone-950 font-bold transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onOpenSignup}
              className="px-4 sm:px-5 py-2.5 bg-[#0c2e22] hover:bg-[#124231] text-[#D4AF37] font-bold rounded-xl transition-all shadow-md active:scale-95 border border-[#D4AF37]/30"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 sm:pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-300 text-[11px] font-bold text-amber-900 mb-5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Transparent Pricing &middot; 0% Per-Order Commissions &middot; Made for Nigeria</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto text-stone-900 leading-tight">
          Simple, Predictable Plans for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 italic">Every Dining Room</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mt-4 leading-relaxed">
          No app downloads for diners. No 20–30% delivery commission deductions. Pay once for your table cards and choose a monthly plan that keeps 100% of your revenue in your pocket.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="mt-8 inline-flex items-center p-1 bg-stone-200/70 rounded-2xl border border-stone-300">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-[#0c2e22] text-[#D4AF37] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[10px] font-black uppercase">
              Save 17%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* TIER 1: Starter */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">Starter</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold">
                  Cafes & Small Bistros
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-6">
                Ideal for intimate dining spots, bakeries, shisha lounges, and coffee houses.
              </p>

              <div className="mb-6 pb-6 border-b border-stone-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900">
                    ₦{isAnnual ? '250,000' : '25,000'}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Equivalent to ~₦20,800/mo (2 months free)
                  </p>
                )}
              </div>

              <div className="space-y-3 text-xs text-stone-700 mb-8">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Up to 10 Tables</strong> & unique QR/NFC links</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Realistic 3D Flipbook Menu</strong> with sound & animations</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Dishes & Device Photos</strong> upload</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Waiter Calling Buzzer</strong> (Water, Bill, Assistance)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>0% Commission</strong>: direct POS or cash table billing</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSignup}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
            >
              Start Free Trial
            </button>
          </div>

          {/* TIER 2: Growth (Most Popular) */}
          <div className="bg-[#0c2e22] text-white rounded-3xl border-2 border-[#D4AF37] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            {/* Ribbon Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-neutral-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
              ★ Most Popular for Restaurants
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <h3 className="font-serif text-lg font-bold text-amber-200">Growth</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] text-[11px] font-bold border border-[#D4AF37]/30">
                  Full Service Restaurants
                </span>
              </div>
              <p className="text-xs text-stone-300 mb-6">
                For busy dining rooms, rooftop grills, cocktail lounges, and beach houses.
              </p>

              <div className="mb-6 pb-6 border-b border-white/15">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#D4AF37]">
                    ₦{isAnnual ? '500,000' : '50,000'}
                  </span>
                  <span className="text-xs text-stone-300 font-medium">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-[11px] text-amber-300 font-semibold mt-1">
                    Equivalent to ~₦41,600/mo (Save ₦100,000)
                  </p>
                )}
              </div>

              <div className="space-y-3 text-xs text-stone-200 mb-8">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Up to 30 Tables</strong> & per-table digital links</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Live Kitchen Display System (KDS)</strong> with chimes</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Signature Leather Colors</strong> (Emerald, Burgundy, Navy, Slate)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Real-time "Sold Out" Toggle</strong> & instant price updates</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Dedicated URL Slug</strong>: dinetap.com/?r=your-slug</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span><strong>Priority WhatsApp & Phone Support</strong> in Nigeria</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSignup}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black transition-all shadow-lg active:scale-98"
            >
              Get Started with Growth
            </button>
          </div>

          {/* TIER 3: Enterprise / VIP */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">Enterprise</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold">
                  Large Venues & Chains
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-6">
                For multi-level restaurants, hotel food services, and expanding multi-branch groups.
              </p>

              <div className="mb-6 pb-6 border-b border-stone-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900">
                    ₦{isAnnual ? '900,000' : '90,000'}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Equivalent to ₦75,000/mo (Save ₦180,000)
                  </p>
                )}
              </div>

              <div className="space-y-3 text-xs text-stone-700 mb-8">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Tables</strong> & unlimited QR/NFC points</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Multi-Branch & Multi-Kitchen</strong> synchronization</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Custom Domain Support</strong> (menu.yourrestaurant.com)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Account Manager</strong> & on-site staff training</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>First 15 Acrylic Stand Cards</strong> custom printed free</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSignup}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
            >
              Contact for Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* Hardware & Table Stands Add-on Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                Physical Hardware Add-on
              </span>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                Luxury Acrylic Table Stand Cards
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                We manufacture and program custom, scratch-resistant acrylic table standees with embedded digital card chips and gold-accented QR codes for your restaurant.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-extrabold font-mono text-stone-900 block">₦5,000</span>
              <span className="text-[11px] text-stone-500">per table stand card</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-900 block mb-1">10x Table Stands Pack</span>
              <span className="text-lg font-mono font-bold text-amber-900 block mb-1">₦45,000</span>
              <p className="text-[11px] text-stone-500">Pre-programmed with tables 1 to 10 with custom logo print.</p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-950 block mb-1">25x Table Stands Pack</span>
              <span className="text-lg font-mono font-bold text-amber-900 block mb-1">₦95,000</span>
              <p className="text-[11px] text-stone-600">Standard restaurant dining room pack with free shipping in Lagos.</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-900 block mb-1">50x Table Stands Pack</span>
              <span className="text-lg font-mono font-bold text-amber-900 block mb-1">₦175,000</span>
              <p className="text-[11px] text-stone-500">Large indoor & outdoor venue package with priority dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Comparison Section */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-serif text-2xl font-bold text-stone-900 text-center mb-6">
          Why DineTap Saves You Real Money
        </h2>

        <div className="overflow-x-auto bg-white rounded-3xl border border-stone-200 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
              <tr>
                <th className="py-4 px-6">Feature / Metric</th>
                <th className="py-4 px-6 text-[#0c2e22] font-black">DineTap Digital Book</th>
                <th className="py-4 px-6 text-stone-500">Traditional Paper Menus</th>
                <th className="py-4 px-6 text-stone-500">3rd-Party Delivery Platforms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="py-3.5 px-6 font-bold text-stone-900">Per-Order Commission</td>
                <td className="py-3.5 px-6 font-bold text-emerald-700">0% (You keep 100%)</td>
                <td className="py-3.5 px-6 text-stone-500">0%</td>
                <td className="py-3.5 px-6 text-red-600 font-bold">20% – 30% per order</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-stone-900">Reprinting / Replacement Cost</td>
                <td className="py-3.5 px-6 font-bold text-emerald-700">₦0 (Update instantly on phone)</td>
                <td className="py-3.5 px-6 text-stone-600 font-medium">₦80k – ₦150k every few months</td>
                <td className="py-3.5 px-6 text-stone-500">N/A</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-stone-900">Price Adjustments & Sold Out</td>
                <td className="py-3.5 px-6 font-bold text-emerald-700">5 seconds from kitchen phone</td>
                <td className="py-3.5 px-6 text-red-600">Cross out with pen / delay</td>
                <td className="py-3.5 px-6 text-stone-500">Delayed approval</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-stone-900">App Download Required?</td>
                <td className="py-3.5 px-6 font-bold text-emerald-700">No (Opens instantly in browser)</td>
                <td className="py-3.5 px-6 text-stone-500">No</td>
                <td className="py-3.5 px-6 text-red-600">Yes (Heavy 80MB app)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-stone-900">Table Identification</td>
                <td className="py-3.5 px-6 font-bold text-emerald-700">Exact table tagged automatically</td>
                <td className="py-3.5 px-6 text-stone-500">Manual waiter handwriting</td>
                <td className="py-3.5 px-6 text-stone-500">Delivery address only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 text-center mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-stone-500 text-center mb-8">
          Everything you need to know about setting up DineTap in your restaurant.
        </p>

        <div className="space-y-3">
          {[
            {
              q: "Do diners need to install any mobile application?",
              a: "Zero app downloads required. When customers tap the digital table card or scan the QR code with their phone camera, the luxury menu opens instantly in Safari or Chrome in under 1 second."
            },
            {
              q: "How do table orders get paid?",
              a: "DineTap does not touch or withhold your customer payments. When a customer places an order, it arrives on your Kitchen Display labeled with their exact table number. Your waitstaff collects 100% of the funds directly via your existing restaurant POS terminal or cash at the table."
            },
            {
              q: "What phones support tapping the digital cards?",
              a: "All modern iPhones (iPhone XR, XS, 11, 12, 13, 14, 15, 16) and virtually all Android phones have built-in NFC tap enabled natively. Every table stand also comes with a sharp, gold-accented QR code as an immediate backup for older devices."
            },
            {
              q: "Can my kitchen staff change prices or mark sold-out items during dinner rush?",
              a: "Yes. From the Kitchen Management portal on any smartphone or tablet, staff can toggle any dish as 'Sold Out' or change its price in one tap. Every customer currently browsing the menu at any table sees the change reflected instantly without refreshing."
            },
            {
              q: "Can I use DineTap on my own existing QR code stands?",
              a: "Yes! Every table in your DineTap dashboard gives you a direct link and downloadable QR code. You can use your own stands, or order our pre-programmed luxury UV acrylic table stands."
            },
            {
              q: "Can I customize the menu book with my restaurant's colors and logo?",
              a: "Absolutely. In your dashboard Settings, you can choose from 6 signature leather cover textures (Emerald Green, Burgundy Velvet, Midnight Navy, Espresso Leather, Warm Terracotta, or Charcoal Slate) or use a custom color picker, along with uploading your own logo."
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-stone-900 text-xs sm:text-sm hover:bg-stone-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-amber-700' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-[#0c2e22] text-white rounded-3xl p-8 sm:p-12 text-center border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-amber-200">
              Ready to Upgrade Your Dining Room?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-3 leading-relaxed">
              Join upscale restaurants across Nigeria using DineTap to impress diners, speed up table turns, and cut paper menu costs forever.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-amber-400 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-xl active:scale-95"
              >
                Create Your Restaurant Menu Free
              </button>
              <button
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/15 text-stone-200 font-bold rounded-2xl text-xs sm:text-sm transition-colors border border-white/20"
              >
                Back to Live Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 bg-[#FAF7F2] text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-stone-900">DineTap</span>
            <span>&middot; Luxury Digital Menu & Table Ordering SaaS</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={onBackToHome} className="hover:text-stone-900">Home</button>
            <a href="/?admin=true" className="hover:text-amber-800 font-semibold">Platform Admin</a>
            <span>&copy; {new Date().getFullYear()} DineTap</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
