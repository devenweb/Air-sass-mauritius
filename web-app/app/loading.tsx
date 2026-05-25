'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-800 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-t-4 border-red-600 animate-spin"></div>
      </div>
      
      <div className="text-center space-y-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] animate-pulse">
          Synchronizing
        </h2>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed mx-auto">
          Preparing your travel experience. Please stand by.
        </p>
      </div>

      <div className="mt-4 w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 w-full -translate-x-full animate-progress-infinity"></div>
      </div>

      <style jsx>{`
        @keyframes progress-infinity {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-infinity {
          animation: progress-infinity 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
