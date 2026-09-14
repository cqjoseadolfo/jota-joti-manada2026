import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gamepad2, Users, UserPlus } from 'lucide-react';

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
      className="w-full max-w-3xl mx-auto px-4 py-4 space-y-4"
    >
      <div className="win-3d p-6 sm:p-9 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-300 border-2 border-black font-game text-xs font-bold text-black uppercase shadow-[1px_1px_0_#000]">
          ⚡ Panel de Operaciones
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wide mb-6 font-game text-black">
          ¿Qué deseas realizar hoy?
        </h2>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* REGISTRAR DIRIGENTE */}
          <button
            onClick={onSelectDirigente}
            className="btn-3d btn-blue flex-col py-6 h-48 sm:h-52 w-full justify-center group"
          >
            <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">👤</span>
            <span className="text-base sm:text-lg font-bold tracking-wide mt-2 leading-tight">
              REGISTRAR DIRIGENTE
            </span>
            <span className="text-xs font-semibold opacity-90 normal-case tracking-normal mt-1">
              Adulto voluntario responsable
            </span>
          </button>

          {/* REGISTRAR LOBATO(S) */}
          <button
            onClick={onSelectLobatos}
            className="btn-3d btn-yellow flex-col py-6 h-48 sm:h-52 w-full justify-center group"
          >
            <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">🎒</span>
            <span className="text-base sm:text-lg font-bold tracking-wide mt-2 leading-tight">
              REGISTRAR LOBATO(S)
            </span>
            <span className="text-xs font-semibold opacity-90 normal-case tracking-normal mt-1">
              Registro oficial de seisena
            </span>
          </button>

          {/* ACTUALIZAR NICKNAMES (CRUD ROBLOX) */}
          <button
            onClick={onSelectNicknames}
            className="btn-3d btn-green flex-col py-6 h-48 sm:h-52 w-full justify-center group border-emerald-950"
          >
            <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">🎮</span>
            <span className="text-base sm:text-lg font-bold tracking-wide mt-2 leading-tight">
              ACTUALIZAR NICKNAMES
            </span>
            <span className="text-xs font-semibold opacity-90 normal-case tracking-normal mt-1">
              Gestor de usuarios Roblox
            </span>
          </button>
        </div>

        {/* Small mission status pill */}
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


