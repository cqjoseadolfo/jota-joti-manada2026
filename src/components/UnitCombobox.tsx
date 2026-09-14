import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, X, Check, Plus } from 'lucide-react';
import { UNIDADES_SCOUT_DB, UnidadScout, formatUnidadScout } from '../data/unidades';

interface UnitComboboxProps {
  value: string; // The formatted unit string or custom string
  onChange: (unidadValue: string, unidadObj?: UnidadScout) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
}

export const UnitCombobox: React.FC<UnitComboboxProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar o seleccionar unidad scout...',
  error,
  id = 'unit-combobox',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter units based on query (numeral or name or locality)
  const filteredUnits = UNIDADES_SCOUT_DB.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      u.numeral.toLowerCase().includes(q) ||
      u.nombre.toLowerCase().includes(q) ||
      (u.localidad && u.localidad.toLowerCase().includes(q)) ||
      formatUnidadScout(u).toLowerCase().includes(q)
    );
  });

  // Check if current value matches any registered unit
  const matchedUnit = UNIDADES_SCOUT_DB.find(
    (u) => formatUnidadScout(u).toLowerCase() === value.toLowerCase() || u.nombre.toLowerCase() === value.toLowerCase()
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (u: UnidadScout) => {
    const formatted = formatUnidadScout(u);
    onChange(formatted, u);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomInputSelect = () => {
    if (query.trim()) {
      onChange(query.trim());
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {/* Selected Box or Search Input */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen && inputRef.current) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`
          input-3d flex items-center justify-between gap-2 cursor-pointer select-none py-2 px-3
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:border-black'}
          ${error ? 'border-red-600 ring-2 ring-red-500/20' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {matchedUnit ? (
            <span className="bg-[#1E90FF] text-white border-2 border-black px-2 py-0.5 rounded-lg text-xs font-bold font-game shrink-0 shadow-[1px_1px_0_#000]">
              N.º {matchedUnit.numeral}
            </span>
          ) : value ? (
            <span className="bg-yellow-400 text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-bold font-game shrink-0 shadow-[1px_1px_0_#000]">
              Unidad
            </span>
          ) : (
            <span className="text-slate-400 text-base">🔍</span>
          )}

          <span className={`text-sm font-semibold truncate ${value ? 'text-black font-game font-bold' : 'text-slate-400'}`}>
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-black transition-colors"
              title="Limpiar unidad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="
              absolute left-0 right-0 top-full mt-2 z-40
              bg-white border-4 border-black rounded-2xl shadow-[0_8px_0_#000000]
              overflow-hidden text-black
            "
          >
            {/* Search Input within Dropdown */}
            <div className="p-2.5 bg-slate-100 border-b-3 border-black">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar numeral (ej. 02) o nombre..."
                  className="w-full !pl-9 pr-7 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-semibold text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List of Units */}
            <div className="max-h-56 overflow-y-auto divide-y-2 divide-slate-100">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((u) => {
                  const isSelected =
                    value === formatUnidadScout(u) ||
                    value.toLowerCase().includes(u.nombre.toLowerCase());
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className={`
                        p-2.5 sm:p-3 hover:bg-yellow-100 cursor-pointer transition-colors
                        flex items-center justify-between gap-2 group
                        ${isSelected ? 'bg-blue-50 font-bold' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="bg-[#1E90FF] text-white border-2 border-black px-2 py-0.5 rounded-lg text-xs font-bold font-game shrink-0 shadow-[1px_1px_0_#000]">
                          N.º {u.numeral}
                        </span>
                        <div className="min-w-0">
                          <div className="font-game font-bold text-sm text-black truncate group-hover:text-blue-700">
                            {u.nombre}
                          </div>
                          {u.localidad && (
                            <div className="text-[11px] text-slate-500 font-semibold truncate">
                              {u.grupoScout || u.localidad}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="text-green-600 bg-green-100 border border-green-400 px-2 py-0.5 rounded text-[10px] font-bold font-game">
                          ✓ Elegida
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-black font-game font-bold">
                          Elegir →
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-600 font-bold mb-2">
                    No se encontró unidad con "{query}"
                  </p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={handleCustomInputSelect}
                      className="btn-3d btn-yellow py-1.5 px-3 text-xs w-full"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" /> Usar "{query.trim()}" como unidad
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom info helper */}
            <div className="p-2 bg-slate-50 border-t-2 border-slate-200 text-center text-[10px] text-slate-500 font-bold">
              Base de {UNIDADES_SCOUT_DB.length} unidades disponibles
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-[11px] font-bold text-red-600 font-game mt-1">{error}</p>}
    </div>
  );
};
