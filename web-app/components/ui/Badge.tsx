import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, forwardRef } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
        destructive:
          'border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80',
        success:
          'border-transparent bg-emerald-500 text-white hover:bg-emerald-600/80',
        warning:
          'border-transparent bg-amber-500 text-white hover:bg-amber-600/80',
        outline: 'text-slate-950 dark:text-slate-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// MultiSelect component (historically kept here, should be moved later)
type MultiSelectProps = {
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
};

const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ label, placeholder = "Select options...", options, selected, onChange, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleOption = (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter(item => item !== value));
      } else {
        onChange([...selected, value]);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            {label}
          </label>
        )}
        <div 
          ref={dropdownRef} 
          className={cn("relative", className)}
        >
          <button
            type="button"
            className={cn(
                "w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 transition-all font-medium flex justify-between items-center text-sm",
                isOpen ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-300'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={selected.length ? 'text-slate-900' : 'text-slate-400'}>
              {selected.length 
                ? `${selected.length} ${selected.length === 1 ? 'option' : 'options'} selected` 
                : placeholder}
            </span>
            <ChevronDown 
              className={cn("transition-transform", isOpen ? 'rotate-180' : '')} 
              size={18} 
            />
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50",
                      selected.includes(option.value) ? 'bg-slate-50' : ''
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span 
                    className={selected.includes(option.value) ? 'text-slate-900 font-medium' : 'text-slate-700'}
                  >
                    {option.label}
                  </span>
                  {selected.includes(option.value) && (
                    <Check size={18} className="text-red-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';

export { Badge, badgeVariants, MultiSelect };