import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WaiterCall } from '../types';
import { PhoneCall, X, Receipt, HelpCircle, Droplet, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

export const WaiterCallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentTable, callWaiter, activeRestaurant } = useApp();
  const [calledSuccess, setCalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectReason = (reason: WaiterCall['reason']) => {
    callWaiter(reason);
    setCalledSuccess(true);
    setTimeout(() => {
      setCalledSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Call Waiter</h3>
              <p className="text-[10px] text-neutral-500 font-mono">{currentTable || 'Table 01'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {calledSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900">Waitstaff Alerted!</h4>
            <p className="text-xs text-neutral-500 mt-1">
              A server is on their way to {currentTable || 'your table'}.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-[11px] text-neutral-500 mb-3">
              Select how we can assist you at {activeRestaurant.name}:
            </p>

            <button
              onClick={() => handleSelectReason('Request Bill')}
              className="w-full p-3 border border-neutral-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <Receipt className="w-4 h-4 text-neutral-500 group-hover:text-amber-700" />
              <div>
                <div className="font-bold text-neutral-900 group-hover:text-amber-900">Request Bill / POS</div>
                <div className="text-[10px] text-neutral-500">Bring the card terminal to table</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectReason('Need Waiter')}
              className="w-full p-3 border border-neutral-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <HelpCircle className="w-4 h-4 text-neutral-500 group-hover:text-amber-700" />
              <div>
                <div className="font-bold text-neutral-900 group-hover:text-amber-900">General Service</div>
                <div className="text-[10px] text-neutral-500">Call server over to table</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectReason('Water Refill')}
              className="w-full p-3 border border-neutral-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <Droplet className="w-4 h-4 text-neutral-500 group-hover:text-amber-700" />
              <div>
                <div className="font-bold text-neutral-900 group-hover:text-amber-900">Water / Ice Refill</div>
                <div className="text-[10px] text-neutral-500">Complimentary table water</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectReason('Cutlery / Napkins' as WaiterCall['reason'])}
              className="w-full p-3 border border-neutral-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
            >
              <UtensilsCrossed className="w-4 h-4 text-neutral-500 group-hover:text-amber-700" />
              <div>
                <div className="font-bold text-neutral-900 group-hover:text-amber-900">Cutlery & Napkins</div>
                <div className="text-[10px] text-neutral-500">Additional forks, knives or plates</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
