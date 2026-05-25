'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Mail, Loader2, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { sanitizeHtml } from '@/lib/sanitize'
import { GridSkeleton } from '@/components/LoadingSkeleton'

interface TeamMember {
    id: string
    name: string
    role: string
    title: string | null
    bio: string
    photo_url: string | null
    email: string
}

const roleLabels: Record<string, string> = {
    'super_admin': 'Global Systems Administrator',
    'admin': 'Universal Root Administrator',
    'director': 'Managing Director',
    'manager': 'Operations Manager',
    'staff': 'Standard Staff',
    'receptionist': 'Receptionist',
    'editor': 'Content Manager',
    'sales': 'Sales Consultant',
    'sales_corporate_sr': 'Senior Corporate Sales',
    'sales_corporate': 'Corporate Sales',
    'sales_leisure': 'Leisure Sales Consultant',
    'consultant': 'Travel Consultant',
    'accountant': 'Account Representative'
}

// Map names to local assets in /assets/team/ as a pure fallback
const localPhotoMapping: Record<string, string> = {
    'Leena Jhugroo': '/assets/team/leena.png',
    'Maleekah Amboorallee': '/assets/team/maleekah.png',
    'Manshi Rughoobur': '/assets/team/manshi.png',
    'Nabila Ramjaun': '/assets/team/nabila.png',
    'Nalini Indurjeet': '/assets/team/nalini.png',
    'Kirtee Boodoo': '/assets/team/kirtee.png',
    'Aurelie Carosin': '/assets/team/mandini.png',
    'Mandini Boolauk': '/assets/team/mandini.png',
    'Leena': '/assets/team/leena.png',
    'Maleekah': '/assets/team/maleekah.png',
    'Manshi': '/assets/team/manshi.png',
    'Nabila': '/assets/team/nabila.png',
    'Nalini': '/assets/team/nalini.png',
    'Kirtee': '/assets/team/kirtee.png',
    'Aurelie': '/assets/team/mandini.png',
    'Mandini': '/assets/team/mandini.png'
}

interface TeamContent {
    hero?: {
        badge: string
        title: string
        description: string
        image: string
    }
    team_image?: {
        image: string
    }
    cta?: {
        title: string
        subtitle: string
        button_text: string
        button_link: string
    }
}

