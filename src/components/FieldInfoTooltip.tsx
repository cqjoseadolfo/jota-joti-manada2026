import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface FieldInfoTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  className?: string;
}

export const FieldInfoTooltip: React.FC<FieldInfoTooltipProps> = ({
  content,
  title,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={title || 'Información del campo'}
        className="w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-400 inline-flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors shadow-xs ml-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-2.5 bg-slate-900 text-white rounded-xl border-2 border-black shadow-[3px_3px_0_#000] text-xs font-normal normal-case leading-relaxed pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {title && (
            <div className="font-bold text-yellow-300 font-game mb-1 flex items-center gap-1 text-[11px]">
              <span>💡</span> {title}
            </div>
          )}
          <div className="text-slate-200 text-[11px] font-sans">
            {content}
          </div>
          {/* Triángulo indicador */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-solid border-t-slate-900 border-t-8 border-x-transparent border-x-8 border-b-0 w-0 h-0" />
        </div>
      )}
    </div>
  );
};
