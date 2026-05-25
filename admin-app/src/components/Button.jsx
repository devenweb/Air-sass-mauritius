import React from 'react';

const Button = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-red-600/10 disabled:opacity-50 disabled:pointer-events-none active:scale-95';

  const variants = {
    primary: 'bg-red-600 text-white hover:bg-slate-900 shadow-lg shadow-red-600/10',
    secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-300 bg-transparent text-slate-600 hover:bg-slate-50',
  };

  const sizes = {
    sm: 'text-[10px] py-2 px-4',
    md: 'text-xs py-3 px-6',
    lg: 'text-sm py-4 px-8',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export { Button };
