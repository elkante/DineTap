import React, { useEffect, useState } from 'react';
import { Sparkles, UtensilsCrossed } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Keep splash visible briefly for a smooth native-app feel
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1100);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-600 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, #0d281e 0%, #081711 50%, #040907 100%)',
      }}
    >
      {/* Ambient Gold Glow Halo */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -translate-y-6" />

      {/* Luxury Gold Medallion Logo */}
      <div className="relative mb-6">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-[0_12px_40px_rgba(245,158,11,0.4),0_0_20px_rgba(212,175,55,0.3)] animate-pulse">
          <div className="w-full h-full rounded-[22px] bg-[#071610] flex items-center justify-center border border-amber-400/40">
            <span className="font-serif font-black text-3xl sm:text-4xl bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              T
            </span>
          </div>
        </div>

        {/* Floating Sparkle Badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-md animate-bounce">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      {/* Brand Title */}
      <div className="text-center px-4 relative z-10">
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
          TapMenu
        </h1>
        <p className="text-[11px] sm:text-xs text-amber-200/70 tracking-widest uppercase font-semibold mt-1.5">
          Luxury Digital Menu Book &amp; Table Orders
        </p>
      </div>

      {/* Elegant Progress Shimmer Line */}
      <div className="mt-8 w-44 sm:w-56 h-1 bg-stone-900/80 rounded-full overflow-hidden border border-amber-500/20 relative">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite] w-full origin-left" />
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-stone-400 tracking-wider">
        <UtensilsCrossed className="w-3 h-3 text-amber-400/80" />
        <span>Syncing Fine Dining Experience...</span>
      </div>
    </div>
  );
};
