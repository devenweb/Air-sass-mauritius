import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error 
              ? 'border-red-500 focus-visible:ring-red-500' 
              : 'border-slate-300 focus-visible:ring-red-600',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-[11px] font-black uppercase flex items-center gap-1 ml-2">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-[11px] font-medium text-slate-400 ml-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, helperText, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 transition-all font-medium',
            error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300 focus:border-red-600',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-red-500 text-[11px] font-black uppercase flex items-center gap-1 ml-2">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Input, Select };