// Assuming this is a basic Input component
import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2"> {/* Reduced spacing here */}
        {label && (
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 transition-all placeholder:font-normal font-medium ${
            error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-slate-300 focus:border-red-600'
          } ${className || ''}`}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';