import React from 'react';

export const CartographicCompass: React.FC<{ className?: string; size?: number; color?: string }> = ({
  className = '',
  size = 36,
  color,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-700 ease-out select-none ${className}`}
      style={{ color: color || 'currentColor' }}
    >
      {/* Outer hand-inked calibrated rings */}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="0.7" strokeDasharray="1.5 2.5" opacity="0.6" />
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />

      {/* Degree ticks (12 outer tick lines) */}
      <line x1="50" y1="3" x2="50" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="91" x2="50" y2="97" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="50" x2="9" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="91" y1="50" x2="97" y2="50" stroke="currentColor" strokeWidth="1.5" />

      <line x1="17" y1="17" x2="21" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <line x1="83" y1="17" x2="79" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <line x1="17" y1="83" x2="21" y2="79" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <line x1="83" y1="83" x2="79" y2="79" stroke="currentColor" strokeWidth="1" opacity="0.8" />

      {/* North Cardinal Arrow (Inked Hand-drawn Fleur / Spear) */}
      {/* North Arrow - Dark Inked Half */}
      <polygon points="50,8 50,50 45,46" fill="currentColor" opacity="0.95" />
      {/* North Arrow - Shaded Inked Half */}
      <polygon points="50,8 55,46 50,50" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="0.6" />

      {/* South Arrow */}
      <polygon points="50,92 50,50 55,54" fill="currentColor" opacity="0.8" />
      <polygon points="50,92 45,54 50,50" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.6" />

      {/* East Arrow */}
      <polygon points="92,50 50,50 54,45" fill="currentColor" opacity="0.85" />
      <polygon points="92,50 54,55 50,50" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="0.6" />

      {/* West Arrow */}
      <polygon points="8,50 50,50 46,55" fill="currentColor" opacity="0.85" />
      <polygon points="8,50 46,45 50,50" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="0.6" />

      {/* Minor Ordinal Points (NE, NW, SE, SW) */}
      <polygon points="76,24 50,50 54,47" fill="currentColor" opacity="0.6" />
      <polygon points="24,24 50,50 47,54" fill="currentColor" opacity="0.6" />
      <polygon points="76,76 50,50 53,53" fill="currentColor" opacity="0.6" />
      <polygon points="24,76 50,50 47,47" fill="currentColor" opacity="0.6" />

      {/* Center Pivot Seal */}
      <circle cx="50" cy="50" r="5" fill="#ead9b8" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="2" fill="currentColor" />

      {/* Inscribed 'N' label on top */}
      <text
        x="50"
        y="20"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="'Cormorant SC', Georgia, serif"
        fill="currentColor"
        letterSpacing="0.5"
      >
        N
      </text>
    </svg>
  );
};
