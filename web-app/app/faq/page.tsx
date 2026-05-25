'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { ChevronDown, Loader2, Mail, MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { useSettings } from '@/contexts/SettingsContext'
import { sanitizeHtml } from '@/lib/sanitize'

const supabase = createClient()

type FAQ = {
    id: string
    category: string
    question: string
    answer: string
    order_index: number
}

type GroupedFAQ = {
    category: string
    questions: { q: string, a: string }[]
}

interface PageContent {
    hero?: {
        badge: string
        title: string
        subtitle: string
        description: string
        image: string
    }
}

export default function FAQPage() {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const [openItems, setOpenItems] = useState<string[]>([])
    const [faqData, setFaqData] = useState<GroupedFAQ[]>([])
    const [loading, setLoading] = useState(true)
    const [pageContent, setPageContent] = useState<PageContent | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function init() {
            setLoading(true)
            await Promise.all([
                loadFAQs(),
                loadPageContent()
            ])
            setLoading(false)
        }
        init()
    }, [])

    async function loadPageContent() {
        const { data } = await supabase
            .from('content_blocks')
            .select('section_key, content')
            .eq('page_slug', 'faq')
        
        if (data) {
            const blocks: Record<string, unknown> = {}
            data.forEach((b: any) => {
                const key = b.section_key.replace(/^section_\d+_/, '')
                blocks[key] = b.content
            })
            setPageContent(blocks as PageContent)
        }
    }

    async function loadFAQs() {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('id, category, question, answer, order_index')
                .eq('is_published', true)
                .order('order_index', { ascending: true })

            if (error) throw error

            if (data && data.length > 0) {
                const grouped: { [key: string]: GroupedFAQ } = {}
                data.forEach((faq: FAQ) => {
                    if (!grouped[faq.category]) {
                        grouped[faq.category] = { category: faq.category, questions: [] }
                    }
                    grouped[faq.category].questions.push({ q: faq.question, a: faq.answer })
                })
                setFaqData(Object.values(grouped))
            }
        } catch (err) {
            console.error('Error fetching FAQs:', err)
        }
    }

    function toggleItem(id: string) {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const filteredFaqs = faqData.filter(cat => 
        cat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.questions.some(q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) || q.a.toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
            cat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
            q.a.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }))

    const hero = pageContent?.hero || {
        badge: "HELP CENTER",
        title: "How Can We <br /><span class=\"text-red-500 italic\">Help You?</span>",
        subtitle: "Discover Frequently Asked Questions",
        description: "Find everything you need to know about our luxury travel services, booking processes, and travel policies in one comprehensive guide.",
        image: "https://images.unsplash.com/photo-1454165833767-027ffea9e612"
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
            {/* Custom High-Fidelity Hero */}
            <div className="relative py-8 flex items-center overflow-hidden bg-slate-900 border-b border-white/10">
                <Image
                    src={resolveImageUrl(hero.image)}
                    alt="FAQ"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-lg shadow-red-600/20">
                            {hero.badge}
                        </span>
                        <h1 
                            className="text-3xl md:text-6xl font-black text-white mb-4 leading-[1.1] tracking-tight uppercase"
                            dangerouslySetInnerHTML={{ __html: hero.title }}
                        />
                        <p className="text-sm md:text-xl text-red-100 font-bold mb-6 tracking-wide uppercase opacity-90">
                            {hero.subtitle}
                        </p>
                        <p className="text-sm md:text-lg text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
                            {hero.description}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-20">
                {/* Search Bar - Repositioned */}
                <div className="max-w-4xl mx-auto mb-4">
                    <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-100 flex items-center">
                         <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                            <input
                                type="text"
                                placeholder={labels.faq_search_placeholder || 'Search for answers...'}
                                className="w-full pl-8 pr-8 py-5 rounded-full focus:outline-none text-lg font-bold placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:text-xs placeholder:tracking-widest"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                         </div>
                         <button className="bg-red-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all flex items-center gap-2">
                             Search
                         </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    {filteredFaqs.length > 0 ? (
                        <div className="space-y-4">
                            {filteredFaqs.map((category, catIdx) => (
                                <div key={catIdx}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-0.5 flex-1 bg-slate-100" />
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic whitespace-nowrap">
                                            {category.category}
                                        </h2>
                                        <div className="h-0.5 flex-1 bg-slate-100" />
                                    </div>
                                    <div className="space-y-4">
                                        {category.questions.map((faq, qIdx) => {
                                            const id = `${catIdx}-${qIdx}`
                                            const isOpen = openItems.includes(id)

                                            return (
                                                <div
                                                    key={qIdx}
                                                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-red-600 shadow-xl' : 'border-slate-100 shadow-sm hover:border-red-600/30'}`}
                                                >
                                                    <button
                                                        onClick={() => toggleItem(id)}
                                                        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                                                    >
                                                        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-red-600' : 'text-slate-900'}`}>{faq.q}</span>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-red-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                                            <ChevronDown size={18} />
                                                        </div>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-8 pb-4">
                                                            <div className="h-px bg-slate-100 mb-6" />
                                                            <div 
                                                                className="text-slate-600 leading-relaxed text-lg font-light boutique-prose"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.a) }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-white rounded-3xl border border-slate-100">
                             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching questions found.</p>
                        </div>
                    )}

                    {/* Contact CTA */}
                    <div className="mt-8 bg-slate-900 rounded-[3rem] p-8 text-center text-white overflow-hidden relative border border-white/5 shadow-2xl">
                         <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                         <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/5 rounded-full blur-[80px] -ml-16 -mb-8" />
                         
                         <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">{labels.faq_cta_title || 'Still seeking answers?'}</h2>
                            <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg leading-relaxed">{labels.faq_cta_subtitle || 'Our world-class support team is available 24/7 to assist with your bespoke travel arrangements.'}</p>
                            <div className="flex flex-wrap justify-center gap-8">
                                <Link href="/contact" className="px-10 py-5 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white hover:text-slate-900 transition-all shadow-2xl shadow-red-600/30 flex items-center gap-3">
                                   <Mail size={18} /> {labels.email_support_label || 'Email Concierge'}
                                </Link>
                                <a href={`https://wa.me/${config?.whatsappNumber1?.replace(/\D/g, '') || '23055097701'}`} target="_blank" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/20 transition-all flex items-center gap-3 border border-white/10">
                                   <MessageCircle size={18} className="text-green-500" /> {labels.whatsapp_chat_label || 'WhatsApp Support'}
                                </a>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
