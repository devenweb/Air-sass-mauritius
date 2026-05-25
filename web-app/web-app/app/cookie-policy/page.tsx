'use client'

import React from 'react'
import { Cookie, ChevronRight, FileText, CheckCircle2, ShieldAlert, MousePointer2, Settings, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const cookieSections = [
    {
        title: "What are Cookies?",
        icon: <Cookie size={20} />,
        content: "Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site."
    },
    {
        title: "Essential Cookies",
        icon: <ShieldAlert size={20} />,
        content: "These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the Website, you cannot refuse them without impacting how our Website functions."
    },
    {
        title: "Performance & Functionality",
        icon: <Settings size={20} />,
        content: "These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality (like videos) may become unavailable."
    },
    {
        title: "Analytics & Customization",
        icon: <History size={20} />,
        content: "These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you."
    },
    {
        title: "Advertising Cookies",
        icon: <MousePointer2 size={20} />,
        content: "These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests."
    }
]

export default function CookiePolicyPage() {
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
                            <Cookie size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight uppercase tracking-tight">
                            Cookie <span className="text-red-600">Policy</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                            We use cookies to improve your experience on our site. This policy explains how and why we use these technologies.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Cookie Policy', active: true }
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
                                    Your Choice
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Opt-out Anytime</p>
                                            <p className="text-xs text-slate-500 font-medium">Manage via browser settings</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Anonymous Data</p>
                                            <p className="text-xs text-slate-500 font-medium">No PII in standard cookies</p>
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
                        {cookieSections.map((section, i) => (
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
                                {i < cookieSections.length - 1 && (
                                    <div className="h-px bg-slate-100 w-full mt-16" />
                                )}
                            </motion.div>
                        ))}

                        <div className="p-12 bg-slate-50 border border-slate-100 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-4 leading-tight text-slate-900">Manage Cookie <br />Preferences</h3>
                                <p className="text-slate-500 font-bold max-w-sm">
                                    You can adjust your cookie settings through your browser at any time.
                                </p>
                            </div>
                            <a 
                                href="/contact" 
                                className="relative z-10 px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl flex items-center gap-3 uppercase text-xs tracking-widest"
                            >
                                Get Help
                                <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
