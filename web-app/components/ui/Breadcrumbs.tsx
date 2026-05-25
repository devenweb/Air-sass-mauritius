import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex py-0', className)}>
      <ol className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <li className="flex items-center">
          <Link
            href="/"
            className="text-slate-400 hover:text-red-600 transition-colors flex items-center"
            aria-label="Home"
          >
            <Home size={12} className="mr-2" />
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight size={10} className="mx-2 text-slate-300" />
            {item.href && !item.active ? (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-red-600 font-black" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
