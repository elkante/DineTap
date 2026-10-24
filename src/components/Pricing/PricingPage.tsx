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
import { getStoredPlans, PlanTier } from '../../utils/pricingConfig';

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

  const plans: PlanTier[] = getStoredPlans();

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
              T
            </div>
            <div>
              <span className="font-serif font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">TapMenu</span>
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
          <span>Transparent Nigerian Pricing &middot; 0% Per-Order Commissions &middot; Instant Setup</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto text-stone-900 leading-tight">
          Simple, Predictable Plans for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 italic">Every Restaurant in Nigeria</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mt-4 leading-relaxed">
          No app downloads for diners. No 20–30% delivery commission deductions. Pay a simple flat monthly rate and keep 100% of your diner bills directly at the table.
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
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wide">
              2 Mos Free + Free Cards
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid (4 Tiers) */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map((p) => {
            const price = isAnnual ? p.annualPrice : p.monthlyPrice;
            const isHighlighted = p.recommended || p.id === 'standard';

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 relative ${
                  isHighlighted
                    ? 'bg-[#0c2e22] text-white border-2 border-[#D4AF37] shadow-xl md:-translate-y-1'
                    : 'bg-white text-stone-900 border border-stone-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Ribbon */}
                {p.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md ${
                      isHighlighted
                        ? 'bg-[#D4AF37] text-neutral-950'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    ★ {p.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-serif text-lg font-bold ${isHighlighted ? 'text-amber-200' : 'text-stone-900'}`}>
                      {p.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        isHighlighted
                          ? 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.maxTables ? `${p.maxTables} Tables` : 'Unlimited Tables'}
                    </span>
                  </div>

                  <p className={`text-xs mb-5 min-h-[32px] ${isHighlighted ? 'text-stone-300' : 'text-stone-500'}`}>
                    {p.tagline}
                  </p>

                  <div className={`mb-5 pb-5 border-b ${isHighlighted ? 'border-white/15' : 'border-stone-100'}`}>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-mono ${isHighlighted ? 'text-[#D4AF37]' : 'text-stone-900'}`}>
                        ₦{price.toLocaleString()}
                      </span>
                      <span className={`text-xs font-medium ${isHighlighted ? 'text-stone-300' : 'text-stone-500'}`}>
                        /{isAnnual ? 'yr' : 'mo'}
                      </span>
                    </div>
                    {isAnnual && (
                      <div className="mt-2.5 space-y-1">
                        <p className={`text-[11px] font-bold ${isHighlighted ? 'text-amber-300' : 'text-emerald-700'}`}>
                          ~₦{Math.round(price / 12).toLocaleString()}/mo &middot; Pay for 10 mos, get 12
                        </p>
                        {p.annualIncentive && (
                          <div className={`p-2 rounded-xl text-[10px] font-semibold border ${
                            isHighlighted
                              ? 'bg-amber-400/15 border-amber-400/30 text-amber-200'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            🎁 {p.annualIncentive}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`space-y-2.5 text-xs mb-6 ${isHighlighted ? 'text-stone-200' : 'text-stone-700'}`}>
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHighlighted ? 'text-[#D4AF37]' : 'text-emerald-600'}`} />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onOpenSignup}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 ${
                    isHighlighted
                      ? 'bg-[#D4AF37] hover:bg-[#e6c148] text-neutral-950 font-black'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  Choose {p.name} &rarr;
                </button>
              </div>
            );
          })}
        </div>
      </section>



      {/* Comparison Table */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            How TapMenu Compares
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Why leading Nigerian restaurateurs are swapping out paper menus and food aggregators.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-[#0c2e22] font-bold text-xs bg-amber-50/50">TapMenu</th>
                  <th className="p-4 sm:p-5">Paper Laminated Menus</th>
                  <th className="p-4 sm:p-5">Delivery Apps (Chowdeck, Glovo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-stone-900">Commission Per Order</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-amber-50/30">0% (Keep 100%)</td>
                  <td className="p-4 sm:p-5">0%</td>
                  <td className="p-4 sm:p-5 text-red-600 font-semibold">20% – 30% per order</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-stone-900">Price Updates & Sold Out</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-amber-50/30">Instant in 3 seconds</td>
                  <td className="p-4 sm:p-5 text-red-600">Re-print full books (₦150k+)</td>
                  <td className="p-4 sm:p-5">Slow back-office approval</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-stone-900">Diner Experience</td>
                  <td className="p-4 sm:p-5 font-bold text-[#0c2e22] bg-amber-50/30">Realistic 3D Leather Flipbook</td>
                  <td className="p-4 sm:p-5">Greasy paper folios</td>
                  <td className="p-4 sm:p-5">Generic utilitarian lists</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-stone-900">Payment Collection</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-amber-50/30">Direct POS terminal / Cash / Transfer</td>
                  <td className="p-4 sm:p-5">Staff POS / Cash</td>
                  <td className="p-4 sm:p-5 text-stone-500">Funds withheld 7-14 days</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-stone-900">App Download Needed?</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 bg-amber-50/30">None (Scan or Tap & Open)</td>
                  <td className="p-4 sm:p-5">None</td>
                  <td className="p-4 sm:p-5 text-stone-500">Requires diner app download</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Everything you need to know about setting up TapMenu in your venue.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {[
            {
              q: 'How does table payment work? Do you take a percentage of our food sales?',
              a: 'No. TapMenu charges ZERO commission on orders. When diners select "Card Payment", your waiter brings your normal restaurant bank POS terminal to the table. If they select "Instant Transfer", your staff gives them your account details. TapMenu is pure software to accelerate table turn and service.'
            },
            {
              q: 'Can we change dish prices or mark items sold out during rush hours?',
              a: 'Yes, in 3 seconds. The kitchen or manager can tap "Sold Out" on any item from their mobile phone or kitchen screen, and it immediately reflects across all live diner phones currently viewing the menu book.'
            },
            {
              q: 'Do diners need an iPhone or NFC to view the menu?',
              a: 'No! Every table stand card has both an instant NFC chip for modern phones AND a high-contrast QR code that works on any Android or iPhone camera.'
            },
            {
              q: 'How do we upgrade or change plans if our restaurant expands?',
              a: 'You can upgrade from Basic to Standard or Premium at any time as you add more dining tables, VIP lounges, or rooftop sections.'
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all shadow-xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-stone-900 flex items-center justify-between gap-3 hover:text-amber-900"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-amber-800' : 'text-stone-400'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0c2e22] text-white rounded-3xl p-8 sm:p-12 border-2 border-[#D4AF37] relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#D4AF37] font-bold block mb-2">
              LAUNCH IN 60 SECONDS
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-white">
              Give Your Guests a Luxury Dining Experience
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-3 leading-relaxed">
              Create your signature digital menu book today. Test with your staff for free, then order your table cards whenever you are ready.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenSignup}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#D4AF37] hover:bg-[#e6c148] text-neutral-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                Create Restaurant Menu Free &rarr;
              </button>
              <button
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-stone-200 font-bold rounded-xl text-xs border border-white/20 transition-colors"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 bg-white text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif font-bold text-stone-800">
            <span className="w-6 h-6 rounded-lg bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center text-xs font-serif font-black">T</span>
            <span>TapMenu Nigeria &middot; Luxury Restaurant Platform</span>
          </div>
          <div>&copy; {new Date().getFullYear()} TapMenu Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
