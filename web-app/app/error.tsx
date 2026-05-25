'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden text-center p-12 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
        
        <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600">
          <AlertCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Something went wrong</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
          The system encountered a logic exception while processing your request. We&apos;ve been notified and are investigating.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => reset()}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em]">
            Reference: {error.digest || 'UNRESOLVED_STATE'}
          </p>
        </div>
      </div>
    </div>
  );
}
