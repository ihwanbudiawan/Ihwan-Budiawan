import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const PLNDistributionBackground: React.FC = () => {
  const { isDark, backgroundStyle, themePalette, customBg } = useTheme();

  // If custom background is set
  if (backgroundStyle === 'custom' && customBg) {
    const isImage = customBg.startsWith('data:') || customBg.startsWith('http') || customBg.startsWith('/');
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
        style={
          isImage
            ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: isDark ? 0.35 : 0.2 }
            : { backgroundColor: customBg }
        }
      />
    );
  }

  // Palette accents
  const getGlowColors = () => {
    switch (themePalette) {
      case 'cyber-dark':
        return { primary: 'bg-cyan-500/25', secondary: 'bg-blue-600/20', tertiary: 'bg-sky-400/20' };
      case 'deep-space':
        return { primary: 'bg-purple-600/25', secondary: 'bg-indigo-600/20', tertiary: 'bg-fuchsia-500/20' };
      case 'electric-indigo':
        return { primary: 'bg-indigo-500/25', secondary: 'bg-blue-500/20', tertiary: 'bg-cyan-400/15' };
      case 'sunset-amber':
        return { primary: 'bg-amber-500/25', secondary: 'bg-rose-500/20', tertiary: 'bg-orange-400/20' };
      case 'light-clean':
        return { primary: 'bg-emerald-200/40', secondary: 'bg-teal-100/50', tertiary: 'bg-emerald-100/40' };
      case 'pln-emerald':
      default:
        return { primary: 'bg-emerald-400/25', secondary: 'bg-teal-400/22', tertiary: 'bg-emerald-500/24' };
    }
  };

  const glows = getGlowColors();

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${
        backgroundStyle === 'blueprint'
          ? 'bg-blueprint-grid'
          : backgroundStyle === 'circuit'
          ? 'bg-circuit-dots'
          : backgroundStyle === 'mesh'
          ? 'bg-electric-mesh'
          : ''
      }`}
    >
      {/* Ambient Lighting unless solid */}
      {backgroundStyle !== 'solid' && (
        isDark ? (
          <>
            <div className={`absolute -top-28 left-1/4 w-[850px] h-[850px] ${glows.primary} rounded-full blur-[140px]`} />
            <div className={`absolute top-1/4 -right-20 w-[750px] h-[750px] ${glows.secondary} rounded-full blur-[130px]`} />
            <div className={`absolute bottom-10 left-10 w-[900px] h-[700px] ${glows.tertiary} rounded-full blur-[150px]`} />
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div className={`absolute -top-28 left-1/4 w-[750px] h-[750px] ${glows.primary} rounded-full blur-[140px]`} />
            <div className={`absolute top-1/4 -right-20 w-[650px] h-[650px] ${glows.secondary} rounded-full blur-[130px]`} />
            <div className={`absolute bottom-10 left-10 w-[800px] h-[600px] ${glows.tertiary} rounded-full blur-[150px]`} />
          </>
        )
      )}

      {/* SVG Siluet PLN Distribusi & Sustainable Green Energy */}
      <svg
        className={`absolute bottom-0 left-0 w-full h-[400px] md:h-[490px] transition-opacity duration-1000 ${
          isDark ? 'opacity-[0.48]' : 'opacity-[0.16]'
        }`}
        viewBox="0 0 1600 460"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="greenDistGrad" x1="0" y1="0" x2="0" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="hillGrad1" x1="0" y1="200" x2="0" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#047857" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="hillGrad2" x1="0" y1="280" x2="0" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#033527" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="powerLineGrad" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.5" />
            <stop offset="25%" stopColor="#34d399" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1" />
            <stop offset="75%" stopColor="#34d399" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.5" />
          </linearGradient>

          {/* Electric Glow Filter */}
          <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Transformer Node Pulse Filter */}
          <radialGradient id="substationPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Latar Siluet Bukit Hijau Sustainable Eco-Landscape (Luminous & Fresh) */}
        <path
          d="M 0 360 Q 260 280 560 320 T 1160 300 T 1600 330 L 1600 460 L 0 460 Z"
          fill="url(#hillGrad1)"
        />
        <path
          d="M 0 395 Q 360 345 760 375 T 1460 365 T 1600 385 L 1600 460 L 0 460 Z"
          fill="url(#hillGrad2)"
        />

        {/* 2. Tiang Listrik Distribusi Beton SUTM 20kV & Gardu Portal Trafo (Siluet PLN Distribusi) */}
        {/* TIANG 1 (Kiri - Tiang SUTM 20kV Beton Bulat) */}
        <g id="tiang-distribusi-1" transform="translate(140, 100)">
          {/* Batang Tiang Beton */}
          <polygon points="23,0 27,0 30,330 20,330" fill="url(#greenDistGrad)" />
          {/* Crossarm / Travers Atas 20kV */}
          <rect x="-32" y="24" width="114" height="8" rx="2" fill="#34d399" stroke="#6ee7b7" strokeWidth="0.8" />
          {/* Isolator Pin Post 3 Fasa (R, S, T) */}
          <rect x="-28" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          <rect x="20.5" y="6" width="9" height="19" rx="2" fill="#a7f3d0" />
          <rect x="69" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          {/* Skur / Pengaku Besi Travers */}
          <line x1="25" y1="65" x2="-10" y2="32" stroke="#10b981" strokeWidth="3" />
          <line x1="25" y1="65" x2="60" y2="32" stroke="#10b981" strokeWidth="3" />
          {/* Kabel Sambungan LV di bawah */}
          <rect x="-15" y="130" width="80" height="5" rx="1" fill="#059669" />
          <circle cx="-10" cy="132" r="3.5" fill="#34d399" />
          <circle cx="25" cy="132" r="3.5" fill="#34d399" />
          <circle cx="60" cy="132" r="3.5" fill="#34d399" />
        </g>

        {/* TIANG 2 (Tengah-Kiri - Gardu Trafo Tiang Distribusi 3 Fasa / Trafo Cantol PLN) */}
        <g id="gardu-trafo-distribusi" transform="translate(480, 70)">
          {/* Tiang Portal Dobel Tiang */}
          <polygon points="12,0 16,0 19,360 9,360" fill="url(#greenDistGrad)" />
          <polygon points="84,0 88,0 91,360 81,360" fill="url(#greenDistGrad)" />
          {/* Palang Dudukan Portal Atas (Travers TM) */}
          <rect x="-22" y="18" width="144" height="9" rx="2" fill="#34d399" stroke="#6ee7b7" strokeWidth="0.8" />
          {/* Isolator Tumpu TM 20kV */}
          <rect x="-11" y="4" width="10" height="15" rx="2" fill="#a7f3d0" />
          <rect x="45" y="2" width="10" height="17" rx="2" fill="#a7f3d0" />
          <rect x="101" y="4" width="10" height="15" rx="2" fill="#a7f3d0" />
          {/* Fuse Cut Out (FCO) & Lightning Arrester */}
          <line x1="0" y1="27" x2="10" y2="55" stroke="#6ee7b7" strokeWidth="3.5" />
          <line x1="50" y1="27" x2="50" y2="55" stroke="#6ee7b7" strokeWidth="3.5" />
          <line x1="100" y1="27" x2="90" y2="55" stroke="#6ee7b7" strokeWidth="3.5" />
          {/* Dudukan Meja Trafo */}
          <rect x="-2" y="140" width="104" height="9" fill="#10b981" />
          {/* Tabung Trafo Distribusi 3 Fasa (Transformator PLN) */}
          <rect x="15" y="82" width="70" height="58" rx="6" fill="#047857" stroke="#34d399" strokeWidth="2" />
          {/* Sirip Pendingin Trafo (Cooling Fins) */}
          <line x1="25" y1="90" x2="25" y2="132" stroke="#34d399" strokeWidth="2" />
          <line x1="35" y1="90" x2="35" y2="132" stroke="#34d399" strokeWidth="2" />
          <line x1="50" y1="90" x2="50" y2="132" stroke="#34d399" strokeWidth="2" />
          <line x1="65" y1="90" x2="65" y2="132" stroke="#34d399" strokeWidth="2" />
          <line x1="75" y1="90" x2="75" y2="132" stroke="#34d399" strokeWidth="2" />
          {/* Bushing Sekunder Trafo with Glowing Node */}
          <circle cx="30" cy="77" r="5" fill="#a7f3d0" />
          <circle cx="50" cy="77" r="5" fill="#a7f3d0" />
          <circle cx="70" cy="77" r="5" fill="#a7f3d0" />
          {/* Panel Distribusi Tegangan Rendah (PHB-TR) di bawah trafo */}
          <rect x="28" y="180" width="44" height="52" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <rect x="33" y="186" width="34" height="16" fill="#022c22" />
          <circle cx="40" cy="215" r="2.5" fill="#34d399" />
          <circle cx="60" cy="215" r="2.5" fill="#fbbf24" />
        </g>

        {/* TIANG 3 (Tengah-Kanan - Tiang Distribusi Beton SUTM) */}
        <g id="tiang-distribusi-3" transform="translate(860, 110)">
          <polygon points="23,0 27,0 30,330 20,330" fill="url(#greenDistGrad)" />
          <rect x="-37" y="24" width="124" height="8" rx="2" fill="#34d399" stroke="#6ee7b7" strokeWidth="0.8" />
          <rect x="-32" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          <rect x="20.5" y="6" width="9" height="19" rx="2" fill="#a7f3d0" />
          <rect x="76" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          <line x1="25" y1="65" x2="-15" y2="32" stroke="#10b981" strokeWidth="3" />
          <line x1="25" y1="65" x2="65" y2="32" stroke="#10b981" strokeWidth="3" />
        </g>

        {/* TIANG 4 (Kanan - Gardu Distribusi / Tiang SUTM) */}
        <g id="tiang-distribusi-4" transform="translate(1320, 90)">
          <polygon points="23,0 27,0 30,340 20,340" fill="url(#greenDistGrad)" />
          <rect x="-32" y="24" width="114" height="8" rx="2" fill="#34d399" stroke="#6ee7b7" strokeWidth="0.8" />
          <rect x="-27" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          <rect x="20.5" y="6" width="9" height="19" rx="2" fill="#a7f3d0" />
          <rect x="69" y="8" width="9" height="17" rx="2" fill="#a7f3d0" />
          <line x1="25" y1="65" x2="-10" y2="32" stroke="#10b981" strokeWidth="3" />
          <line x1="25" y1="65" x2="60" y2="32" stroke="#10b981" strokeWidth="3" />
        </g>

        {/* 3. Kawat Saluran Udara Tegangan Menengah (SUTM 3-Fasa) dengan Efek Glow Bertegangan */}
        {/* Fasa R (Kabel Atas) */}
        <path
          d="M 112 110 Q 295 125 469 82 Q 670 115 828 120 Q 1090 130 1293 100 Q 1460 110 1600 90"
          stroke="url(#powerLineGrad)"
          strokeWidth="3.2"
          filter="url(#electricGlow)"
        />
        {/* Fasa S (Kabel Tengah) */}
        <path
          d="M 160 108 Q 330 123 530 78 Q 710 112 880 118 Q 1120 128 1340 98 Q 1480 108 1600 96"
          stroke="url(#powerLineGrad)"
          strokeWidth="3.2"
          filter="url(#electricGlow)"
        />
        {/* Fasa T (Kabel Bawah) */}
        <path
          d="M 209 110 Q 360 126 581 82 Q 750 116 936 120 Q 1160 132 1389 100 Q 1510 112 1600 102"
          stroke="url(#powerLineGrad)"
          strokeWidth="3.2"
          filter="url(#electricGlow)"
        />

        {/* 4. Sustainable Green Energy: Siluet Turbin Angin (Wind Turbines Eco-Power) */}
        {/* Turbin Angin 1 (Background Kiri-Tengah) */}
        <g id="turbin-angin-1" transform="translate(320, 160) scale(0.72)" opacity="0.8">
          <polygon points="8,0 12,0 15,190 5,190" fill="#059669" />
          <circle cx="10" cy="0" r="7" fill="#6ee7b7" />
          {/* Bilah Turbin (Rotor Blades) */}
          <line x1="10" y1="0" x2="10" y2="-75" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="10" y1="0" x2="-52" y2="42" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="10" y1="0" x2="72" y2="42" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
        </g>

        {/* Turbin Angin 2 (Background Kanan) */}
        <g id="turbin-angin-2" transform="translate(1120, 130) scale(0.92)" opacity="0.85">
          <polygon points="8,0 12,0 16,220 4,220" fill="#059669" />
          <circle cx="10" cy="0" r="8" fill="#6ee7b7" />
          <line x1="10" y1="0" x2="-22" y2="-85" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
          <line x1="10" y1="0" x2="-70" y2="52" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
          <line x1="10" y1="0" x2="80" y2="35" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* 5. Sustainable Green Energy: Deretan Panel Surya / Solar PV Farm */}
        <g id="solar-farm-kiri" transform="translate(680, 290)" opacity="0.75">
          {/* Panel 1 */}
          <polygon points="0,20 40,0 75,20 35,40" fill="#047857" stroke="#34d399" strokeWidth="2" />
          <polygon points="85,20 125,0 160,20 120,40" fill="#047857" stroke="#34d399" strokeWidth="2" />
          <polygon points="170,20 210,0 245,20 205,40" fill="#047857" stroke="#34d399" strokeWidth="2" />
          {/* Kaki Penyangga Panel */}
          <line x1="38" y1="35" x2="38" y2="58" stroke="#10b981" strokeWidth="2.5" />
          <line x1="123" y1="35" x2="123" y2="58" stroke="#10b981" strokeWidth="2.5" />
          <line x1="208" y1="35" x2="208" y2="58" stroke="#10b981" strokeWidth="2.5" />
        </g>

        {/* Panel Surya 2 (Kiri Bawah) */}
        <g id="solar-farm-kiri-2" transform="translate(40, 320)" opacity="0.65">
          <polygon points="0,15 35,0 65,15 30,30" fill="#047857" stroke="#6ee7b7" strokeWidth="1.8" />
          <polygon points="75,15 110,0 140,15 105,30" fill="#047857" stroke="#6ee7b7" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
};
