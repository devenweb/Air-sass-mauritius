'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { resolveImageUrl } from '@/lib/image'
import { sanitizeHtml } from '@/lib/sanitize'
import { useSettings } from '@/contexts/SettingsContext'
import { usePageContent } from '@/hooks/usePageContent'

export default function AboutClient() {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const { content: rawContent, loading: cmsLoading } = usePageContent('about')
    const [content, setContent] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (rawContent && Object.keys(rawContent).length > 0) {
            const raw = rawContent as any;
            setContent({
                hero: raw.section_1_hero,
                identity: raw.section_2_identity,
                mission: raw.section_3_mission
            })
            setLoading(false)
        } else if (!cmsLoading) {
            setLoading(false)
        }
    }, [rawContent, cmsLoading])

    const hero = content?.hero || {
        badge: "Since 1995",
        title: "Defining the Art of <br/> Boutique Travel",
        description: "We don't just book trips; we craft legacies. Royal Travel Agency is Mauritius's premier gateway to extraordinary global experiences and authentic island discoveries.",
        image: ""
    }

    const identity = content?.identity || {
        subtitle: "Who we are",
        title: "Mauritius's Most <br/> Trusted Travel Experts",
        description: "Experience the pinnacle of travel excellence with Royal Travel. Our dedicated team and global network ensure your journey is seamless and extraordinary.",
        quote: "Our mission is to transform every journey into a masterpiece of memories.",
        stats_label: "Years of Excellence",
        stats_value: "29+",
        image_corporate: "/assets/about/corporate.png",
        image_leisure: "/assets/about/leisure.png"
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <section className="relative py-8 flex items-center overflow-hidden bg-slate-950 border-b border-white/10">
                <Image
                    src={resolveImageUrl(hero.image || config?.aboutHeroImage, "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?q=80&w=2070&auto=format&fit=crop")}
                    alt="Royal Travel Agency Mauritius"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-lg shadow-red-600/20">
                            {hero.badge}
                        </span>
                        <h1 className="text-3xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-[1.1]">
                            {(hero.title || '').split('<br />').map((line: string, idx: number) => (
                                <React.Fragment key={idx}>
                                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }} />
                                    {idx < hero.title.split('<br />').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </h1>
                        <p className="text-sm md:text-lg text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
                            {hero.description}
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <span className="text-xs font-black text-red-600 uppercase tracking-[0.4em]">{labels.who_we_are_badge || 'Who we are'}</span>
                                <h2 
                                    className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(identity.title.replace(/<br\s*\/?>/g, ' ')) }}
                                />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <Image
                                    src="/assets/logo-red-bird.png"
                                    alt="Royal Travel Agency"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                    {labels.legacy_label || 'A Legacy of Excellence'}
                                </span>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {identity.description}
                            </p>
                            <div className="p-8 bg-slate-50 border-l-4 border-red-600 rounded-r-[2rem]">
                                <p className="text-xl italic font-medium text-slate-900 leading-relaxed mb-4">
                                    &quot;{identity.quote}&quot;
                                </p>
                                <span className="text-xs font-black uppercase tracking-widest text-red-600">{labels.vision_label || 'The Royal Travel Agency Vision'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-6 pt-8">
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                                     <div className="text-5xl font-black text-red-600 mb-2">{identity.stats_value}</div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{identity.stats_label}</div>
                                </div>
                                <div className="aspect-[4/5] relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                                    <Image src={resolveImageUrl(identity.image_corporate, "/assets/about/corporate.png")} alt="Royal Travel Agency Corporate Services" fill className="object-cover" />
                                </div>
                           </div>
                           <div className="space-y-6">
                                <div className="aspect-[4/5] relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                                    <Image src={resolveImageUrl(identity.image_leisure, "/assets/about/leisure.png")} alt="Royal Travel Agency Leisure Experiences" fill className="object-cover" />
                                </div>
                                <div className="bg-red-600 p-8 rounded-[2.5rem] text-white shadow-2xl">
                                    <div className="text-4xl font-black mb-2">{labels.iata_label || 'IATA'}</div>
                                    <div className="text-xs font-black text-red-100 uppercase tracking-widest">{labels.iata_sublabel || 'Accredited Member'}</div>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
