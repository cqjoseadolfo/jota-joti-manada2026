import React from 'react';

interface Card3DProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'panel' | 'white' | 'dark' | 'highlight' | 'amber' | 'blue';
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showRivets?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'panel',
  badge,
  headerAction,
  className = '',
  contentClassName = '',
  showRivets = false,
}) => {
  const variantStyles = {
    panel: 'bg-white text-black border-4 border-black shadow-[0_12px_0_#000]',
    white: 'bg-white text-black border-4 border-black shadow-[0_12px_0_#000]',
    dark: 'bg-[#0f172a] text-white border-4 border-black shadow-[0_12px_0_#000]',
    highlight: 'bg-white text-black border-4 border-black shadow-[0_12px_0_#000]',
    amber: 'bg-[#FEF3C7] text-black border-4 border-black shadow-[0_12px_0_#000]',
    blue: 'bg-[#1E90FF] text-white border-4 border-black shadow-[0_12px_0_#000]',
  }[variant];

  const isDark = variant === 'dark' || variant === 'blue';

  return (
    <div
      className={`
        relative rounded-[24px] overflow-hidden transition-all duration-200
        ${variantStyles} ${className}
      `}
    >
      {/* Corner Decorative Screws/Rivets */}
      {showRivets && (
        <>
          <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-slate-200 border-2 border-black flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-0.5 bg-black rotate-45" />
          </div>
          <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-slate-200 border-2 border-black flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-0.5 bg-black -rotate-45" />
          </div>
          <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-slate-200 border-2 border-black flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-0.5 bg-black -rotate-45" />
          </div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-slate-200 border-2 border-black flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-0.5 bg-black rotate-45" />
          </div>
        </>
      )}

      {/* Header if title or icon provided */}
      {(title || icon || headerAction || badge) && (
        <div className={`px-6 py-4 border-b-4 border-black flex items-center justify-between gap-4 flex-wrap ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-yellow-400 border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center text-black shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className={`font-game text-xl sm:text-2xl font-bold uppercase tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {badge}
            {headerAction}
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className={`p-6 ${contentClassName}`}>{children}</div>
    </div>
  );
};

