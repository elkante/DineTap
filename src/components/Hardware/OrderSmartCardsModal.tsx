import React, { useState } from 'react';
import { X, CreditCard, Sparkles, CheckCircle2, MessageSquare, Phone, MapPin, Globe, Star, QrCode } from 'lucide-react';
import { CardOrderRequest, RestaurantTenant } from '../../types';
import { submitCardOrder } from '../../utils/cardOrderStorage';

interface OrderSmartCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantTenant;
  showNotification: (msg: string) => void;
}

export const OrderSmartCardsModal: React.FC<OrderSmartCardsModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  showNotification
}) => {
  const [quantity, setQuantity] = useState(5);
  const [contactPhone, setContactPhone] = useState(restaurant.phone || '');
  const [cardType, setCardType] = useState<CardOrderRequest['cardType']>('table_nfc');
  const [targetUrlPayload, setTargetUrlPayload] = useState('');
  const [tableNumbers, setTableNumbers] = useState('Tables 1 to 5');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!isOpen) return null;

  const UNIT_PRICE = 7000; // ₦7,000 NGN
  const totalAmount = quantity * UNIT_PRICE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) {
      showNotification('Please enter a contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCardOrder({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        contactPhone: contactPhone.trim(),
        quantity,
        unitPrice: UNIT_PRICE,
        totalAmount,
        cardType,
        targetUrlPayload: cardType !== 'table_nfc' ? targetUrlPayload.trim() : undefined,
        tableNumbers: cardType === 'table_nfc' ? tableNumbers.trim() : undefined,
        notes: deliveryNotes.trim() || undefined
      });

      setIsSubmitting(false);
      setOrderComplete(true);
      showNotification('🚀 Hardware order submitted to Super Admin!');
    } catch {
      setIsSubmitting(false);
      showNotification('Failed to submit order. Please try again.');
    }
  };

  const handleDone = () => {
    setOrderComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Order Smart NFC Cards & Table Stands</h2>
              <p className="text-[11px] text-amber-400 font-mono font-bold">₦7,000 / custom pre-encoded card</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderComplete ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">Order Dispatched to Super Admin!</h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                We received your request for <strong>{quantity} custom Smart Cards</strong> (Total: <strong>₦{totalAmount.toLocaleString()}</strong>). Our support admin will contact you via WhatsApp / phone shortly to verify payment and delivery details.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleDone}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Back to Kitchen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
            
            {/* Card Function Purpose Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                1. Select Card Purpose / Action
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCardType('table_nfc')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    cardType === 'table_nfc'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-amber-700 mb-1" />
                  <span className="font-bold text-neutral-900 text-[11px] block">Dining Table Tap</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">Opens Table Menu & Ordering</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('google_review')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    cardType === 'google_review'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <Star className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="font-bold text-neutral-900 text-[11px] block">Google Reviews Tap</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">5-Star Review booster</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('whatsapp_link')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    cardType === 'whatsapp_link'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="font-bold text-neutral-900 text-[11px] block">WhatsApp Concierge</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">Direct chat with manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('instagram_social')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    cardType === 'instagram_social'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <Globe className="w-4 h-4 text-rose-500 mb-1" />
                  <span className="font-bold text-neutral-900 text-[11px] block">Instagram / Social</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">Gain followers on tap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('custom_url')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    cardType === 'custom_url'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-neutral-700 mb-1" />
                  <span className="font-bold text-neutral-900 text-[11px] block">Custom URL Destination</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">Wi-Fi login, event portal</span>
                </button>
              </div>
            </div>

            {/* Target URL or Table Sequence Input */}
            {cardType === 'table_nfc' ? (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600">
                  Table Numbers Sequence
                </label>
                <input
                  type="text"
                  required
                  value={tableNumbers}
                  onChange={(e) => setTableNumbers(e.target.value)}
                  placeholder="e.g. Tables 1 to 10 or VIP 1, VIP 2..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-neutral-400">Cards will be custom encoded with direct links to these specific tables.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600">
                  Target Link / Account Handle
                </label>
                <input
                  type="text"
                  required
                  value={targetUrlPayload}
                  onChange={(e) => setTargetUrlPayload(e.target.value)}
                  placeholder={
                    cardType === 'google_review' 
                      ? 'e.g. https://g.page/r/your-restaurant-id/review'
                      : cardType === 'whatsapp_link'
                      ? 'e.g. +234 810 123 4567 or WhatsApp link'
                      : 'e.g. @your_restaurant or https://instagram.com/your_restaurant'
                  }
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Quantity Selector & Price Summary */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 block text-xs">Quantity of Cards</span>
                  <span className="text-[10px] text-neutral-500">Includes heavy-duty acrylic table base & waterproof NFC chip</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-3 py-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-neutral-600 hover:text-neutral-950 font-bold text-sm px-1"
                  >
                    -
                  </button>
                  <span className="font-mono font-extrabold text-neutral-950 text-sm w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-neutral-600 hover:text-neutral-950 font-bold text-sm px-1"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80">
                <span className="text-neutral-600">Subtotal ({quantity} cards @ ₦7,000)</span>
                <span className="font-mono font-extrabold text-amber-900 text-sm">
                  ₦{totalAmount.toLocaleString()} NGN
                </span>
              </div>
            </div>

            {/* Delivery Contact Info */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  Contact Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 08123456789"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  Delivery Address / Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Restaurant address in Lekki Phase 1, dispatch during morning shift..."
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : `Submit Order (₦${totalAmount.toLocaleString()})`}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
