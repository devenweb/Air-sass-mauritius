import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-slate-900 hover:shadow-xl hover:-translate-y-0.5',
        secondary: 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5',
        outline: 'border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        link: 'text-red-600 underline-offset-4 hover:underline lowercase tracking-normal font-bold',
      },
      size: {
        sm: 'h-10 px-6',
        md: 'h-12 px-10',
        lg: 'h-14 px-12 text-[13px]',
        xl: 'h-16 px-14 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Loader2 className="mr-3 h-4 w-4 animate-spin" />}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
