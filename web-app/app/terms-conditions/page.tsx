'use client'

import React from 'react'
import { FileText, Lock, ChevronRight, CheckCircle2, ShieldCheck, Scale, Gavel } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const termsSections = [
    {
        title: "Agreement to Terms",
        content: "By accessing and using TravelLounge.mu, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you are expressly prohibited from using the site and must discontinue use immediately."
    },
    {
        title: "Services & Bookings",
        content: "Royal Travel Agency acts as an agent for third-party service providers (hotels, tour operators, etc.). While we facilitate the booking, the ultimate service delivery is the responsibility of the provider. All bookings are subject to the specific terms and conditions of the respective provider, including cancellation policies."
    },
    {
        title: "Pricing & Payment",
        content: "All prices are listed in Mauritian Rupees (MUR) unless otherwise stated. We reserve the right to correct pricing errors. Full payment or a deposit may be required at the time of booking. Payments are processed through secure gateways to ensure your financial safety."
    },
    {
        title: "Cancellations & Refunds",
        content: "Cancellation policies vary by service provider. Royal Travel Agency may charge an administrative fee for processed cancellations. Refunds, if applicable, will be processed back to the original payment method within a reasonable timeframe, subject to provider approval."
    },
    {
        title: "User Responsibilities",
        content: "Users must provide accurate information when booking. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Prohibited activities include attempting to bypass security features or using the site for fraudulent purposes."
    },
    {
        title: "Intellectual Property",
        content: "The content on this website, including text, graphics, logos, and software, is the property of Royal Travel Agency Ltd and is protected by copyright and intellectual property laws. You may not reproduce or distribute any content without our prior written consent."
    },
    {
        title: "Limitation of Liability",
        content: "Royal Travel Agency shall not be liable for any direct, indirect, or consequential losses arising from the use of our services or the failure of any third-party provider to deliver services as described. Our total liability is limited to the amount paid for the specific booking in question."
    },
    {
        title: "Governing Law",
        content: "These Terms and Conditions are governed by and construed in accordance with the laws of the Republic of Mauritius. Any disputes arising shall be subject to the exclusive jurisdiction of the Mauritian courts."
    }
]

export default function TermsConditionsPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <section className="relative py-16 flex items-center bg-slate-950 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-red-600/5 skew-x-12 transform translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-blue-600/5 -skew-x-12 transform -translate-x-1/2" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/20">
                            <Gavel size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight uppercase tracking-tight">
                            Terms & <span className="text-red-600">Conditions</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                            The legal framework governing your relationship with Travel Lounge. Please read these terms carefully before using our services.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Terms & Conditions', active: true }
                    ]}
                    className="mb-12"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-red-600" />
                                    Trust & Compliance
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">IATA Accredited</p>
                                            <p className="text-xs text-slate-500 font-medium">Industry standard compliance</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Secure Payments</p>
                                            <p className="text-xs text-slate-500 font-medium">Protected financial data</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Transparent Pricing</p>
                                            <p className="text-xs text-slate-500 font-medium">No hidden fees or charges</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-2 relative z-10">Latest Revision</h4>
                                <p className="text-2xl font-black relative z-10">March 20, 2026</p>
                                <p className="text-slate-400 text-sm mt-4 font-medium relative z-10 leading-relaxed">
                                    We update our terms regularly to reflect changes in law and service standards.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-16 pb-24">
                        {termsSections.map((section, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-[10px] font-black w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">0{i+1}</span>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{section.title}</h2>
                                </div>
                                <div className="pl-12">
                                    <p className="text-slate-600 text-lg leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                                {i < termsSections.length - 1 && (
                                    <div className="h-px bg-slate-100 w-full mt-16" />
                                )}
                            </motion.div>
                        ))}

                        <div className="p-12 bg-red-600 text-white rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-red-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black mb-4 leading-tight">Have Legal <br />Questions?</h3>
                                <p className="text-red-100 font-bold opacity-80 max-w-sm">
                                    Our legal team is available to clarify any of our terms and conditions.
                                </p>
                            </div>
                            <a 
                                href="/contact" 
                                className="relative z-10 px-10 py-5 bg-white text-red-600 font-black rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-3 uppercase text-xs tracking-widest"
                            >
                                Contact Support
                                <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

