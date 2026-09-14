import React from 'react';

export interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold rounded-xl shadow-[0_4px_0_#000]',
    md: 'px-5 py-2.5 text-sm md:text-base font-bold rounded-2xl shadow-[0_6px_0_#000]',
    lg: 'px-6 py-3.5 text-base md:text-lg font-bold rounded-2xl shadow-[0_6px_0_#000]',
    xl: 'px-8 py-4 text-lg md:text-xl font-bold rounded-2xl tracking-wide shadow-[0_8px_0_#000]',
  }[size];

  const variantClass = {
    green: 'btn-green',
    red: 'btn-red',
    yellow: 'btn-yellow',
    blue: 'btn-blue',
    orange: 'btn-orange',
    dark: 'btn-dark',
    outline: 'bg-white hover:bg-slate-100 text-black border-4 border-black',
  }[variant];

  const disabledStyles = disabled
    ? 'opacity-40 grayscale cursor-not-allowed transform-none shadow-none pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      disabled={disabled}
      className={`
        btn-3d
        ${sizeStyles}
        ${variantClass}
        ${disabledStyles}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

