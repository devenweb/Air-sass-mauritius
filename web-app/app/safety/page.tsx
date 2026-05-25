'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Shield, Lock, Bell, CheckCircle2, Award, HeadphonesIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { sanitizeHtml } from '@/lib/sanitize'
import { useSettings } from '@/contexts/SettingsContext'

type ContentBlock = {
    section_key: string
    content: unknown
}

type SafetyContent = {
    hero?: {
        label: string
        title: string
        description: string
    }
    pillars?: {
        icon: string
        title: string
        desc: string
    }[]
    protection?: {
        title: string
        description: string
        points: string[]
    }
    emergency?: {
        title: string
        description: string
        call_label: string
        inquiry_label: string
    }
}

const IconMap: Record<string, React.ElementType> = {
    Shield,
    Lock,
    Bell,
    Award,
    HeadphonesIcon
}

export default function SafetyPage() {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const [content, setContent] = useState<SafetyContent | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    const fetchContent = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('content_blocks')
                .select('section_key, content')
                .eq('page_slug', 'safety')

            if (data && data.length > 0) {
                const blocks: Record<string, unknown> = {}
                data.forEach((block: ContentBlock) => {
                    blocks[block.section_key] = block.content
                })
                setContent(blocks as SafetyContent)
            }
        } catch (err) {
            console.error('Safety: Error fetching content blocks:', err)
        }
    }, [supabase])

    useEffect(() => {
        const init = async () => {
            await fetchContent()
            setLoading(false)
        }
        init()
    }, [fetchContent])

    const hero = content?.hero || {
        label: "SAFETY FIRST",
        title: "Your Safety is Our Top Priority",
        description: "Traveling with Royal Travel Agency means traveling with peace of mind. As an IATA accredited agency, we adhere to the highest international safety standards."
    }

    const pillars = content?.pillars || []
    const protection = content?.protection || null
    const emergency = content?.emergency || null

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-8 flex items-center overflow-hidden bg-slate-50">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="w-12 h-12 md:w-20 md:h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
                            <Shield size={40} />
                        </div>
                        <h1 
                            className="text-3xl md:text-7xl font-black text-slate-900 mb-4 leading-tight uppercase"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(hero.title.replace(/Our (.+)/, 'Our <span className="text-red-600">$1</span>')) }}
                        />
                        <p className="text-sm md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
                            {hero.description}
                        </p>
                    </motion.div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <Shield size={500} className="text-slate-900" />
                </div>
            </section>

            {/* Core Safety Pillars */}
            <section className="py-8">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {pillars.map((pillar, i) => {
                            const Icon = IconMap[pillar.icon] || Shield
                            return (
                                <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4">
                                        <Icon size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4">{pillar.title}</h3>
                                    <p className="text-slate-500 leading-relaxed">{pillar.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Trust & Accreditations */}
            {protection && (
                <section className="py-8 bg-slate-900 text-white">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-8">
                            <div className="flex-1">
                                <h2 className="text-4xl font-black mb-6">{protection.title}</h2>
                                <p className="text-lg text-slate-400 mb-4 leading-relaxed">
                                    {protection.description}
                                </p>
                                <ul className="space-y-4">
                                    {protection.points.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className="text-red-600 border-red-600" />
                                            <span className="font-bold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="aspect-square relative rounded-full border-[20px] border-slate-800 flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <Award size={80} className="text-red-600 mx-auto mb-6" />
                                        <div className="text-5xl font-black mb-2 tracking-tighter">IATA</div>
                                        <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">{labels.iata_sublabel || 'Official Accredited Member'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Emergency Contact */}
            {emergency && (
                <section className="py-8 bg-white text-center">
                    <div className="container mx-auto px-6">
                        <div className="max-w-3xl mx-auto bg-slate-50 p-12 md:p-10 rounded-[4rem] border border-slate-100">
                            <HeadphonesIcon size={48} className="text-red-600 mx-auto mb-4" />
                            <h2 className="text-4xl font-black text-slate-900 mb-6">{emergency.title}</h2>
                            <p className="text-lg text-slate-500 mb-6">
                                {emergency.description}
                            </p>
                            <div className="flex flex-col md:flex-row justify-center gap-6">
                                <a href={`tel:${config?.contactPhone || '+2302124070'}`} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl">
                                    {emergency.call_label}
                                </a>
                                <a href="/contact" className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                                    {emergency.inquiry_label}
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
