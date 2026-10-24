import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuTemplateId } from '../../types';
import { TEMPLATE_PRESETS } from '../../data/initialData';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Nfc, 
  TrendingUp, 
  Plus, 
  ExternalLink, 
  AlertCircle,
  Package,
  CreditCard,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { 
    restaurants, 
    toggleTenantStatus, 
    switchRestaurant, 
    setCurrentView,
    createNewTenant 
  } = useApp();

  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantTemplate, setNewTenantTemplate] = useState<MenuTemplateId>('nigerian');

  const totalTenants = restaurants.length;
  const totalTables = restaurants.reduce((sum, r) => sum + r.tables.length, 0);
  const totalTaps = restaurants.reduce((sum, r) => sum + r.tables.reduce((tSum, t) => tSum + t.totalTaps, 0), 0);
  const totalScans = restaurants.reduce((sum, r) => sum + r.tables.reduce((tSum, t) => tSum + t.totalScans, 0), 0);

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    createNewTenant(newTenantName.trim(), newTenantTemplate);
    setNewTenantName('');
    setIsNewTenantModalOpen(false);
    setCurrentView('editor');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Platform Super Admin Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 shrink-0"
            title="Back to menu"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-800" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">
              DineTap Super-Admin
            </h1>
            <p className="text-[11px] text-neutral-500">
              {totalTenants} restaurants · {totalTables} NFC tables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('flipbook')}
            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold"
          >
            ← Menu
          </button>
          <button
            onClick={() => setIsNewTenantModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Onboard</span>
          </button>
        </div>
      </div>

      {/* Platform KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Restaurants</span>
          <span className="text-2xl font-bold font-mono text-neutral-900 mt-1 block">{totalTenants}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">100% active operational</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">NFC Tables Deployed</span>
          <span className="text-2xl font-bold font-mono text-neutral-900 mt-1 block">{totalTables}</span>
          <span className="text-[11px] text-neutral-500 mt-1 block">NTAG213 physical chips</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total NFC Taps</span>
          <span className="text-2xl font-bold font-mono text-amber-800 mt-1 block">{totalTaps.toLocaleString()}</span>
          <span className="text-[11px] text-neutral-500 mt-1 block">Direct smartphone touches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Monthly Recurring ARR</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">₦1,420,000</span>
          <span className="text-[11px] text-neutral-500 mt-1 block">SaaS subscriptions</span>
        </div>
      </div>

      {/* All Registered Restaurants Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">Registered Restaurant Tenants ({totalTenants})</h2>
          <span className="text-xs text-neutral-500">PostgreSQL Tenant Isolation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Slug & URL</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Template Style</th>
                <th className="py-3 px-4">Tables / NFC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1 bg-neutral-100 rounded-lg">{r.logo}</span>
                      <div>
                        <div className="font-bold text-neutral-900">{r.name}</div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-xs">{r.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                    /m/{r.slug}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-900 font-semibold rounded-md text-[11px]">
                      {r.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize text-neutral-700">
                    {r.design.templateId.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-700">
                    {r.tables.length} tables · {r.pages.length} pages
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                      r.status === 'active' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      {r.status === 'active' ? 'Operational' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => {
                        switchRestaurant(r.id);
                        setCurrentView('editor');
                      }}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded font-medium text-[11px]"
                    >
                      Open Editor
                    </button>
                    <button
                      onClick={() => toggleTenantStatus(r.id)}
                      className="px-2 py-1 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded text-[11px]"
                    >
                      {r.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Plans & Hardware Orders Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Tiers */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">Subscription Plans Architecture</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 border border-neutral-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-neutral-900">Starter Digital Menu</div>
                <div className="text-neutral-500 text-[11px]">Up to 3 pages · QR Menu · 0% Commission</div>
              </div>
              <span className="font-mono font-bold text-neutral-900">₦0 / mo</span>
            </div>

            <div className="p-3 border border-amber-300 bg-amber-50/40 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-950">Growth QR + Table Ordering</div>
                <div className="text-neutral-600 text-[11px]">Unlimited pages · Table ordering · Kitchen KDS</div>
              </div>
              <span className="font-mono font-bold text-amber-900">₦25,000 / mo</span>
            </div>

            <div className="p-3 border border-neutral-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-neutral-900">Pro NTAG213 NFC Suite</div>
                <div className="text-neutral-500 text-[11px]">NFC tag programming · Acrylic stands · Multi-branch</div>
              </div>
              <span className="font-mono font-bold text-neutral-900">₦65,000 / mo</span>
            </div>
          </div>
        </div>

        {/* NTAG213 Hardware Logistics */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-neutral-900">NTAG213 Hardware Fulfillment</h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Restaurants order pre-encoded and custom-branded NTAG213 table stands through the platform, generating physical product revenue.
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-neutral-50 rounded-lg flex items-center justify-between">
              <span className="font-sans text-neutral-700">25x Clear Acrylic Tent Stands</span>
              <span className="text-emerald-700 font-bold">₦45,000 / pack</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-lg flex items-center justify-between">
              <span className="font-sans text-neutral-700">50x Waterproof Epoxy NFC Stickers</span>
              <span className="text-emerald-700 font-bold">₦35,000 / pack</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-lg flex items-center justify-between">
              <span className="font-sans text-neutral-700">10x Solid Mahogany Laser-Etched Blocks</span>
              <span className="text-emerald-700 font-bold">₦75,000 / pack</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Onboard New Restaurant Tenant */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">Onboard New Restaurant Tenant</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Instantly provisions a private dashboard, public digital flipbook URL, and NTAG213 table registry.
            </p>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suya Kingdom or Lekki Bistro"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Select Starting Design Template</label>
                <select
                  value={newTenantTemplate}
                  onChange={(e) => setNewTenantTemplate(e.target.value as MenuTemplateId)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                >
                  <option value="nigerian">Nigerian Bistro & Eatery (Warm Terracotta)</option>
                  <option value="luxury">Luxury Dining & Lounge (Obsidian & Gold)</option>
                  <option value="grill_bbq">Grill & Suya Smokehouse (Charcoal & Flame)</option>
                  <option value="fast_food">Fast Casual & Burgers (Bold Punchy)</option>
                  <option value="cafe">Artisan Café & Bakery (Warm Kraft)</option>
                  <option value="modern_minimal">Modern Minimalist (Architectural Sans)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  Provision Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
