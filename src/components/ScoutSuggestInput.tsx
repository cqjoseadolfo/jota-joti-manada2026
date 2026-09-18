import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, X, Check, Search, Sparkles, History, Bookmark } from 'lucide-react';

interface ScoutSuggestInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  categoryType: 'grupoScout' | 'region';
  suggestions: string[];
  dbSuggestionsSet?: Set<string>;
  onBlurCustom?: (value: string) => void;
}

export const ScoutSuggestInput: React.FC<ScoutSuggestInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  categoryType,
  suggestions = [],
  dbSuggestionsSet = new Set(),
  onBlurCustom,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGrupo = categoryType === 'grupoScout';
  const iconEmoji = isGrupo ? '🏕️' : '📍';
  const labelTipo = isGrupo ? 'Grupo Scout' : 'Región - Localidad';

  // Normalize text for filtering
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const queryNorm = normalize(value || '');

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (!queryNorm) {
      // Prioritize previous DB registrations first, then official catalog, max 25 items
      return suggestions.slice(0, 30);
    }
    return suggestions
      .filter((s) => normalize(s).includes(queryNorm))
      .slice(0, 25);
  }, [suggestions, queryNorm]);

  const exactMatch = useMemo(() => {
    if (!value) return false;
    return suggestions.some((s) => normalize(s) === queryNorm);
  }, [suggestions, queryNorm, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelect(filteredSuggestions[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    if (onBlurCustom) onBlurCustom(item);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        {/* Category Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-lg pointer-events-none select-none z-10">
          {iconEmoji}
        </div>

        {/* Input Field */}
        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onBlur={() => {
            if (onBlurCustom && value.trim()) {
              onBlurCustom(value.trim());
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Buscar o escribir ${labelTipo}...`}
          style={{ paddingLeft: '44px', paddingRight: '54px' }}
          className={`
            input-3d input-with-icon-left input-with-icon-right !pl-11 !pr-14 w-full text-xs sm:text-sm font-semibold text-black
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white'}
            ${error ? 'border-red-600 ring-2 ring-red-500/20' : ''}
          `}
        />

        {/* Action Controls on right */}
        <div className="absolute right-2 flex items-center gap-1 z-10">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-black rounded-md hover:bg-slate-200 transition-colors"
              title="Limpiar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen) inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-600 hover:text-black rounded-md hover:bg-slate-100 transition-colors"
            title={isOpen ? 'Cerrar sugerencias' : 'Ver sugerencias disponibles'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute left-0 right-0 top-full mt-1 z-50
              bg-white border-3 border-black rounded-xl
              shadow-[4px_4px_0_#000] overflow-hidden
              max-h-64 flex flex-col
            "
          >
            {/* Header info / count */}
            <div className="bg-slate-100 px-3 py-1.5 border-b-2 border-slate-200 flex items-center justify-between text-[10px] font-game font-bold text-slate-600 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Search className="w-3 h-3 text-blue-600" />
                Sugerencias {isGrupo ? 'de Grupos Scout' : 'de Regiones'}
              </span>
              <span>
                {filteredSuggestions.length} disponible(s)
              </span>
            </div>

            {/* Scrollable list of suggestions */}
            <div className="overflow-y-auto divide-y divide-slate-100 p-1 space-y-0.5 max-h-52">
              {filteredSuggestions.map((item, idx) => {
                const isFromDb = dbSuggestionsSet.has(item);
                const isSelected = value.trim().toLowerCase() === item.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${item}-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input blur before click
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-xs font-semibold
                      flex items-center justify-between gap-2 transition-colors cursor-pointer
                      ${isSelected ? 'bg-blue-50 text-blue-900 border border-blue-300 font-bold' : ''}
                      ${isHighlighted && !isSelected ? 'bg-yellow-100 text-black' : ''}
                      ${!isSelected && !isHighlighted ? 'text-slate-800 hover:bg-slate-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm shrink-0">{iconEmoji}</span>
                      <span className="truncate">{item}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFromDb ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-game bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-[1px_1px_0_#000]">
                          <History className="w-2.5 h-2.5" />
                          Previo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-game bg-blue-100 text-blue-800 border border-blue-200">
                          <Bookmark className="w-2.5 h-2.5" />
                          Catálogo
                        </span>
                      )}

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Notice when typing a new custom entry */}
              {value.trim() && !exactMatch && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(value.trim());
                  }}
                  className="
                    mt-1 p-2.5 rounded-lg bg-yellow-50 border-2 border-yellow-400 border-dashed
                    cursor-pointer hover:bg-yellow-100 text-black transition-colors
                  "
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold font-game text-[11px] text-amber-900 flex items-center gap-1">
                        Registrar como nuevo:
                        <span className="underline decoration-amber-500 font-extrabold text-black">
                          "{value.trim()}"
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        Al guardar, se incorporará a las sugerencias automáticas para futuros registros.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {filteredSuggestions.length === 0 && !value.trim() && (
                <div className="p-3 text-center text-xs text-slate-500 font-medium">
                  No hay sugerencias previas. Comienza a escribir para registrar uno nuevo.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
