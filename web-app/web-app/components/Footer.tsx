'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Facebook, Instagram, MessageCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { resolveImageUrl } from '@/lib/image'
import { useSettings } from '@/contexts/SettingsContext'
import { useBrand } from '@/lib/brand'

export default function Footer() {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const placeholders = (config?.form_placeholders || {}) as Record<string, string>
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const { isLeisure, logo, brandName, whatsappFormatted, whatsapp } = useBrand()
    const supabase = createClient()

    async function handleSubscribe(e: React.FormEvent) {
        e.preventDefault()
        const sanitizedEmail = email.trim()
        if (!sanitizedEmail || sanitizedEmail.length < 5) {
            toast.error('Please enter a valid email address')
            return
        }

        setSubmitting(true)
        setSuccess(false)
        try {
            const { error } = await supabase
                .from('subscribers')
                .insert([{ email: sanitizedEmail }])

            if (error) {
                if (error.code === '23505') {
                    toast.error(labels.already_subscribed || 'You are already subscribed!')
                } else {
                    throw error
                }
            } else {
                toast.success(labels.subscribe_success || 'Thank you for subscribing!')
                setSuccess(true)
                
                try {
                    const { notifySubscriptionWelcome } = await import('@/lib/emailActions')
                    await notifySubscriptionWelcome(sanitizedEmail)
                } catch (e) {
                    console.error('Email welcome failed but subscription saved:', e)
                }

                setEmail('')
                // Reset success state after 5 seconds
                setTimeout(() => setSuccess(false), 5000)
            }
        } catch (err) {
            console.error('Error subscribing:', err)
            toast.error(labels.subscribe_error || 'Failed to subscribe. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const contactPhone = isLeisure ? whatsappFormatted : (config?.contactPhone || '')
    const whatsappNumber1 = isLeisure ? whatsapp : (config?.whatsappNumber1 || '')
    const facebookUrl = config?.facebookUrl || ''
    const instagramUrl = config?.instagramUrl || ''
    const tiktokUrl = config?.tiktokUrl || ''



    if (config?.showFooterWeb === false) return null;

    return (
        <footer className="bg-slate-950 text-white w-full border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-6 pt-6 pb-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    
                    <div className="space-y-4">
                        <div>
                            <Link href="/" className="inline-block mb-3 transition-transform hover:scale-105">
                                <img
                                    src="/tlounge-logo-transparent.png"
                                    alt={brandName}
                                    style={{
                                        height: config?.logoHeight ? `${Math.min(parseInt(config.logoHeight), 60)}px` : '60px',
                                        width: 'auto'
                                    }}
                                    className="object-contain"
                                />
                            </Link>
                            <p className="text-slate-300 leading-relaxed text-sm font-medium tracking-wide">
                                {labels.footer_tagline || 'Your local and international holiday provider. Experience safe, secure and memorable holidays with our IATA accredited experts.'}
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            {facebookUrl && (
                                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-red-600 text-white transition-all shadow-lg ring-1 ring-white/5" title="Facebook">
                                    <Facebook size={16} />
                                </a>
                            )}
                            {instagramUrl && (
                                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-red-600 text-white transition-all shadow-lg ring-1 ring-white/5" title="Instagram">
                                    <Instagram size={16} />
                                </a>
                            )}
                            {tiktokUrl && (
                                <a 
                                    href={tiktokUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-[#ff0050] text-white transition-all shadow-lg ring-1 ring-white/5" 
                                    title="TikTok"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-2.54.03-5.08.07-7.62.03-4.44-.02-8.88.02-13.32z" />
                                    </svg>
                                </a>
                            )}
                            {/* LinkedIn, X, and YouTube hidden per user request
                            <a href="https://linkedin.com/company/travellounge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-[#0077b5] text-white transition-all shadow-lg ring-1 ring-white/5" title="LinkedIn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                            <a href="https://x.com/travellounge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-800 text-white transition-all shadow-lg ring-1 ring-white/5" title="X (Twitter)">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                            </a>
                            <a href="https://youtube.com/@travellounge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-red-700 text-white transition-all shadow-lg ring-1 ring-white/5" title="YouTube">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
                            </a>
                            */}
                            {whatsappNumber1 && (
                                <a href={`https://wa.me/${whatsappNumber1.replace(/\s+/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-green-600 text-white transition-all shadow-lg ring-1 ring-white/5" title="WhatsApp">
                                    <MessageCircle size={16} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black mb-4 text-red-600 uppercase tracking-widest">explore</h4>
                        <ul className="space-y-3 text-slate-300 text-sm font-medium">
                            <li><Link href="/hotels" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Hotels & Resorts</Link></li>
                            <li><Link href="/flights" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> International Flights</Link></li>
                            <li><Link href="/cruises" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Luxury Cruises</Link></li>
                            <li><Link href="/activities" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Island Activities</Link></li>
                            <li><Link href="/day-packages" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Day Packages</Link></li>
                            <li><Link href="/local-deals" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Promotional Deals</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black mb-4 text-red-600 uppercase tracking-widest">the agency</h4>
                        <ul className="space-y-3 text-slate-300 text-sm font-medium">
                            <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                            <li><Link href="/about/team" className="hover:text-white transition-colors">Expert Team</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Location & Map</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">Common Questions (FAQ)</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                            <li><Link href="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-black mb-4 text-red-600 uppercase tracking-widest">newsletter</h4>
                            <p className="text-xs font-bold text-white mb-3">
                                {labels.newsletter_tagline || 'Subscribe for luxury travel insights.'}
                            </p>
                                {success ? (
                                    <div className="bg-green-600/10 border border-green-600/20 text-green-500 rounded-xl p-4 text-xs font-black flex items-center gap-2 animate-in zoom-in duration-300">
                                        <CheckCircle2 size={16} />
                                        {labels.subscribe_success || 'Thank you for subscribing!'}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder={placeholders.email_address || "Your email"}
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-red-600/50"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-white hover:text-slate-950 transition-all text-xs uppercase tracking-tight shadow-xl shadow-red-600/10"
                                        >
                                            {submitting ? <Loader2 size={14} className="animate-spin" /> : (labels.go_btn || 'Subscribe')}
                                        </button>
                                    </form>
                                )}
                        </div>

                        <div className="pt-4 border-t border-slate-900">
                            <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-red-600 shadow-lg ring-1 ring-white/5">
                                    <Phone size={12} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 leading-none mb-1">Help Desk</span>
                                    <span className="text-[14px] font-black text-white group-hover:text-red-500 transition-colors tracking-tight">{contactPhone}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 pb-4 border-t border-slate-900 flex flex-col items-center justify-center text-center">
                    <div className="flex flex-col items-center text-slate-500">
                        <p className="font-black tracking-[0.2em] text-[11px] uppercase m-0 p-0 leading-none">
                            © {new Date().getFullYear()} {config?.siteTitle || 'Travel Lounge'}. All Rights Reserved. | Since 1995
                        </p>
                        <p className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-40 m-0 p-0 mt-2 leading-none">
                            Created and Produced by <a href="https://wa.me/23058169420" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">Deven</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
