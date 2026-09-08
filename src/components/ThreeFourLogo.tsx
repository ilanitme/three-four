import React from 'react';

interface ThreeFourLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  tagline?: string;
  className?: string;
}

export const ThreeFourLogo: React.FC<ThreeFourLogoProps> = ({
  size = 'md',
  showText = true,
  tagline = 'לוח עבודות ועזרה הדדית בקיבוץ',
  className = '',
}) => {
  // Dimension mapping for the icon box
  const sizeConfig = {
    sm: {
      box: 'w-8 h-8 rounded-lg',
      three: 'text-xs top-0.5 right-1.5',
      four: 'text-xs bottom-0.5 left-1.5',
      connector: 'w-3 h-0.5',
      title: 'text-lg font-black',
      tagline: 'text-[10px]',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      box: 'w-10 h-10 rounded-xl',
      three: 'text-sm font-black top-1 right-2',
      four: 'text-sm font-black bottom-1 left-2',
      connector: 'w-3.5 h-0.5',
      title: 'text-2xl font-black',
      tagline: 'text-[11px]',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      box: 'w-14 h-14 rounded-2xl',
      three: 'text-lg font-black top-1.5 right-2.5',
      four: 'text-lg font-black bottom-1.5 left-2.5',
      connector: 'w-5 h-1',
      title: 'text-3xl font-black',
      tagline: 'text-sm',
      badge: 'text-xs px-2.5 py-1',
    },
    xl: {
      box: 'w-20 h-20 rounded-3xl',
      three: 'text-2xl font-black top-2.5 right-3.5',
      four: 'text-2xl font-black bottom-2.5 left-3.5',
      connector: 'w-7 h-1.5',
      title: 'text-4xl font-black',
      tagline: 'text-base',
      badge: 'text-sm px-3 py-1',
    },
  };

  const cfg = sizeConfig[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic 3-4 Icon: 3 on top, 4 down and left with Fresh Youthful Community Theme */}
      <div 
        id="logo-three-four-icon"
        className={`relative ${cfg.box} bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-500 shadow-md shadow-cyan-600/25 flex items-center justify-center overflow-hidden border border-white/40 group-hover:scale-105 transition-transform duration-200 shrink-0`}
      >
        {/* Subtle decorative background glow and mesh lines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300/40 via-emerald-400/20 to-transparent opacity-90" />
        <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-amber-400/35 rounded-full blur-xs" />

        {/* Dynamic diagonal divider line connecting them */}
        <div 
          className="absolute w-full h-[1.5px] bg-gradient-to-r from-amber-300 via-white to-transparent rotate-[-35deg] pointer-events-none opacity-90"
        />

        {/* The '3' - Top Right */}
        <span 
          className={`absolute ${cfg.three} text-white font-extrabold tracking-tighter leading-none drop-shadow-xs font-['Rubik',sans-serif]`}
        >
          3
        </span>

        {/* The '4' - Bottom Left (shifted down & left) */}
        <span 
          className={`absolute ${cfg.four} text-amber-200 font-extrabold tracking-tighter leading-none drop-shadow-sm font-['Rubik',sans-serif]`}
        >
          4
        </span>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="text-right min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`${cfg.title} text-slate-900 tracking-tight heading-font font-['Rubik',sans-serif] whitespace-nowrap`}>
              שלוש - ארבע
            </span>
            <span className={`hidden sm:inline-flex items-center font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-teal-800 rounded-full border border-teal-200/90 shadow-2xs ${cfg.badge} whitespace-nowrap`}>
              קיבוץ 🌿
            </span>
          </div>
          {tagline && (
            <p className={`${cfg.tagline} text-slate-500 font-medium -mt-0.5 hidden sm:block truncate`}>
              {tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
