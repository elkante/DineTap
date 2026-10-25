import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  X,
  Trash2,
  CreditCard,
  Coins,
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  Building2,
  UtensilsCrossed,
  Package
} from 'lucide-react';

export const CustomerCartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    cart,
    updateCartItemQuantity,
    updateCartItemType,
    removeFromCart,
    placeOrder,
    activeRestaurant,
    currentTable,
    isNfcSource
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [packCount, setPackCount] = useState(1);
  const [paymentChoice, setPaymentChoice] = useState<'pos' | 'cash' | 'transfer'>('pos');
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const design = activeRestaurant.design;
  const packUnitPrice = activeRestaurant.packagingFeePerPack ?? 500;

  // Derive order type from the items themselves
  const hasDineIn  = cart.some(ci => !ci.itemType || ci.itemType === 'dine_in');
  const hasTakeout = cart.some(ci => ci.itemType === 'takeaway');
  const orderType  = hasDineIn && hasTakeout ? 'both' : hasTakeout ? 'takeaway' : 'dine_in';

  const subtotal      = cart.reduce((sum, ci) => sum + ci.foodItem.price * ci.quantity, 0);
  const takeoutCount  = cart.filter(ci => ci.itemType === 'takeaway').reduce((s, ci) => s + ci.quantity, 0);
  // Auto-set pack count to match takeout item count (user can adjust)
  const effectivePacks = Math.max(packCount, 1);
  const packagingFee  = hasTakeout ? effectivePacks * packUnitPrice : 0;
  const vat           = Math.round((subtotal + packagingFee) * 0.075);
  const total         = subtotal + packagingFee + vat;

  // Header label
  const headerLabel =
    orderType === 'both'     ? '🍽️🥡 Dine-in + Takeout' :
    orderType === 'takeaway' ? '🥡 Takeout Order'        :
                               '🍽️ Dine-in Order';

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultName =
      orderType === 'takeaway' ? `Takeout (${currentTable || 'Walk-in'})` :
      orderType === 'both'     ? `Dine-in + Takeout – ${currentTable || 'Table'}` :
                                 `Diner at ${currentTable || 'Table 1'}`;

    const newOrder = placeOrder(
      customerName || defaultName,
      paymentChoice,
      {
        customerPhone: customerPhone.trim() || undefined,
        subtotal,
        vat,
        orderType,
        packagingFee: packagingFee > 0 ? packagingFee : undefined,
        packCount: hasTakeout ? effectivePacks : undefined,
      }
    );
    if (newOrder) setOrderPlacedSuccess(newOrder.id);
  };

  const handleFinish = () => {
    setOrderPlacedSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-200">

        {/* ── Header ── */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-base font-bold text-neutral-900 truncate">{headerLabel}</h2>
            {currentTable && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 shrink-0">
                {currentTable}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderPlacedSuccess ? (
          /* ── SUCCESS SCREEN ── */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Order Placed!</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Ticket <span className="font-mono font-bold text-neutral-800">#{orderPlacedSuccess}</span> sent to {activeRestaurant.name}'s kitchen.
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 w-full text-xs text-neutral-600 mb-6 font-mono space-y-1 text-left">
              <div>Table: {currentTable || 'Table 01'}</div>
              <div>Type: {headerLabel}</div>
              <div>Source: {isNfcSource ? 'NFC Card Tap' : 'QR Scan'}</div>
              <div>
                Payment:{' '}
                {paymentChoice === 'pos'      ? 'Card / POS (waiter brings machine)' :
                 paymentChoice === 'cash'     ? 'Cash to Waitstaff'                  :
                                               'Direct Bank Transfer'}
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <>
            {/* ── Cart Items ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Legend */}
              {cart.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-700">Tap to choose per item:</span>
                  <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3 text-neutral-600" /> Eat here</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3 text-amber-600" /> Pack to go</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-600">Your cart is empty</p>
                  <p className="text-xs text-neutral-400 mt-1">Flip through the menu and add dishes you'd like to order.</p>
                </div>
              ) : (
                cart.map((ci, index) => {
                  const isItemTakeout = ci.itemType === 'takeaway';
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isItemTakeout
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      {/* Item name + remove */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-neutral-900 block truncate">{ci.foodItem.name}</span>
                          {ci.notes && (
                            <div className="text-[11px] text-neutral-500 mt-0.5 italic">Note: {ci.notes}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1 shrink-0"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dine-in / Takeout toggle + qty + price */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60 gap-2">

                        {/* Per-item type toggle */}
                        <div className="flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-xs shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartItemType(index, 'dine_in')}
                            title="Eat here"
                            className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold transition-all ${
                              !isItemTakeout
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                          >
                            <UtensilsCrossed className="w-3 h-3" />
                            <span className="hidden sm:inline">Here</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCartItemType(index, 'takeaway')}
                            title="Pack to go"
                            className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold transition-all ${
                              isItemTakeout
                                ? 'bg-amber-500 text-neutral-950'
                                : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                          >
                            <Package className="w-3 h-3" />
                            <span className="hidden sm:inline">Pack</span>
                          </button>
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-2 py-0.5 shadow-xs">
                          <button
                            onClick={() => updateCartItemQuantity(index, ci.quantity - 1)}
                            className="text-neutral-500 hover:text-neutral-900 w-5 h-5 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-neutral-900 w-5 text-center">{ci.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(index, ci.quantity + 1)}
                            className="text-neutral-500 hover:text-neutral-900 w-5 h-5 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line price */}
                        <span className="font-mono font-bold text-neutral-800 text-xs">
                          {design.currencySymbol}{(ci.foodItem.price * ci.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Takeout label under item */}
                      {isItemTakeout && (
                        <div className="mt-1.5 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <Package className="w-3 h-3" /> Packing to go
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Checkout Form ── */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="p-4 border-t border-neutral-200 bg-neutral-50/50 space-y-3 text-xs shrink-0">

                {/* Takeaway packs control — only shown when something is takeout */}
                {hasTakeout && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-950 block">Takeout Foil Packaging</span>
                        <span className="text-[10px] text-amber-700">Sealed pack + cutlery + carrier bag</span>
                      </div>
                      <span className="font-mono font-bold text-amber-900">
                        {design.currencySymbol}{packUnitPrice.toLocaleString()} / pack
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <span className="text-[11px] text-amber-900 font-medium">
                        Packs needed <span className="opacity-60">({takeoutCount} takeout items)</span>:
                      </span>
                      <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-2 py-0.5">
                        <button type="button" onClick={() => setPackCount(c => Math.max(1, c - 1))} className="text-amber-800 hover:text-amber-950 font-bold px-1">-</button>
                        <span className="font-mono font-bold text-amber-950 text-xs w-5 text-center">{effectivePacks}</span>
                        <button type="button" onClick={() => setPackCount(c => c + 1)} className="text-amber-800 hover:text-amber-950 font-bold px-1">+</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary of what's where */}
                {orderType === 'both' && (
                  <div className="flex gap-2 text-[11px] font-semibold">
                    <span className="flex-1 text-center py-1.5 bg-neutral-100 rounded-lg text-neutral-700">
                      🍽️ {cart.filter(ci => !ci.itemType || ci.itemType === 'dine_in').reduce((s,ci)=>s+ci.quantity,0)} items — Eat here
                    </span>
                    <span className="flex-1 text-center py-1.5 bg-amber-100 rounded-lg text-amber-800">
                      🥡 {takeoutCount} items — Takeout
                    </span>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="space-y-1 border-b border-neutral-200 pb-3">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{design.currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  {hasTakeout && packagingFee > 0 && (
                    <div className="flex justify-between text-amber-800 font-medium">
                      <span>Packaging ({effectivePacks}× {design.currencySymbol}{packUnitPrice.toLocaleString()})</span>
                      <span className="font-mono">+{design.currencySymbol}{packagingFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>VAT (7.5%)</span>
                    <span className="font-mono">{design.currencySymbol}{vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-neutral-900 text-sm pt-1">
                    <span>Total Due</span>
                    <span className="font-mono text-amber-800">{design.currencySymbol}{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Your Name (e.g. David Adebayo)"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Payment</label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">100% Direct to Restaurant</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['pos','cash','transfer'] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentChoice(method)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paymentChoice === method
                            ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {method === 'pos'      && <><CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-400" /><div className="text-[11px]">Card / POS</div><div className="text-[9px] opacity-70">At Table</div></>}
                        {method === 'cash'     && <><Coins      className="w-4 h-4 mx-auto mb-1 text-amber-400" /><div className="text-[11px]">Cash</div><div className="text-[9px] opacity-70">To Waiter</div></>}
                        {method === 'transfer' && <><Building2  className="w-4 h-4 mx-auto mb-1 text-amber-400" /><div className="text-[11px]">Transfer</div><div className="text-[9px] opacity-70">Direct Bank</div></>}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center">
                    🔒 TapMenu never holds your money. Payments go directly to {activeRestaurant.name}.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>Confirm Order · {design.currencySymbol}{total.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
