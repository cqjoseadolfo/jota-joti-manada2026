import React from 'react';
import { Database } from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  showHomeButton?: boolean;
  isDbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, showHomeButton = false, isDbConnected = true }) => {
  return (
    <header className="relative z-10 w-full max-w-5xl mx-auto pt-8 pb-4 px-4 text-center">
      <div className="flex flex-col items-center justify-center">
        <div 
          onClick={showHomeButton ? onGoHome : undefined}
          className={`inline-block group ${showHomeButton ? 'cursor-pointer' : ''}`}
        >
          {/* Main Title Heading */}
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl font-bold uppercase tracking-wider text-white font-game"
            style={{
              textShadow: '0 8px 0 #000000, 0 0 20px rgba(30, 144, 255, 0.5)',
              WebkitTextStroke: '2px #000000',
            }}
          >
            JOTA JOTI
          </h1>

          {/* Angled Yellow Badge */}
          <div className="mt-2 bg-[#FFD700] border-4 border-black px-6 py-2 rounded-2xl inline-block shadow-[0_6px_0_#000000] rotate-[-2deg] hover:rotate-0 transition-transform">
            <span className="text-black font-bold text-xl sm:text-2xl uppercase italic font-game tracking-wide">
              Manada Perú 2026
            </span>
          </div>
        </div>

        {/* Subtitle & Cloud Status */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <p className="text-base sm:text-lg md:text-xl text-white/85 font-game font-semibold tracking-wide">
            Sistema de Registro de Participantes
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-game font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
            <Database className="w-3 h-3 text-emerald-400 animate-pulse" />
            Base de Datos Conectada
          </span>
        </div>
      </div>
    </header>
  );
};

