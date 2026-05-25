'use client'

import React from 'react'
import { Lock, ChevronRight, FileText, CheckCircle2, Shield, Eye, Database, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const privacySections = [
    {
        title: "Information Collection",
        icon: <Database size={20} />,
        content: "We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, or otherwise when you contact us. This may include names, phone numbers, email addresses, mailing addresses, and billing information."
    },
    {
        title: "How We Use Information",
        icon: <Eye size={20} />,
        content: "We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. This includes facilitating account creation, sending administrative information, and processing your bookings."
    },
    {
        title: "Data Sharing",
        icon: <Shield size={20} />,
        content: "We only share information with your consent, to comply with laws, to provide you with services (e.g., sharing with hotels or airlines), to protect your rights, or to fulfill business obligations. We do not sell your personal data to third parties for marketing purposes."
    },
    {
        title: "Data Security",
        icon: <Lock size={20} />,
        content: "We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure."
    },
    {
        title: "Cookies & Tracking",
        icon: <Fingerprint size={20} />,
        content: "We may use cookies and similar tracking technologies to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy."
    },
    {
        title: "Your Privacy Rights",
        icon: <CheckCircle2 size={20} />,
        content: "In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right to request access and obtain a copy of your personal information, to request rectification or erasure, and to restrict the processing of your personal information."
    }
]

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <section className="relative py-16 flex items-center bg-slate-950 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-red-600/5 skew-x-12 transform translate-x-1/2" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/20">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight uppercase tracking-tight">
                            Privacy <span className="text-red-600">Policy</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                            At Travel Lounge, we are committed to protecting your personal data and your privacy. This policy outlines how we handle your information.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Privacy Policy', active: true }
                    ]}
                    className="mb-12"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <FileText size={24} className="text-red-600" />
                                    At a Glance
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">GDPR Compliant</p>
                                            <p className="text-xs text-slate-500 font-medium">Standard data protection</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">No Data Selling</p>
                                            <p className="text-xs text-slate-500 font-medium">Your data stays yours</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Encryption</p>
                                            <p className="text-xs text-slate-500 font-medium">Bank-grade security</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-2 relative z-10">Last Updated</h4>
                                <p className="text-2xl font-black relative z-10">March 20, 2026</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-16 pb-24">
                        {privacySections.map((section, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-red-600 flex items-center justify-center shrink-0">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{section.title}</h2>
                                </div>
                                <div className="pl-14">
                                    <p className="text-slate-600 text-lg leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                                {i < privacySections.length - 1 && (
                                    <div className="h-px bg-slate-100 w-full mt-16" />
                                )}
                            </motion.div>
                        ))}

                        <div className="p-12 bg-slate-900 text-white rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black mb-4 leading-tight">Privacy <br />Concerns?</h3>
                                <p className="text-slate-400 font-bold max-w-sm">
                                    Email our Data Protection Officer at privacy@travellounge.mu for any queries.
                                </p>
                            </div>
                            <a 
                                href="/contact" 
                                className="relative z-10 px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center gap-3 uppercase text-xs tracking-widest"
                            >
                                Contact Us
                                <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}