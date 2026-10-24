import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'hero' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // If not installable and not iOS (e.g. desktop browser that doesn't trigger prompt yet),
  // we still allow iOS users to see how to install or return null for desktop if prompt not ready
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'hero' ? (
        <button
          onClick={handleInstallClick}
          className={`px-6 py-3.5 bg-gradient-to-r from-[#0c2e22] to-[#164433] hover:from-[#113d2e] hover:to-[#1b5540] text-[#D4AF37] font-extrabold rounded-full text-xs sm:text-sm transition-all shadow-xl shadow-black/40 flex items-center justify-center gap-2 border border-[#D4AF37]/50 active:scale-95 ${className}`}
          title="Install TapMenu as a standalone app"
        >
          <Smartphone className="w-4 h-4 text-[#D4AF37]" />
          <span>Install TapMenu App</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-full text-xs font-bold transition-all active:scale-95 ${className}`}
          title="Install TapMenu App on your device"
        >
          <Download className="w-3.5 h-3.5 text-amber-700" />
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0c2e22] text-[#D4AF37] flex items-center justify-center font-serif font-black text-xl mb-4 shadow-md">
              T
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900">Install TapMenu on iPhone / iPad</h3>
            <p className="text-xs text-stone-500 mt-1 mb-5">
              Install TapMenu to your home screen for instant full-screen access to your restaurant portal and live kitchen tickets.
            </p>

            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 font-medium">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-stone-900">1. Tap the Share button</span>
                  <p className="text-[11px] text-stone-500">Located at the bottom of Safari on iPhone, or top on iPad.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-stone-900">2. Scroll down &amp; tap &quot;Add to Home Screen&quot;</span>
                  <p className="text-[11px] text-stone-500">Tap Add in the top-right corner to finish.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-3 rounded-xl bg-[#0c2e22] text-[#D4AF37] font-bold text-xs hover:bg-[#124231] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
