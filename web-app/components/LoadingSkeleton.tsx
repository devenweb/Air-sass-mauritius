import { cn } from '@/lib/utils';

export default function LoadingSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse space-y-4", className)}>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-4/6"></div>
        </div>
    )
}

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg", className)} />
    )
}

export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse", className)}>
            <div className="space-y-4">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/2"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/2"></div>
                </div>
            </div>
        </div>
    )
}

export function GridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}
