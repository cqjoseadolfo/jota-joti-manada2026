import React from 'react';
import { Database } from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  showHomeButton?: boolean;
  isDbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, showHomeButton = false, isDbConnected = true }) => {
  return (
    <header className="relative z-10 w-full max-w-5xl mx-auto pt-6 pb-2 px-4 text-center">
      <div className="flex flex-col items-center justify-center">
        <div 
          onClick={showHomeButton ? onGoHome : undefined}
          className={`inline-block group transition-all duration-200 ${showHomeButton ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
          title={showHomeButton ? 'Volver al Inicio' : 'JOTA-JOTI Manada 2026'}
        >
          {/* Official JOTA JOTI Horizontal Logo */}
          <div className="flex items-center justify-center">
            <img
              src="/assets/images/logo-horizontal.svg"
              alt="JOTA-JOTI Logo Oficial"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200"
            />
          </div>
        </div>

        {/* Cloud / Database Status */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-game font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm backdrop-blur-sm">
            <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Base de Datos Conectada
          </span>
        </div>
      </div>
    </header>
  );
};


