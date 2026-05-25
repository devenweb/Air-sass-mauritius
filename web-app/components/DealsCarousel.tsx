'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { GridSkeleton } from '@/components/LoadingSkeleton'
import ServiceCard from './ServiceCard'
import { enrichServicesWithLeadPrice, getServiceLink, SERVICE_SELECT_FIELDS, type Service } from '@/lib/services'

const supabase = createClient()


export default function DealsCarousel({ 
    data: externalData,
    label,
    title
}: { 
    data?: Service[],
    label?: string,
    title?: string
}) {
    const [deals, setDeals] = useState<Service[]>(externalData || [])
    const [loading, setLoading] = useState(!externalData)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [itemsPerPage, setItemsPerPage] = useState(4)

    useEffect(() => {
        const updateItemsPerPage = () => {
            if (window.innerWidth >= 1280) setItemsPerPage(4)
            else if (window.innerWidth >= 1024) setItemsPerPage(3)
            else if (window.innerWidth >= 768) setItemsPerPage(2)
            else setItemsPerPage(1)
        }
        updateItemsPerPage()
        window.addEventListener('resize', updateItemsPerPage)
        return () => window.removeEventListener('resize', updateItemsPerPage)
    }, [])

    useEffect(() => {
        if (externalData) {
            setDeals(externalData)
            setLoading(false)
            return
        }
        loadDeals()
    }, [externalData])

    async function loadDeals() {
        try {
            const { data, error } = await supabase
                .from('services')
                .select(SERVICE_SELECT_FIELDS)
                .eq('is_seasonal_deal', true)
                .eq('is_active', true)
                .limit(10)
                .order('rating', { ascending: false })

            if (error) throw error
            const rawDeals = (data as unknown as any[]) || []
            const flattenedDeals = rawDeals.map(s => ({
                ...s,
                category_slug: s.service_categories?.[0]?.categories?.slug
            }))
            const enrichedDeals = await enrichServicesWithLeadPrice(flattenedDeals)
            setDeals(enrichedDeals)
        } catch (error) {
            console.error('Error loading deals:', error)
        } finally {
            setLoading(false)
        }
    }

    const maxIndex = Math.max(0, deals.length - itemsPerPage)

    const nextSlide = useCallback(() => {
        if (deals.length === 0) return
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, [deals.length, maxIndex])

    const prevSlide = () => {
        if (deals.length === 0) return
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    }

    useEffect(() => {
        if (isPaused || loading || deals.length <= itemsPerPage) return
        const interval = setInterval(nextSlide, 5000)
        return () => clearInterval(interval)
    }, [isPaused, loading, deals.length, itemsPerPage, nextSlide])

    if (loading) return <section className="py-4 bg-slate-50"><div className="max-w-7xl mx-auto px-6"><GridSkeleton count={4} /></div></section>

    return (
        <section className="py-6 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em]">{label || "Exclusive Offers"}</h2>
                        <h3 className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-none">{title || "Promotional Deals"}</h3>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <Link href="/packages" className="hidden md:flex items-center gap-3 text-black font-black text-[10px] uppercase tracking-[0.3em] hover:text-red-600 transition-all">
                            Explore All <ArrowRight size={14} />
                        </Link>
                        
                        <div className="flex items-center gap-3">
                             <button 
                                onClick={prevSlide}
                                className="w-14 h-14 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition-all bg-white shadow-lg"
                                aria-label="Previous"
                             >
                                <ChevronLeft size={24} />
                             </button>
                             <button 
                                onClick={nextSlide}
                                className="w-14 h-14 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition-all bg-white shadow-lg"
                                aria-label="Next"
                             >
                                <ChevronRight size={24} />
                             </button>
                        </div>
                    </div>
                </div>

                <div 
                    className="relative group"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="relative overflow-hidden py-10 -my-10">
                        <motion.div 
                            className="flex"
                            animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        >
                            {deals.map((deal) => (
                                <div 
                                    key={deal.id} 
                                    className="flex-shrink-0 px-4"
                                    style={{ width: `${100 / itemsPerPage}%` }}
                                >
                                    <ServiceCard
                                        id={deal.id}
                                        title={deal.name}
                                        price={deal.lowestPrice || 0}
                                        image={deal.image_url}
                                        duration={deal.duration_days ? `${deal.duration_days} Days` : deal.duration_hours ? `${deal.duration_hours} Hours` : 'Special'}
                                        link={getServiceLink(deal)}
                                        tag={deal.service_type.toUpperCase()}
                                        rating={deal.rating}
                                        service_type={deal.service_type}
                                        isSeasonal={true}
                                        dealNote={deal.deal_note}
                                        region={deal.region}
                                        location={deal.location}
                                        description={deal.description}
                                        short_description={deal.short_description}
                                        banner_url={deal.banner_url}
                                        amenities={deal.amenities}
                                        meal_plans={deal.meal_plans}
                                    />
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Navigation Dots - Premium Style */}
                    <div className="flex justify-center gap-3 mt-4">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === i ? 'bg-red-600 w-12' : 'bg-slate-200 w-4 hover:bg-red-200'}`}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
