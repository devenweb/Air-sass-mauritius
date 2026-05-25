'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavMenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MobileAccordionProps {
  items: NavMenuItem[];
  level?: number;
  onClose: () => void;
}

export const MobileAccordion: React.FC<MobileAccordionProps> = ({ items, level = 0, onClose }) => {
  return (
    <ul className={cn(
      "flex flex-col w-full",
      level > 0 && "pl-6 mt-4 border-l-2 border-slate-100 dark:border-slate-200 space-y-2"
    )}>
      {items.map((item, index) => (
        <MobileNavItem key={`${item.href}-${index}`} item={item} level={level} onClose={onClose} />
      ))}
    </ul>
  );
};

const MobileNavItem: React.FC<{ item: NavMenuItem; level: number; onClose: () => void }> = ({ item, level, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className="w-full">
      <div className="flex items-center justify-between w-full">
        <Link
          href={item.href}
          className={cn(
            "flex-grow py-5 transition-all duration-300 text-slate-900 border-b border-transparent hover:text-red-600",
            level === 0 ? "text-sm font-black mb-2" : "text-[12px] font-bold text-slate-600 hover:text-red-600"
          )}
          onClick={(e) => {
            if (item.href === '#') {
              e.preventDefault();
              if (hasChildren) setIsOpen(!isOpen);
            } else if (!hasChildren) {
              onClose();
            }
          }}
        >
          {item.label}
        </Link>
        
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 text-slate-500 hover:text-primary transition-colors"
            aria-expanded={isOpen}
            aria-label={`Toggle ${item.label} submenu`}
          >
            <ChevronDown size={20} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <MobileAccordion items={item.children!} level={level + 1} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};
