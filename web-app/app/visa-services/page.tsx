'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
    FileText, CheckCircle, Clock, ShieldCheck, Globe, ArrowRight, HelpCircle, Loader2,
    MessageSquare, Fingerprint, Send, UserCheck, RefreshCw, TrendingUp, MessageCircle, Mail, Calendar, Edit3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { resolveImageUrl } from '@/lib/image'
import { usePageContent } from '@/hooks/usePageContent'
import HeroBanner from '@/components/HeroBanner'

const IconMap: Record<string, React.ElementType> = {
    Globe,
    FileText,
    CheckCircle,
    ShieldCheck,
    Clock,
    HelpCircle,
    MessageSquare,
    Fingerprint,
    Send,
    UserCheck,
    RefreshCw,
    TrendingUp,
    MessageCircle,
    Mail,
    Calendar,
    Edit3
}

export default function VisaServicesPage() {
    const { content, loading } = usePageContent('visa-services')

    const typedContent = content as any
    const hero = typedContent?.hero || { 
        badge: "Expert Assistance", 
        title: "Seamless <span class=\"text-red-500 italic\">Visa Solutions.</span>", 
        description: "Navigating international travel requirements with precision. Royal Travel Agency provides expert guidance, document vetting, and end-to-end processing for all major global destinations.",
        image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop" 
    }

    const steps = (Array.isArray(typedContent?.steps) ? typedContent.steps : typedContent?.steps?.items) || [
        { title: "Consultation", description: "Personalized review of your travel itinerary to determine exact visa requirements for your passport and destination.", icon: "MessageSquare" },
        { title: "Documentation", description: "Comprehensive checklist and guidance on gathering financial proofs, letters of invitation, and professional document vetting.", icon: "FileText" },
        { title: "Submission", description: "Meticulous form filling and submission to embassies, high commissions, or online portals (E-Visas).", icon: "Send" },
        { title: "Biometrics", description: "Scheduling and orientation for your biometrics appointment at VFS Global or respective embassy centers.", icon: "Fingerprint" },
        { title: "Resolution", description: "Real-time tracking of your application and secure collection/delivery of your processed travel documents.", icon: "CheckCircle" }
    ]

    const cta = typedContent?.cta || { 
        title: "Need a Visa for your Next Trip?", 
        description: "Whether it's for the USA, UK, Schengen Area, or Turkey, our specialized visa department is here to ensure a high-success application process.", 
        primary_label: "Contact Visa Expert", 
        secondary_label: "View All Destinations" 
    }

    const sidebar = typedContent?.sidebar || { 
        title: "Why Trust Royal Travel Agency?", 
        features: [
            { title: "IATA Certified", desc: "Decades of professional excellence in global travel documentation.", icon: "ShieldCheck" },
            { title: "Specialized Desk", desc: "Dedicated experts for USA, Canada, and European visas.", icon: "UserCheck" },
            { title: "End-to-End Support", desc: "From the first inquiry to the final passport collection.", icon: "RefreshCw" }
        ], 
        notice_title: "Important Notice", 
        notice_content: "While we provide expert guidance to maximize your success rate, visa issuance is the sole prerogative of the respective diplomatic missions. Fees are non-refundable regardless of the outcome.", 
        disclaimer_label: "Visa Terms & Conditions" 
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-red-600" size={48} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-6">
            {/* Hero Section */}
            <HeroBanner 
                badge={hero.badge}
                title={hero.title}
                description={hero.description || hero.subtitle}
                image={hero.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2017&auto=format&fit=crop"}
                alt="Visa Services"
                className="mb-0"
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 relative z-20">
                <Breadcrumbs 
                    items={[{ label: 'Visa Services', active: true }]} 
                    className="mb-4"
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Process Steps */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-xl shadow-slate-200/60 border border-slate-100">
                            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Our Process</h2>
                            <div className="space-y-8">
                                {steps.map((step: any, i: number) => {
                                    const Icon = IconMap[step.icon] || Globe
                                    return (
                                        <div key={i} className="flex gap-8 group">
                                            <div className="shrink-0 w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                                <Icon className="text-red-600 group-hover:text-white" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-extrabold text-slate-900 mb-2">{step.title}</h3>
                                                <div 
                                                    className="text-slate-500 font-medium leading-relaxed prose prose-slate max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: step.description }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* FAQ/Contact Promo */}
                        {cta && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <HelpCircle size={48} className="text-red-600 mb-6" />
                                    <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">{cta.title}</h3>
                                    <div 
                                        className="text-slate-400 font-medium mb-6 max-w-xl leading-relaxed prose prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: cta.description }}
                                    />
                                    <div className="flex flex-wrap gap-4">
                                        <Link 
                                            href="/contact"
                                            className="px-8 py-4 bg-red-600 text-white rounded-full font-black text-xs tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all inline-block shadow-xl shadow-red-600/20"
                                        >
                                            {cta.primary_label}
                                        </Link>
                                        <Link 
                                            href="/contact"
                                            className="px-8 py-4 bg-white/10 text-white rounded-full font-black text-xs tracking-[0.2em] hover:bg-white/20 transition-all inline-block"
                                        >
                                            {cta.secondary_label}
                                        </Link>
                                    </div>
                                </div>
                                <div className="absolute -bottom-20 -right-20 opacity-10">
                                    <Globe size={300} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Information */}
                    {sidebar && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
                                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-widest">{sidebar.title}</h3>
                                <div className="space-y-4">
                                    {sidebar.features.map((f: any, i: number) => {
                                        const Icon = IconMap[f.icon] || ShieldCheck
                                        return (
                                            <div key={i} className="space-y-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Icon className="text-red-500" size={20} />
                                                </div>
                                                <h4 className="font-extrabold text-slate-900">{f.title}</h4>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-red-600 rounded-[2.5rem] p-10 text-white">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    {sidebar.notice_title}
                                </h3>
                                <div 
                                    className="text-sm font-semibold text-white leading-relaxed mb-6 break-words max-w-none"
                                    dangerouslySetInnerHTML={{ __html: sidebar.notice_content }}
                                />
                                <Link href="/about" className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:translate-x-2 transition-transform">
                                    {sidebar.disclaimer_label} <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
