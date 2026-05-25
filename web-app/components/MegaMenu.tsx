/*
'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { type NavMenuItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface MegaMenuProps {
    items: NavMenuItem[]
    onClose: () => void
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ items, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
                "absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-2xl z-50 py-8 px-6 overflow-y-auto max-h-[calc(100vh-100px)]"
            )}
            onMouseLeave={onClose}
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-10">
                {items.map((category, idx) => (
                    <div key={idx} className="space-y-4">
                        <Link 
                            href={category.href}
                            className="block group"
                            onClick={onClose}
                        >
                            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4 group-hover:text-slate-900 transition-colors">
                                {category.label}
                            </h3>
                        </Link>
                        
                        {category.children && category.children.length > 0 && (
                            <ul className="space-y-2.5">
                                {category.children.map((child, cIdx) => (
                                    <li key={cIdx}>
                                        <Link
                                            href={child.href}
                                            className="group flex flex-col"
                                            onClick={onClose}
                                        >
                                            <span className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                                                {child.label}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
*/

