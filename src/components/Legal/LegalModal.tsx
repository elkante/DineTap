import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Cookie, Info, Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { getStoredPlatformContact } from '../../utils/supabase';

export type LegalTabType = 'terms' | 'privacy' | 'cookies' | 'about' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTabType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRestaurant, setContactRestaurant] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (!isOpen) return null;

  const contactConfig = getStoredPlatformContact();
  const cleanPhone = contactConfig.whatsappNumber ? contactConfig.whatsappNumber.replace(/[^0-9]/g, '') : '2348000000000';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hello TapMenu! I'd like to get more information about your digital restaurant systems.")}`;

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactRestaurant('');
      setContactMessage('');
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              TM
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">TapMenu Legal & Company</h2>
              <p className="text-[11px] text-neutral-400">Official policies, terms, company vision & support</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1 p-2 bg-neutral-100 border-b border-neutral-200 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'about'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'contact'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'terms'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'privacy'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'cookies'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie Policy</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-neutral-700 text-xs leading-relaxed space-y-4">
          
          {/* TAB: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <h3 className="text-base font-extrabold text-amber-950 mb-1">Empowering Modern Restaurants Across Africa</h3>
                <p className="text-xs text-amber-900">
                  TapMenu is Nigeria's leading restaurant dining technology platform. We eliminate greasy, outdated paper menus and replace them with breathtaking 3D digital flipbooks, tap-and-order Smart Table Cards, and real-time Kitchen Display Systems.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-neutral-900 text-sm mb-1.5">Our Mission</h4>
                <p>
                  To help restaurant owners increase average ticket sizes, slash printing costs to zero, boost staff productivity, and give diners an unforgettable luxury dining experience the moment they take their seats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-2xl mb-1 block">⚡</span>
                  <h5 className="font-bold text-neutral-900 text-xs">0-Second Friction</h5>
                  <p className="text-[11px] text-neutral-500 mt-1">No app downloads required. Diners simply tap their phone on the card or scan the QR code to open the menu instantly.</p>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-2xl mb-1 block">💰</span>
                  <h5 className="font-bold text-neutral-900 text-xs">Direct Payments</h5>
                  <p className="text-[11px] text-neutral-500 mt-1">TapMenu never holds your revenue. All customer payments go 100% directly into the restaurant’s POS, bank account, or cash register.</p>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-2xl mb-1 block">🛡️</span>
                  <h5 className="font-bold text-neutral-900 text-xs">Enterprise Reliability</h5>
                  <p className="text-[11px] text-neutral-500 mt-1">Engineered with offline resilience, audio chimes, PWA home screen installs, and cross-device realtime synchronization.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Contact Info Card */}
                <div className="space-y-3 bg-neutral-900 text-white p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white mb-2">Get in Touch with our Support Team</h3>
                    <p className="text-xs text-neutral-400 mb-4">
                      Have questions about setting up your restaurant, ordering smart cards, or custom enterprise solutions? We are here to help 24/7.
                    </p>

                    <div className="space-y-2.5 text-xs text-neutral-300">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>WhatsApp / Hotline: +234 810 000 0000</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>support@tapmenu.me / billing@tapmenu.me</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Victoria Island, Lagos, Nigeria</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-4"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat with Us on WhatsApp</span>
                  </a>
                </div>

                {/* Direct Inquiry Form */}
                <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200">
                  <h4 className="font-extrabold text-neutral-900 text-sm mb-2">Send an Official Message</h4>
                  
                  {contactSubmitted ? (
                    <div className="py-8 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                      <h5 className="font-bold text-neutral-900 text-sm">Message Delivered!</h5>
                      <p className="text-xs text-neutral-500">Our team will get back to you within 2 business hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitContact} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Restaurant or Lounge Name (Optional)"
                        value={contactRestaurant}
                        onChange={(e) => setContactRestaurant(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                      <textarea
                        rows={3}
                        required
                        placeholder="How can we assist your establishment?"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Inquiry</span>
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="font-extrabold text-neutral-900 text-sm">TapMenu Platform Terms & Conditions (T&C)</h3>
              <p className="text-[11px] text-neutral-400">Effective Date: October 2026</p>

              <div>
                <h4 className="font-bold text-neutral-900">1. Acceptance of Terms</h4>
                <p>By registering, accessing, or utilizing the TapMenu SaaS platform, you agree to be legally bound by these terms. If you do not agree, do not use the service.</p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">2. Subscription Plans, Billing & Due Payments</h4>
                <p>
                  Subscriptions are billed on a monthly or annual cycle in Nigerian Naira (NGN). If a subscription is due:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>A 3-day grace period is provided to allow uninterrupted restaurant service.</li>
                    <li>Following the grace period, administrative dashboard access and ordering features may be temporarily restricted until renewal payment is confirmed.</li>
                    <li>Accounts overdue past 30 days may be subject to suspension.</li>
                  </ul>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">3. Dining Payments & Non-Custodial Guarantee</h4>
                <p>
                  TapMenu is a digital software interface and kitchen workflow system. TapMenu does not process, hold, or escrow customer dining payments. All payments are settled directly between diners and the restaurant establishment via cash, point-of-sale (POS) terminal, or direct bank transfer.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">4. Hardware Smart Cards</h4>
                <p>
                  Custom encoded Smart NFC Cards & Table Stands are provided as physical hardware units. Card orders are fulfilled upon payment confirmation. Restaurants are responsible for the physical safekeeping of tags on dining tables.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">5. Termination & Purging</h4>
                <p>
                  Restaurant owners may terminate their account at any time. When an account is purged by Super Administration upon written request, all restaurant records, menus, orders, and credentials will be permanently erased from active databases.
                </p>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="font-extrabold text-neutral-900 text-sm">Privacy Policy & NDPR Compliance</h3>
              <p className="text-[11px] text-neutral-400">Effective Date: October 2026</p>

              <div>
                <h4 className="font-bold text-neutral-900">1. Information We Collect</h4>
                <p>
                  We collect restaurant profile details (name, slug, logo, contact phone), menu items, and operational order records. For diners, we collect optional customer names and phone numbers solely for ticket tracking and order fulfillment. We never collect or store payment card numbers, CVVs, or bank PINs.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">2. How We Use Information</h4>
                <p>
                  Information is used exclusively to route orders from the table to the restaurant’s kitchen display, send audio alerts, generate daily sales reconciliation summaries, and maintain the platform.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">3. Data Security & Storage</h4>
                <p>
                  Data is transmitted over encrypted HTTPS/TLS channels and stored on secure cloud databases with strict row-level security. We never sell, rent, or distribute tenant data to third-party advertisers.
                </p>
              </div>
            </div>
          )}

          {/* TAB: COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="font-extrabold text-neutral-900 text-sm">Cookie & Local Storage Policy</h3>
              <p className="text-[11px] text-neutral-400">Effective Date: October 2026</p>

              <div>
                <h4 className="font-bold text-neutral-900">1. What are Cookies and Local Storage?</h4>
                <p>
                  TapMenu uses modern browser Local Storage and essential session identifiers to provide lightning-fast, offline-resilient digital menu rendering without page reloading.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">2. Why We Use Local Storage</h4>
                <p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li><strong>Offline Menu Availability:</strong> Stores dishes locally so menus open in 0 milliseconds even if cell service drops inside the dining hall.</li>
                    <li><strong>Kitchen Authentication:</strong> Keeps restaurant owners securely logged in until they choose to log out.</li>
                    <li><strong>Table Identification:</strong> Remembers the active dining table (e.g. Table 4) while the diner browses dishes.</li>
                  </ul>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900">3. No Invasive Tracking</h4>
                <p>We do not use third-party behavioral ad trackers or cross-site surveillance cookies.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px]">© 2026 TapMenu Technologies. All rights reserved.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
