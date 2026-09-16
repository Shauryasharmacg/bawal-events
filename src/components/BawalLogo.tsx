import React from 'react';

interface BawalLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  accentColor?: string; // Optional highlight (defaults to #0038FF or #FFFFFF)
  theme?: 'dark' | 'light' | 'monochrome';
}

export const BawalLogo: React.FC<BawalLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md',
  accentColor,
  theme = 'monochrome',
}) => {
  const starColor = accentColor || (theme === 'monochrome' ? '#FFFFFF' : '#0038FF');
  const textColor = '#FFFFFF';
  const ringColor = '#FFFFFF';

  // 1. Full Emblem Badge (Exact replica of user's uploaded logo)
  if (variant === 'full' || variant === 'badge') {
    const sizeClasses = {
      sm: 'w-40 xs:w-48 h-28 xs:h-32 max-w-full',
      md: 'w-60 sm:w-72 h-40 sm:h-48 max-w-full',
      lg: 'w-72 sm:w-96 h-48 sm:h-64 max-w-full',
      xl: 'w-full max-w-[480px] h-auto aspect-[3/2]',
      custom: '',
    }[size];

    return (
      <div className={`relative inline-flex items-center justify-center select-none max-w-full ${sizeClasses} ${className}`}>
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(300, 200)">
            {/* Dual overlapping outer orbital ellipses */}
            <ellipse
              cx="0"
              cy="0"
              rx="264"
              ry="158"
              fill="none"
              stroke={ringColor}
              strokeWidth="3.5"
              transform="rotate(-5)"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="264"
              ry="158"
              fill="none"
              stroke={ringColor}
              strokeWidth="3.5"
              transform="rotate(5)"
            />

            {/* 4-point sparkle star above BAWAL */}
            <path
              d="M 0,-118 
                 C 2,-96 16,-82 38,-80 
                 C 16,-78 2,-64 0,-42 
                 C -2,-64 -16,-78 -38,-80 
                 C -16,-82 -2,-96 0,-118 Z"
              fill={starColor}
            />

            {/* BAWAL Wordmark with slanted bold geometry */}
            <g transform="translate(0, 24) skewX(-14)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill={textColor}
                fontFamily="'Syne', 'Montserrat', 'Arial Black', sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize="96"
                letterSpacing="-0.02em"
                transform="scale(1.18, 0.96)"
              >
                BAWAL
              </text>
            </g>

            {/* Subtitle: SOCIAL / PARTIES / PEOPLE */}
            <text
              x="0"
              y="68"
              textAnchor="middle"
              fill={textColor}
              fontFamily="'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
              fontWeight="800"
              fontSize="14.5"
              letterSpacing="0.22em"
            >
              SOCIAL &nbsp;/ &nbsp;PARTIES &nbsp;/ &nbsp;PEOPLE
            </text>

            {/* Bottom 3 Icons: Cocktail Glass, Group of People, Wireframe Globe */}
            <g transform="translate(0, 108)" stroke={ringColor} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* 1. Martini / Cocktail Glass */}
              <g transform="translate(-64, 0)">
                <polygon points="-10,-10 10,-10 0,2" strokeWidth="1.8" fill="none" />
                <line x1="-3" y1="-13" x2="3" y2="-5" strokeWidth="1.6" />
                <line x1="0" y1="2" x2="0" y2="10" strokeWidth="1.8" />
                <line x1="-7" y1="10" x2="7" y2="10" strokeWidth="1.8" />
              </g>

              {/* 2. People (Group of 3 avatars) */}
              <g transform="translate(0, 0)">
                <circle cx="0" cy="-6" r="3.2" strokeWidth="1.8" />
                <path d="M -7,8 C -7,2 -4,0 0,0 C 4,0 7,2 7,8 Z" strokeWidth="1.8" />
                <circle cx="-9.5" cy="-4" r="2.7" strokeWidth="1.6" />
                <path d="M -15,8 C -15,3 -12,2 -8,2" strokeWidth="1.6" />
                <circle cx="9.5" cy="-4" r="2.7" strokeWidth="1.6" />
                <path d="M 8,2 C 12,2 15,3 15,8" strokeWidth="1.6" />
              </g>

              {/* 3. Wireframe Globe */}
              <g transform="translate(64, 0)">
                <circle cx="0" cy="0" r="10.5" strokeWidth="1.8" />
                <line x1="-10.5" y1="0" x2="10.5" y2="0" strokeWidth="1.4" />
                <ellipse cx="0" cy="0" rx="5.2" ry="10.5" strokeWidth="1.4" />
                <path d="M -8.5,-5 C -4,-3 4,-3 8.5,-5" strokeWidth="1.2" />
                <path d="M -8.5,5 C -4,3 4,3 8.5,5" strokeWidth="1.2" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }

  // 2. Icon Variant (Compact Orbital Emblem)
  if (variant === 'icon') {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
      custom: '',
    }[size];

    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(50, 50)">
            {/* Outer orbits */}
            <ellipse cx="0" cy="0" rx="44" ry="26" fill="none" stroke={ringColor} strokeWidth="2.4" transform="rotate(-6)" />
            <ellipse cx="0" cy="0" rx="44" ry="26" fill="none" stroke={ringColor} strokeWidth="2.4" transform="rotate(6)" />
            {/* Sparkle star */}
            <path
              d="M 0,-21 C 1,-16 3.5,-13.5 8.5,-12.5 C 3.5,-11.5 1,-9 0,-4 C -1,-9 -3.5,-11.5 -8.5,-12.5 C -3.5,-13.5 -1,-16 0,-21 Z"
              fill={starColor}
            />
            {/* BW monogram in brand font */}
            <text
              x="0"
              y="6"
              textAnchor="middle"
              dominantBaseline="central"
              fill={textColor}
              fontFamily="'Syne', 'Montserrat', 'Arial Black', sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="24"
              letterSpacing="-0.04em"
            >
              BW
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // 3. Horizontal Navbar / Header Lockup
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-10 sm:w-12 h-10 sm:h-12' : 'w-9 sm:w-10 h-9 sm:h-10';
  const textTitleSize = size === 'sm' ? 'text-lg sm:text-xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl';
  const taglineSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[9px] sm:text-[11px]' : 'text-[8.5px] sm:text-[9.5px]';

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none max-w-full ${className}`}>
      {/* Emblem Icon */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center rounded-xl bg-black/60 border border-white/20 p-0.5 group-hover:border-[#0038FF]/60 transition-colors`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(50, 50)">
            <ellipse cx="0" cy="0" rx="44" ry="26" fill="none" stroke="#FFFFFF" strokeWidth="2.4" transform="rotate(-6)" />
            <ellipse cx="0" cy="0" rx="44" ry="26" fill="none" stroke="#FFFFFF" strokeWidth="2.4" transform="rotate(6)" />
            <path
              d="M 0,-21 C 1,-16 3.5,-13.5 8.5,-12.5 C 3.5,-11.5 1,-9 0,-4 C -1,-9 -3.5,-11.5 -8.5,-12.5 C -3.5,-13.5 -1,-16 0,-21 Z"
              fill={starColor}
            />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FFFFFF"
              fontFamily="'Syne', 'Montserrat', 'Arial Black', sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="24"
              letterSpacing="-0.04em"
            >
              BW
            </text>
          </g>
        </svg>
      </div>

      {/* Brand Typography & Tagline */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-black ${textTitleSize} tracking-wider text-white font-['Syne',sans-serif] italic leading-none`}>
            BAWAL
          </span>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0038FF] shadow-[0_0_8px_#0038FF] animate-pulse shrink-0"></span>
        </div>
        <p className={`${taglineSize} tracking-[0.15em] sm:tracking-[0.2em] text-[#A0A0A8] uppercase font-bold mt-0.5 sm:mt-1 hidden sm:block truncate`}>
          Social &bull; Parties &bull; People
        </p>
      </div>
    </div>
  );
};
