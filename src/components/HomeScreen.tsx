import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HomeScreenProps {
  onSelectDirigente: () => void;
  onSelectLobatos: () => void;
  onSelectNicknames: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectDirigente,
  onSelectLobatos,
  onSelectNicknames,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4"
    >
      <div className="win-3d p-6 sm:p-9 text-center">
        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-1">
          {/* 1. REGISTRAR DIRIGENTE */}
          <button
            onClick={onSelectDirigente}
            className="btn-3d btn-blue flex-col py-6 px-4 h-64 sm:h-72 w-full justify-between items-center group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Glowing Orb Pedestal */}
            <div className="relative mt-2">
              <div className="absolute -inset-1.5 rounded-full bg-blue-300/40 blur-md group-hover:bg-purple-400/60 transition-all duration-300" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-white/30 to-blue-900/40 backdrop-blur-md p-3 flex items-center justify-center border-2 border-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <img
                  src="/assets/images/World_Scout_Emblem.png"
                  alt="World Scout Emblem"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="w-full z-10 space-y-1">
              <span className="text-base sm:text-lg font-extrabold tracking-wide block leading-snug font-game text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                REGISTRAR DIRIGENTE
              </span>
              <span className="text-xs font-semibold text-blue-100 block normal-case tracking-normal">
                Adulto voluntario responsable
              </span>
            </div>

            {/* Action pill */}
            <div className="z-10 inline-flex items-center gap-1 text-[11px] font-extrabold font-game px-3 py-1 rounded-lg bg-black/25 text-white border border-white/20 group-hover:bg-white group-hover:text-blue-900 transition-colors">
              <span>Ingresar</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 2. REGISTRAR LOBATO(S) */}
          <button
            onClick={onSelectLobatos}
            className="btn-3d btn-yellow flex-col py-6 px-4 h-64 sm:h-72 w-full justify-between items-center group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Glowing Orb Pedestal */}
            <div className="relative mt-2">
              <div className="absolute -inset-1.5 rounded-full bg-amber-400/50 blur-md group-hover:bg-amber-300/80 transition-all duration-300" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-amber-200/60 to-amber-500/40 backdrop-blur-md p-1.5 flex items-center justify-center border-3 border-black shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 overflow-hidden">
                <img
                  src="/assets/images/lobatos.png"
                  alt="Logo Lobatos"
                  className="w-full h-full object-cover rounded-full border border-black/20"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="w-full z-10 space-y-1">
              <span className="text-base sm:text-lg font-extrabold tracking-wide block leading-snug font-game text-black">
                REGISTRAR LOBATO(S)
              </span>
              <span className="text-xs font-semibold text-slate-800 block normal-case tracking-normal">
                Registro oficial de seisena
              </span>
            </div>

            {/* Action pill */}
            <div className="z-10 inline-flex items-center gap-1 text-[11px] font-extrabold font-game px-3 py-1 rounded-lg bg-black/15 text-black border border-black/20 group-hover:bg-black group-hover:text-yellow-300 transition-colors">
              <span>Registrar</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 3. ACTUALIZAR NICKNAMES (CRUD ROBLOX) */}
          <button
            onClick={onSelectNicknames}
            className="btn-3d btn-green flex-col py-6 px-4 h-64 sm:h-72 w-full justify-between items-center group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 border-emerald-950"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Glowing Orb Pedestal */}
            <div className="relative mt-2">
              <div className="absolute -inset-1.5 rounded-full bg-emerald-400/40 blur-md group-hover:bg-emerald-300/70 transition-all duration-300" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-white/30 to-emerald-950/40 backdrop-blur-md p-2 flex items-center justify-center border-2 border-emerald-200/70 shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <img
                  src="/assets/images/roblox-removebg-preview.png"
                  alt="Roblox Avatar"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="w-full z-10 space-y-1">
              <span className="text-base sm:text-lg font-extrabold tracking-wide block leading-snug font-game text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                ACTUALIZAR NICKNAMES
              </span>
              <span className="text-xs font-semibold text-emerald-100 block normal-case tracking-normal">
                Gestor de usuarios Roblox
              </span>
            </div>

            {/* Action pill */}
            <div className="z-10 inline-flex items-center gap-1 text-[11px] font-extrabold font-game px-3 py-1 rounded-lg bg-black/25 text-white border border-white/20 group-hover:bg-white group-hover:text-emerald-950 transition-colors">
              <span>Gestionar</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>


      </div>
    </motion.div>
  );
};




