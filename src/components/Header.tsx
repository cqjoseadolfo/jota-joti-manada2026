import React from 'react';
import { motion } from 'motion/react';

interface HeaderProps {
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, showHomeButton = false }) => {
  return (
    <header className="relative z-10 w-full max-w-5xl mx-auto pt-6 pb-2 px-4 text-center">
      <div className="flex flex-col items-center justify-center">
        <div 
          onClick={showHomeButton ? onGoHome : undefined}
          className={`inline-block group transition-all duration-200 ${showHomeButton ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
          title={showHomeButton ? 'Volver al Inicio' : 'JOTA-JOTI Manada 2026'}
        >
          {/* Official JOTA JOTI Horizontal Logo with discreet Perú indicator */}
          <div className="inline-flex items-center justify-center gap-2 sm:gap-2.5">
            <img
              src="/assets/images/logo-horizontal.svg"
              alt="JOTA-JOTI Logo Oficial"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200"
            />
            {/* Small subtle Peru detail */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm self-start sm:self-center shrink-0 select-none shadow-sm">
              <span className="inline-flex w-3.5 h-2.5 rounded-[1.5px] overflow-hidden border border-black/40 shrink-0">
                <span className="w-1/3 h-full bg-[#D91023]" />
                <span className="w-1/3 h-full bg-white" />
                <span className="w-1/3 h-full bg-[#D91023]" />
              </span>
              <span className="tracking-wide">Perú</span>
            </div>
          </div>
        </div>

        {/* Letrerito inclinado con efecto de movimiento "MANADA 2026" - tamaño más visible */}
        <div className="mt-2.5 sm:mt-3">
          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [-5, -7.5, -5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.8,
              ease: 'easeInOut',
            }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-black font-game font-extrabold text-sm sm:text-base md:text-lg uppercase tracking-wider px-4 sm:px-5 py-1.5 rounded-xl border-3 border-black shadow-[4px_4px_0_#000] select-none hover:scale-105 transition-transform">
              <span className="text-base sm:text-lg">🐺</span>
              <span>MANADA 2026</span>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
};



