'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Menu, X, Heart, Phone, Mail, Facebook, Instagram, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist } from '@/contexts/WishlistContext'
// import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase'
import { type NavMenuItem } from '@/lib/types'
import { resolveImageUrl } from '@/lib/image'
import { MobileAccordion } from './Navbar/MobileAccordion'
import { NavRecursive } from './Navbar/NavRecursive'
// import { MegaMenu } from './MegaMenu'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { useSettings } from '@/contexts/SettingsContext'
import { useBrand } from '@/lib/brand'

interface NavRow {
    id: string;
    label: string;
    link: string;
    parent_id: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function Navbar() {
    const { isLeisure, brandName, logo, email, whatsapp, whatsappFormatted, contactPhone } = useBrand()

    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [items, setItems] = useState<NavMenuItem[]>([])
    // const [activeMegaMenu, setActiveMegaMenu] = useState<NavMenuItem | null>(null)
    const { wishlist } = useWishlist()
    // const { theme, toggleTheme } = useTheme()
    const supabase = createClient()

    const fetchNavigations = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('navigations')
                .select('id, label, link, parent_id, display_order, is_active')
                .eq('is_active', true)
                .order('display_order', { ascending: true })

            if (error) throw error

            if (data) {
                // Build Tree
                const tree: NavMenuItem[] = []
                const map: Record<string, NavMenuItem & { id: string; parent_id: string | null }> = {}
                
                const rows = data as NavRow[]
                
                rows.forEach((item) => {
                    map[item.id] = { 
                        label: item.label, 
                        href: item.link, 
                        children: [],
                        id: item.id,
                        parent_id: item.parent_id
                    }
                })
                
                rows.forEach((item) => {
                    if (item.parent_id && map[item.parent_id]) {
                        map[item.parent_id].children?.push(map[item.id])
                    } else {
                        tree.push(map[item.id])
                    }
                })
                setItems(tree)
            }
        } catch (err) {
            console.error('Error fetching navigations:', err)
        }
    }, [supabase])

    useEffect(() => {
        fetchNavigations()

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [fetchNavigations])

    const siteTitle = config?.siteTitle || ''
    const facebookUrl = config?.facebookUrl || ''
    const instagramUrl = config?.instagramUrl || ''

    const menuItems = items;

    return (
        <div className="w-full relative">
            <div 
                className={cn(
                    "text-white py-1.5 hidden md:block border-b transition-colors duration-300",
                    isLeisure ? "bg-slate-900 border-slate-800" : "bg-red-600 border-red-700"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest">
                        <div className="flex flex-wrap items-center gap-6">
                            {isLeisure ? (
                                <>
                                    <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap">
                                        <Phone size={12} />
                                        <span>{contactPhone}</span>
                                    </a>
                                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap">
                                        <MessageCircle size={12} className="text-white" />
                                        <span>{whatsappFormatted}</span>
                                    </a>
                                </>
                            ) : (
                                <>
                                    <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap">
                                        <Phone size={12} />
                                        <span>{contactPhone}</span>
                                    </a>
                                    {whatsapp && (
                                        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap">
                                            <MessageCircle size={12} className="text-white" />
                                            <span>{whatsappFormatted}</span>
                                        </a>
                                    )}
                                </>
                            )}
                            <a href={`mailto:${email}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap">
                                <Mail size={12} />
                                <span className="lowercase">{email}</span>
                            </a>
                        </div>

                        <div className="flex items-center gap-4">
                            {facebookUrl && (
                                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                                    <Facebook size={14} />
                                </a>
                            )}
                            {instagramUrl && (
                                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                                    <Instagram size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <nav
                className={cn(
                    "sticky top-0 z-50 transition-all duration-300 w-full",
                    isScrolled 
                        ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-100" 
                        : "bg-white border-b border-slate-50"
                )}
                role="navigation"
                aria-label="Main Navigation"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 z-50 shrink-0">
                            <Image
                                src={logo}
                                alt={brandName}
                                width={parseInt(isLeisure ? "200" : (config?.logoWidth || "240")) || 240}
                                height={parseInt(isLeisure ? "60" : (config?.logoHeight || "72")) || 72}
                                style={{
                                    height: isScrolled ? '40px' : (config?.logoHeight ? `${config.logoHeight}px` : '50px'),
                                    width: 'auto'
                                }}
                                className="w-auto object-contain transition-all duration-300 hover:scale-105"
                                priority
                            />
                        </Link>

                        <div className="hidden lg:flex items-center justify-start flex-grow ml-12">
                            <NavRecursive items={menuItems} />
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* CTA Button */}
                            <Button
                                asChild
                                variant="primary"
                                size="sm"
                                className="hidden md:flex shadow-none hover:shadow-lg transition-all"
                            >
                                <Link href={isLeisure ? "/tailormade?brand=leisure" : "/tailormade"}>
                                    {labels.cta_request_quote || 'Request a Quote'}
                                </Link>
                            </Button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-300 hidden md:block"></div>

                            <div className="flex items-center gap-1 md:gap-3">
                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Link
                                        href="/wishlist"
                                        className="relative w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white transition-all hover:ring-4 hover:ring-red-600/10"
                                        aria-label={`View Wishlist (${wishlist.length} items)`}
                                    >
                                        <Heart 
                                            size={18} 
                                            className={cn(wishlist.length > 0 ? "text-red-600 fill-red-600" : "text-current")} 
                                        />
                                        {wishlist.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-600/40 border-2 border-white dark:border-slate-800">
                                                {wishlist.length}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>

                                <motion.div whileTap={{ scale: 0.9 }} className="lg:hidden">
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="group p-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-5 pr-2 transition-all hover:ring-4 hover:ring-red-600/10"
                                        aria-expanded={isOpen}
                                        aria-controls="navigation-drawer"
                                        aria-label="Toggle navigation menu"
                                    >
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 transition-colors group-hover:text-red-600">
                                            {isOpen ? (labels.close_btn || 'Close') : (labels.menu_btn || 'Menu')}
                                        </span>
                                        <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800">
                                            {isOpen ? <X size={18} /> : <Menu size={18} />}
                                        </div>
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Standard Dropdowns for nested items happen inside DropdownMenuItem now */}


                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]"
                            />

                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-white dark:bg-slate-50 z-[70] shadow-[-20px_0_80px_-20px_rgba(0,0,0,0.15)] flex flex-col"
                            >
                                <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-200">
                                    <Link href="/" onClick={() => setIsOpen(false)}>
                                        <Image
                                            src={logo}
                                            alt={brandName}
                                            width={140}
                                            height={40}
                                            style={{
                                                height: config?.logoHeight ? `${Math.min(parseInt(config.logoHeight), 40)}px` : '40px',
                                                width: 'auto'
                                            }}
                                            className="w-auto object-contain"
                                        />
                                    </Link>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-white rounded-full text-slate-900 border border-slate-200 transition-all font-black text-xs hover:bg-slate-100"
                                        aria-label="Close menu"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto px-10 py-8 custom-scrollbar">
                                    <MobileAccordion items={menuItems} onClose={() => setIsOpen(false)} />
                                </div>

                                <div className="p-10 border-t border-slate-200 bg-slate-100/50">
                                    <Button
                                        asChild
                                        variant="primary"
                                        size="lg"
                                        className="w-full shadow-2xl shadow-red-600/20 py-4 text-sm font-black focus:ring-4 focus:ring-red-600/50"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Link href={isLeisure ? "/tailormade?brand=leisure" : "/tailormade"}>
                                            {labels.cta_request_quote || 'Request a Quote'}
                                        </Link>
                                    </Button>

                                    <div className="mt-4 flex flex-col items-center gap-4 border-b border-slate-200 pb-4">
                                        <a href={`mailto:${email}`} className="flex items-center gap-3 text-slate-900 font-bold text-sm hover:text-red-600 transition-colors">
                                            <Mail size={16} className="text-red-600" />
                                            <span className="lowercase">{email}</span>
                                        </a>
                                        {whatsapp && (
                                            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-900 font-bold text-sm hover:text-red-600 transition-colors">
                                                <MessageCircle size={16} className="text-red-600" />
                                                <span>{whatsappFormatted}</span>
                                            </a>
                                        )}
                                        {/* Phone fallbacks for normal brand */}
                                        {!isLeisure && (
                                            <>
                                                {config?.contactPhone && (
                                                    <a href={`tel:${config.contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-slate-900 font-bold text-sm hover:text-red-600 transition-colors">
                                                        <Phone size={16} className="text-red-600" />
                                                        <span>{config.contactPhone}</span>
                                                    </a>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-10">
                                        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-red-600 transition-all p-2" aria-label="Facebook">
                                            <Facebook size={24} />
                                        </a>
                                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-red-600 transition-all p-2" aria-label="Instagram">
                                            <Instagram size={24} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </nav>
        </div>
    )
}

