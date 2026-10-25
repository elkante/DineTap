import React, { useState } from 'react';
import { X, Store, Lock, ArrowRight, Plus, CheckCircle2, Building, Sparkles, ExternalLink } from 'lucide-react';
import { RestaurantTenant } from '../../types';
import { useApp } from '../../context/AppContext';

interface MultiStoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing?: () => void;
}

export const MultiStoreManagerModal: React.FC<MultiStoreManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing
}) => {
  const { restaurants, activeRestaurant, switchRestaurant, showNotification } = useApp();
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Lekki Phase 1, Lagos');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const planId = (activeRestaurant.plan || 'basic').toLowerCase();
  const isEligible = planId.includes('standard') || planId.includes('premium') || planId.includes('enterprise') || planId.includes('growth');

  const handleSwitchStore = (restId: string) => {
    switchRestaurant(restId);
    showNotification('Switched active branch');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Multi-Location Restaurant Chain Hub</h2>
              <p className="text-[11px] text-neutral-400">Manage all your branches, lounges & kitchens in one centralized dashboard</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked on Basic Plan */}
        {!isEligible ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 inline-block">
                Exclusive Feature
              </span>
              <h3 className="text-lg font-extrabold text-neutral-900">
                Multi-Store Manager is Locked on Basic Plan
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Your account is currently on the <strong>{activeRestaurant.plan.toUpperCase()}</strong> tier (1 store limit). Upgrade to <strong>Standard</strong> or <strong>Premium</strong> to seamlessly manage multiple branch outlets, aggregate chains, and switch kitchens with 1 click.
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Consolidated chain sales & financial analytics</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Centralized menu replication & recipe sync</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Independent kitchen display & staff logins per branch</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPricing) onOpenPricing();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Standard / Premium</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Unlocked Multi-Store Hub */
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-neutral-900 text-sm">Your Chain Locations ({restaurants.length})</h4>
                <p className="text-[11px] text-neutral-500">Click any location below to switch active kitchen operations</p>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 uppercase">
                {activeRestaurant.plan.toUpperCase()} Tier Active
              </span>
            </div>

            {/* Restaurant Branches Grid */}
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
              {restaurants.map(rest => {
                const isActive = rest.id === activeRestaurant.id;

                return (
                  <div
                    key={rest.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl shrink-0">
                        {rest.logo && (rest.logo.startsWith('http') || rest.logo.startsWith('data:')) ? (
                          <img src={rest.logo} alt={rest.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          rest.logo || '🍽️'
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-neutral-900 text-sm truncate">{rest.name}</h5>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-neutral-950">
                              Current Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {rest.address || 'Lagos, Nigeria'} · {rest.tables.length} Tables · slug: /{rest.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive ? (
                        <button
                          onClick={() => handleSwitchStore(rest.id)}
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Switch Store</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="px-3 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Managing</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">Need to link another existing branch account? Contact Super Admin.</span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
