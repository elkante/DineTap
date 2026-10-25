import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  CreditCard, 
  Coins, 
  CheckCircle2, 
  Nfc, 
  ArrowRight,
  Sparkles,
  Plus,
  Minus,
  Building2
} from 'lucide-react';

export const CustomerCartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    updateCartItemQuantity,
    removeFromCart, 
    clearCart, 
    placeOrder, 
    activeRestaurant, 
    currentTable,
    isNfcSource 
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [packCount, setPackCount] = useState(1);
  const [paymentChoice, setPaymentChoice] = useState<'pos' | 'cash' | 'transfer'>('pos');
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const design = activeRestaurant.design;
  const subtotal = cart.reduce((sum, ci) => sum + ci.foodItem.price * ci.quantity, 0);
  const totalItemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const packUnitPrice = activeRestaurant.packagingFeePerPack ?? 500;
  const packagingFee = orderType === 'takeaway' ? packCount * packUnitPrice : 0;
  const vat = Math.round((subtotal + packagingFee) * 0.075);
  const total = subtotal + packagingFee + vat;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder = placeOrder(
      customerName || (orderType === 'takeaway' ? 'Takeout Customer' : 'Diner at ' + (currentTable || 'Table 01')), 
      paymentChoice,
      {
        customerPhone: customerPhone.trim() || undefined,
        subtotal,
        vat,
        orderType,
        packagingFee: packagingFee > 0 ? packagingFee : undefined,
        packCount: orderType === 'takeaway' ? packCount : undefined
      }
    );
    if (newOrder) {
      setOrderPlacedSuccess(newOrder.id);
    }
  };

  const handleFinish = () => {
    setOrderPlacedSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">Your Table Order</h2>
            {currentTable && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900">
                {currentTable}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderPlacedSuccess ? (
          /* SUCCESS SCREEN */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Order Placed Successfully!</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Order ticket <span className="font-mono font-bold text-neutral-800">#{orderPlacedSuccess}</span> has been sent straight to {activeRestaurant.name}'s kitchen.
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 w-full text-xs text-neutral-600 mb-6 font-mono space-y-1">
              <div>Table: {currentTable || 'Table 01'}</div>
              <div>Source: {isNfcSource ? 'Digital Card Tap' : 'QR Scan'}</div>
              <div>
                Payment:{' '}
                {paymentChoice === 'pos'
                  ? 'Card / POS at Table (Waitstaff will bring machine)'
                  : paymentChoice === 'cash'
                  ? 'Cash to Waitstaff when served'
                  : 'Direct Bank Transfer to Restaurant'}
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Back to Menu Book
            </button>
          </div>
        ) : (
          /* CART CONTENT */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-600">Your cart is empty</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Flip through the menu and add dishes you would like to order.
                  </p>
                </div>
              ) : (
                cart.map((ci, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-neutral-900 block truncate">{ci.foodItem.name}</span>
                        {ci.notes && (
                          <div className="text-[11px] text-neutral-500 mt-0.5 italic">Note: {ci.notes}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1 shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60">
                      <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-2 py-0.5 shadow-xs">
                        <button
                          onClick={() => updateCartItemQuantity(index, ci.quantity - 1)}
                          className="text-neutral-500 hover:text-neutral-900 w-5 h-5 flex items-center justify-center font-bold"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-neutral-900 w-5 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(index, ci.quantity + 1)}
                          className="text-neutral-500 hover:text-neutral-900 w-5 h-5 flex items-center justify-center font-bold"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-neutral-800 text-xs">
                        {design.currencySymbol}{(ci.foodItem.price * ci.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="p-4 border-t border-neutral-200 bg-neutral-50/50 space-y-3 text-xs">
                {/* Dining Mode Selector: Dine-in vs Takeaway */}
                <div className="bg-white p-1 rounded-xl border border-neutral-200 flex gap-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      orderType === 'dine_in'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>🍽️ Dine-in</span>
                    {currentTable && <span className="text-[10px] opacity-75">({currentTable})</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('takeaway');
                      if (packCount < 1) setPackCount(Math.max(1, totalItemCount));
                    }}
                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      orderType === 'takeaway'
                        ? 'bg-amber-500 text-neutral-950 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>🥡 Takeout Pack</span>
                  </button>
                </div>

                {/* Takeaway Packaging Options */}
                {orderType === 'takeaway' && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-950 text-xs block">Takeout Foil Packaging</span>
                        <span className="text-[10px] text-amber-700">Sealed food pack + cutlery + carrier bag</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-900">
                        {design.currencySymbol}{packUnitPrice.toLocaleString()} / pack
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <span className="text-[11px] text-amber-900 font-medium">Number of Takeaway Packs:</span>
                      <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => setPackCount(Math.max(1, packCount - 1))}
                          className="text-amber-800 hover:text-amber-950 font-bold px-1"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-amber-950 text-xs w-4 text-center">{packCount}</span>
                        <button
                          type="button"
                          onClick={() => setPackCount(packCount + 1)}
                          className="text-amber-800 hover:text-amber-950 font-bold px-1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="space-y-1 text-xs border-b border-neutral-200 pb-3">
                  <div className="flex justify-between text-neutral-600">
                    <span>Dishes Subtotal</span>
                    <span className="font-mono">{design.currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  {orderType === 'takeaway' && packagingFee > 0 && (
                    <div className="flex justify-between text-amber-800 font-medium">
                      <span>Takeout Packaging ({packCount}x @ {design.currencySymbol}{packUnitPrice.toLocaleString()})</span>
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
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name (e.g. David Adebayo)"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number (for WhatsApp updates)"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Direct Manual Payment Options */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                      Payment Method
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      100% Direct to Restaurant
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pos')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        paymentChoice === 'pos'
                          ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <div className="text-[11px] leading-tight">Card / POS</div>
                      <div className="text-[9px] opacity-70">At Table</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChoice('cash')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        paymentChoice === 'cash'
                          ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <Coins className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <div className="text-[11px] leading-tight">Cash</div>
                      <div className="text-[9px] opacity-70">To Waiter</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChoice('transfer')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        paymentChoice === 'transfer'
                          ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <div className="text-[11px] leading-tight">Transfer</div>
                      <div className="text-[9px] opacity-70">Direct Bank</div>
                    </button>
                  </div>

                  <p className="text-[10px] text-neutral-400 text-center">
                    🔒 TapMenu never holds your money. Payments are made directly to {activeRestaurant.name}.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2"
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