export default function TeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([])
    const [content, setContent] = useState<TeamContent | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch team members
                const { data: teamData, error: teamError } = await supabase
                    .from('admins')
                    .select('id, name, role, title, bio, photo_url, email')
                    .eq('is_active', true)
                    .eq('show_on_front_page', true)
                    .order('display_order', { ascending: true })

                if (teamError) throw teamError
                setTeam(teamData || [])

                // Fetch CMS content
                const { data: cmsData } = await supabase
                    .from('content_blocks')
                    .select('section_key, content')
                    .eq('page_slug', 'team')

                if (cmsData) {
                    const blocks: Record<string, unknown> = {}
                    cmsData.forEach((b: any) => blocks[b.section_key] = b.content)
                    setContent(blocks as TeamContent)
                }
            } catch (err) {
                console.error('Error fetching team data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase])

    const cmsHero = content?.hero as any
    const hero = {
        badge: cmsHero?.badge || "Our People",
        title: cmsHero?.title || "Meet the <br />Experts.",
        description: cmsHero?.description || "A dedicated team of IATA-certified professionals committed to making your world-wide travel dreams a reality.",
        image: cmsHero?.image || cmsHero?.image_url || "/assets/heroes/hero-flights.png"
    }
    
    const cmsCta = content?.cta as any
    const cta = {
        title: cmsCta?.title || "Want to Join Our Team?",
        subtitle: cmsCta?.subtitle || "We're always looking for passionate travel enthusiasts.",
        button_text: cmsCta?.button_text || "Send Your CV",
        button_link: cmsCta?.button_link || "/contact"
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
            {/* Hero Section */}
            <div className="relative py-24 flex items-center overflow-hidden bg-slate-900 border-b border-white/10">
                <Image
                    src={resolveImageUrl(hero.image)}
                    alt="Our Team"
                    fill
                    className="object-cover object-center"
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center">
                    {/* Hiding text and buttons on banner as requested
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-lg shadow-red-600/20">
                            {hero.badge}
                        </span>
                        <h1 
                            className="text-3xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight uppercase"
                            dangerouslySetInnerHTML={{ __html: hero.title }}
                        />
                        <p className="text-sm md:text-lg text-white/70 font-medium mb-6 max-w-2xl mx-auto leading-relaxed">
                            {hero.description}
                        </p>
                    </motion.div>
                    */}
                </div>
            </div>

            {/* Team Grid */}
            <section className="py-8 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <GridSkeleton count={3} />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            {/* Left Column: The Boss */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="sticky top-32">
                                    <div className="mb-4 pl-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-12 h-1 bg-red-600 rounded-full" />
                                            <span className="text-xs font-black text-red-600 uppercase tracking-[0.4em]">Leadership</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Our <span className="text-red-600 italic">Visionary</span></h2>
                                    </div>
                                    
                                    {team.filter(m => m.role === 'director').length > 0 ? (
                                        team.filter(m => m.role === 'director').map((boss) => (
                                            <motion.div
                                                key={boss.id}
                                                initial={{ opacity: 0, x: -30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="group px-4"
                                            >
                                                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-red-100 ring-1 ring-gray-100">
                                                    <Image
                                                        src={resolveImageUrl(boss.photo_url || localPhotoMapping[boss.name] || localPhotoMapping[boss.name.split(' ')[0]])}
                                                        alt={boss.name}
                                                        fill
                                                        unoptimized
                                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-12 flex flex-col items-center justify-center text-center text-white">
                                                        <div 
                                                            className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-10 leading-[1.1] line-clamp-6 [&_*]:!text-white break-words"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(boss.bio || "Dedicated travel professional at Travel Lounge.") }}
                                                        />
                                                        <div className="w-full max-w-[220px]">
                                                            <a href={`mailto:${boss.email}`} className="flex items-center justify-center gap-2 bg-white text-red-600 py-4 rounded-full font-black text-sm uppercase tracking-tighter hover:bg-slate-950 hover:text-white transition-all shadow-2xl shadow-black/20">
                                                                <Mail size={18} /> CONTACT
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="absolute bottom-10 left-10 right-10 group-hover:opacity-0 transition-opacity duration-300">
                                                        <div className="bg-red-600 px-3 py-1 inline-block mb-3 shadow-md rounded-xl border border-white/10">
                                                            <span 
                                                                className="text-[14px] font-black text-white uppercase tracking-tight block leading-tight"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml((boss.title || 'Managing Director').replace(/\s+/g, '&nbsp;&nbsp;&nbsp;')) }}
                                                            />
                                                         </div>
                                                        <h3 className="text-3xl font-black text-white leading-tight tracking-tighter flex flex-wrap gap-x-2">
                                                            {boss.name.split(' ')[0]}
                                                            <span className="text-red-500 group-hover:text-white transition-colors">
                                                                {boss.name.split(' ').slice(1).join(' ')}
                                                            </span>
                                                        </h3>
                                                        {boss.bio && (
                                                            <div 
                                                                className="text-white text-sm font-medium leading-relaxed mb-8 line-clamp-6 italic [&_*]:!text-white"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(boss.bio) }}
                                                            />
                                                        )}
                                                        <div className="flex gap-4 mt-4">
                                                            <div className="p-3 bg-white/10 text-white rounded-xl backdrop-blur-sm border border-white/10">
                                                                <Mail size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-8 bg-white rounded-3xl border border-slate-100 text-center">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Leadership profile currently being updated.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: The Team Experts */}
                            <div className="lg:col-span-8">
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-tight mb-2">Operational Excellence</h3>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">The Travel Specialists</h2>
                                </div>

                                {team.filter(m => m.role !== 'director').length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {/* Featured Team Image - Large Banner */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="group xl:col-span-3 mb-6"
                                        >
                                            <div className="relative aspect-[21/7] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 border border-gray-100">
                                                <Image
                                                    // src="/assets/team/team3.jpg"
                                                    src={resolveImageUrl((content as any)?.team_image?.image || "/assets/team/team3.jpg")}
                                                    alt="Royal Travel Agency Team"
                                                    fill
                                                    unoptimized
                                                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
                                            </div>
                                        </motion.div>

                                        {team.filter(m => m.role !== 'director').map((member, i) => (
                                            <motion.div
                                                key={member.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group"
                                            >
                                                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200 border border-gray-100">
                                                    <Image
                                                        src={resolveImageUrl(member.photo_url || localPhotoMapping[member.name] || localPhotoMapping[member.name.split(' ')[0]])}
                                                        alt={member.name}
                                                        fill
                                                        unoptimized
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                                                    
                                                    {/* Smaller Text Overlay for Staff */}
                                                    <div className="absolute bottom-6 left-6 right-6 group-hover:opacity-0 transition-opacity duration-300">
                                                        <div className="bg-red-600 px-3 py-1 inline-block mb-2 shadow-sm rounded-xl border border-white/10">
                                                            <span 
                                                                className="text-[14px] font-black text-white uppercase tracking-tight block leading-tight"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml((member.title || roleLabels[member.role] || member.role).replace(/\s+/g, '&nbsp;&nbsp;&nbsp;')) }}
                                                            />
                                                         </div>
                                                        <h3 className="text-xl font-black text-white leading-tight tracking-tight flex flex-wrap gap-x-2">
                                                            {member.name.split(' ')[0]}
                                                            <span className="text-red-500 group-hover:text-white transition-colors">
                                                                {member.name.split(' ').slice(1).join(' ')}
                                                            </span>
                                                        </h3>
                                                    </div>

                                                    {/* Compact Hover State */}
                                                    <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-8 flex flex-col items-center justify-center text-center text-white">
                                                        <div 
                                                            className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-8 leading-[1.1] line-clamp-5 [&_*]:!text-white break-words"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.bio || "Dedicated travel professional at Travel Lounge.") }}
                                                        />
                                                        <div className="w-full max-w-[180px]">
                                                            <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 bg-white text-red-600 py-3.5 rounded-full font-black text-xs uppercase tracking-tighter hover:bg-slate-950 hover:text-white transition-all shadow-2xl shadow-black/20">
                                                                <Mail size={16} /> CONTACT
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                                        <Users className="mx-auto text-slate-200 mb-4" size={48} />
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Our Experts are off discovering the world.</h3>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Team profiles will be restored shortly.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-8 bg-red-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-4xl font-black mb-6">{cta.title}</h2>
                    <p className="text-xl text-red-50 mb-6 opacity-80">{cta.subtitle}</p>
                    <Link
                        href={cta.button_link}
                        className="inline-flex items-center px-10 py-4 bg-white text-red-600 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all transform hover:scale-105"
                    >
                        {cta.button_text}
                    </Link>
                </div>
            </section>
        </div>
    )
}
