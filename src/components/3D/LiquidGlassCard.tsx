import React, { useRef, useState } from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(212, 175, 55, 0.25)', // Rich Gold
  intensity = 1,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50, rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    // Subtle 3D tilt
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -6 * intensity;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 6 * intensity;

    setCoords({ x: px, y: py, rx, ry });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setCoords(prev => ({ ...prev, rx: 0, ry: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: isHovered 
          ? `perspective(900px) rotateX(${coords.rx}deg) rotateY(${coords.ry}deg) translateY(-2px)` 
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative group rounded-3xl overflow-hidden backdrop-blur-xl border border-white/20 transition-all shadow-xl ${className}`}
    >
      {/* Dynamic Liquid Glass Refraction Gleam */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background: `radial-gradient(circle 240px at ${coords.x}% ${coords.y}%, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Chromatic Liquid Specular Border Highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 0 1.5px rgba(255, 255, 255, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)`,
        }}
      />

      {/* Liquid Sheen Reflection Stripe */}
      <div 
        className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" 
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
