'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { Loader2, MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ServiceListing from '@/components/ServiceListing'
import { usePageContent } from '@/hooks/usePageContent'

export default function FlightsPage() {
    const { content, loading } = usePageContent('flights')
    const [iframeHeight, setIframeHeight] = useState('800px')
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === 'string' && event.data.startsWith('[iFrameSizer]')) {
                const parts = event.data.split(':')
                if (parts.length > 4) {
                    const newHeight = parseInt(parts[3], 10)
                    if (!isNaN(newHeight) && newHeight > 100) {
                        setIframeHeight(`${newHeight}px`)
                    }
                }
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    if (loading || !isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
        )
    }

    const typedContent = content as any
    const hero = typedContent?.hero || {
        badge: "GLOBAL CONNECTIONS",
        title: "Fly to Your <br /><span class=\"text-red-500 italic\">Dream Destination.</span>",
        subtitle: "Seamless Air Travel Experience",
        description: "Book your world-class flight experiences across hundreds of premium airlines with our state-of-the-art global search engine and expert consultation.",
        image: "/assets/heroes/hero-flights.png"
    }

    const assistance = typedContent?.assistance || {
        badge: "PERSONAL CONCIERGE",
        title: "Need Expert <br /><span class=\"text-red-500 italic\">Assistance?</span>",
        description: "If you prefer personalized assistance for your bespoke flight arrangements, our elite travel consultants are available 24/7 to assist you.",
        cta_primary_label: "Contact Consultant",
        cta_primary_link: "/contact",
        cta_secondary_label: "WhatsApp Concierge",
        cta_secondary_link: "https://wa.me/23055097701"
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Custom High-Fidelity Hero */}
            <div className="relative py-8 flex items-center overflow-hidden bg-slate-900 border-b border-white/10">
                <Image
                    src={resolveImageUrl(hero.image)}
                    alt="Flights"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl"
                    >
                        <h1 
                            className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight uppercase"
                            dangerouslySetInnerHTML={{ __html: hero.title.replace('<br />', ' ').replace('<br/>', ' ') }}
                        />
                    </motion.div>
                </div>
            </div>

            {/* GOL IBE Search Form Integration */}
            <div className="w-full bg-[#F2F5F7] py-8 md:py-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-7xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-900 border-b border-white/5 text-center py-4">
                            <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">
                                Global Flight Search Engine
                            </p>
                        </div>
                        
                        {/* Previous target=_blank preserved per guidelines:
                        src="https://royaltravel.golibe.com/iframe?iframe=1&target=_blank&embedded=true"
                        */}
                        <iframe 
                            id="golIbeIframe"
                            name="golIbeIframe"
                            src="https://royaltravel.golibe.com/iframe?iframe=1&target=_self&embedded=true" 
                            width="100%" 
                            height={iframeHeight}
                            frameBorder="0" 
                            allowTransparency={true}
                            className="w-full transition-all duration-500 ease-in-out"
                            style={{ height: iframeHeight }}
                        ></iframe>
                    </div>
                    
                    {/* Assistance Section - Custom CMS Integration */}
                    <div className="mt-8 max-w-7xl mx-auto">
                        <div className="bg-slate-900 rounded-[3rem] overflow-hidden relative border border-white/5 shadow-2xl flex flex-col lg:flex-row">
                             <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                             
                             <div className="flex-1 p-12 lg:p-8 relative z-10 text-center lg:text-left">
                                {assistance.badge && (
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4 block">
                                        {assistance.badge}
                                    </span>
                                )}
                                <h2 
                                    className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight leading-none"
                                    dangerouslySetInnerHTML={{ __html: assistance.title }}
                                />
                                <p className="text-slate-400 mb-6 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                                    {assistance.description}
                                </p>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                                    <Link 
                                        href={assistance.cta_primary_link} 
                                        className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white hover:text-slate-900 transition-all flex items-center gap-2 group"
                                    >
                                        {assistance.cta_primary_label} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <a 
                                        href={assistance.cta_secondary_link} 
                                        target="_blank"
                                        className="px-8 py-4 bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                                    >
                                        <MessageCircle size={18} className="text-green-500" /> {assistance.cta_secondary_label}
                                    </a>
                                </div>
                             </div>

                             {assistance.image && (
                                <div className="hidden lg:block w-1/3 relative">
                                    <Image
                                        src={resolveImageUrl(assistance.image)}
                                        alt="Need Assistance"
                                        fill
                                        className="object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Service Listing for SEO */}
            <div className="sr-only">
                <ServiceListing
                    title="Book Your Flight"
                    subtitle=""
                    heroImage=""
                    serviceTypes={['flight']}
                    tag="FLIGHT"
                />
            </div>
        </div>
    )
}
