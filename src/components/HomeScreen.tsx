import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4"
    >
      <div className="win-3d p-6 sm:p-8 text-center">
        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-2">
          {/* REGISTRAR DIRIGENTE */}
          <button
            onClick={onSelectDirigente}
            className="btn-3d btn-blue flex-col py-6 px-4 h-56 sm:h-60 w-full justify-between items-center group cursor-pointer"
          >
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/15 p-2 flex items-center justify-center border-2 border-black/30 group-hover:scale-110 transition-transform shadow-inner">
              <img
                src="/assets/images/World_Scout_Emblem.png"
                alt="World Scout Emblem"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-wide block leading-tight font-game text-white">
                REGISTRAR DIRIGENTE
              </span>
              <span className="text-xs font-semibold text-white/90 normal-case tracking-normal block mt-1">
                Adulto voluntario responsable
              </span>
            </div>
          </button>

          {/* REGISTRAR LOBATO(S) */}
          <button
            onClick={onSelectLobatos}
            className="btn-3d btn-yellow flex-col py-6 px-4 h-56 sm:h-60 w-full justify-between items-center group cursor-pointer"
          >
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-black/10 p-1 flex items-center justify-center border-2 border-black/30 overflow-hidden group-hover:scale-110 transition-transform shadow-inner">
              <img
                src="/assets/images/lobatos.jpg"
                alt="Logo Lobatos"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-wide block leading-tight font-game text-black">
                REGISTRAR LOBATO(S)
              </span>
              <span className="text-xs font-semibold text-black/80 normal-case tracking-normal block mt-1">
                Registro oficial de seisena
              </span>
            </div>
          </button>

          {/* ACTUALIZAR NICKNAMES (CRUD ROBLOX) */}
          <button
            onClick={onSelectNicknames}
            className="btn-3d btn-green flex-col py-6 px-4 h-56 sm:h-60 w-full justify-between items-center group cursor-pointer border-emerald-950"
          >
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/15 p-2 flex items-center justify-center border-2 border-black/30 group-hover:scale-110 transition-transform shadow-inner">
              <img
                src="/assets/images/roblox-removebg-preview.png"
                alt="Roblox Nicknames"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-wide block leading-tight font-game text-white">
                ACTUALIZAR NICKNAMES
              </span>
              <span className="text-xs font-semibold text-white/90 normal-case tracking-normal block mt-1">
                Gestor de usuarios Roblox
              </span>
            </div>
          </button>
        </div>

        {/* Small mission status footer */}
        <div className="mt-8 pt-4 border-t-2 border-black/10 flex items-center justify-between text-xs font-bold text-slate-600 font-game flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Asociación de Scouts del Perú
          </span>
          <span className="bg-black text-white px-2.5 py-1 rounded-lg">
            Sistema Oficial 2026
          </span>
        </div>
      </div>
    </motion.div>
  );
};



