'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Filter, Star, Check, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import SmartImage from './ui/SmartImage'
import { resolveImageUrl } from '@/lib/image'
import { GridSkeleton } from '@/components/LoadingSkeleton'
import ServiceCard from '@/components/ServiceCard'
import SearchBar from '@/components/SearchBar'
import { usePageContent } from '@/hooks/usePageContent'
import { useSettings } from '@/contexts/SettingsContext'
import { enrichServicesWithLeadPrice, getServiceLink, SERVICE_SELECT_FIELDS, type Service } from '@/lib/services'

const supabase = createClient()


interface DestinationListingProps {
    title: string
    subtitle: string
    heroImage: string
    regions?: string[]
    tag: string
    defaultSearchCategory?: string
    pageSlug?: string
    searchPlaceholder?: string
    serviceTypes?: string[]
    categorySlug?: string
}

export default function DestinationListing({
    title,
    subtitle,
    heroImage,
    regions,
    serviceTypes,
    tag,
    defaultSearchCategory,
    pageSlug,
    searchPlaceholder,
    categorySlug
}: DestinationListingProps) {
    const { content: cmsContent } = usePageContent(pageSlug || '')
    const { generalConfig: config } = useSettings()
    const cmsHero = cmsContent?.section_1_hero as any

    const displayTitle = cmsHero?.title || title
    const displaySubtitle = cmsHero?.subtitle || cmsHero?.description || subtitle
    const displayImage = cmsHero?.image || cmsHero?.image_url || heroImage

    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<string>('price-asc')
    const [filterPrice, setFilterPrice] = useState<number>(500000)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedRatings, setSelectedRatings] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const getLowestPrice = (service: Service) => {
        return service.lowestPrice || 0
    }

    const loadServices = React.useCallback(async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('services')
                .select(categorySlug ? `${SERVICE_SELECT_FIELDS.replace(', service_categories(categories(slug))', '')}, service_categories!inner(categories!inner(slug))` : SERVICE_SELECT_FIELDS)
                .eq('is_active', true)

            if (categorySlug) {
                query = query.eq('service_categories.categories.slug', categorySlug)
            } else if (regions && regions.length > 0) {
                query = query.in('region', regions)
            }

            if (serviceTypes && serviceTypes.length > 0) {
                query = query.in('service_type', serviceTypes)
            }

            const { data, error } = await query

            if (error) throw error
            
            const rawServices = (data as unknown as any[]) || []
            const flattenedServices = rawServices.map(s => ({
                ...s,
                category_slug: categorySlug || s.service_categories?.[0]?.categories?.slug
            }))
            const enrichedServices = await enrichServicesWithLeadPrice(flattenedServices)

            setServices(enrichedServices)
        } catch (error) {
            console.error('Error loading services:', error)
        } finally {
            setLoading(false)
        }
    }, [regions, serviceTypes, categorySlug])

    useEffect(() => {
        loadServices()
    }, [loadServices])

    const availableTypes = useMemo(() => {
        const types = new Set(services.map(s => s.service_type))
        return Array.from(types).sort()
    }, [services])

    const toggleType = (type: string) => {
        setSelectedTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        )
    }

    const toggleRating = (rating: number) => {
        setSelectedRatings(prev => 
            prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
        )
    }

    const processedServices = useMemo(() => {
        let result = [...services]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(s => 
                s.name.toLowerCase().includes(term) ||
                (s.location || '').toLowerCase().includes(term) ||
                (s.short_description || s.description || '').toLowerCase().includes(term)
            )
        }

        if (filterPrice) {
            result = result.filter(s => (s.lowestPrice || 0) <= filterPrice)
        }

        if (selectedTypes.length > 0) {
            result = result.filter(s => selectedTypes.includes(s.service_type))
        }

        if (selectedRatings.length > 0) {
            result = result.filter(s => {
                const totalRating = s.rating || 0
                return selectedRatings.some(r => totalRating >= r)
            })
        }

        result.sort((a, b) => {
            if (sortBy === 'price-asc') return getLowestPrice(a) - getLowestPrice(b)
            if (sortBy === 'price-desc') return getLowestPrice(b) - getLowestPrice(a)
            if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0)
            return 0
        })

        return result
    }, [services, filterPrice, selectedTypes, selectedRatings, sortBy])

    return (
        <div className="min-h-screen bg-[#F2F5F7]">
            {/* Hero Section */}
            <div className="relative py-8 flex items-center overflow-hidden bg-slate-900 border-b border-white/10">
                <SmartImage
                    src={displayImage}
                    fallback="/assets/hero/destinations_hero.png"
                    options={{ width: 1920, height: 1080, quality: 90 }}
                    alt={displayTitle}
                    fill
                    className="object-cover opacity-60"
                    priority
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <h1 
                            className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight uppercase"
                            dangerouslySetInnerHTML={{ __html: displayTitle.replace('<br />', ' ').replace('<br/>', ' ') }}
                        />
                        {displaySubtitle && (
                            <p className="mt-4 text-sm md:text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                                {displaySubtitle}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Search Bar */}
            {config?.showSearchBarGlobal !== false && (
                <div className="max-w-7xl mx-auto px-6 -mt-6 mb-4 relative z-40 transform scale-90 md:scale-100">
                    <SearchBar initialCategory={defaultSearchCategory} />
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-4">
                {/* Filter Toggle & Stats Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white p-4 rounded-2xl border border-slate-300 shadow-sm">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Filter size={14} className={showFilters ? "text-red-400" : "text-white"} />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Found <span className="text-slate-900">{processedServices.length}</span> Results
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-red-600/20 cursor-pointer"
                            >
                                <option value="price-asc">Lowest Price</option>
                                <option value="price-desc">Highest Price</option>
                                <option value="rating-desc">Top Rated</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.aside 
                                initial={{ opacity: 0, x: -20, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: '25%' }}
                                exit={{ opacity: 0, x: -20, width: 0 }}
                                className="lg:w-1/4 space-y-6 overflow-hidden hidden lg:block"
                            >
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-300 min-w-[280px]">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Filter size={20} className="text-red-500" />
                                            Filters
                                        </h3>
                                        <button 
                                            onClick={() => {
                                                setFilterPrice(500000);
                                                setSelectedTypes([]);
                                                setSelectedRatings([]);
                                                setSearchTerm('');
                                            }}
                                            className="text-sm font-bold text-red-600 hover:text-red-700"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    
                                    <div className="relative mb-6">
                                        <input
                                            type="text"
                                            placeholder="Search results..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none"
                                        />
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>

                                    {/* Price Filter */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                                            Budget (Up to Rs {filterPrice.toLocaleString()})
                                        </label>
                                        <input
                                            type="range"
                                            min="1000"
                                            max="500000"
                                            step="5000"
                                            value={filterPrice}
                                            onChange={(e) => setFilterPrice(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                                        />
                                        <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                                            <span>Rs 1,000</span>
                                            <span>Rs 500,000+</span>
                                        </div>
                                    </div>

                                    {/* Service Type Filter */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                                            Category
                                        </label>
                                        <div className="space-y-3">
                                            {availableTypes.map(type => (
                                                <label key={type} className="flex items-center group cursor-pointer">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTypes.includes(type)}
                                                            onChange={() => toggleType(type)}
                                                            className="peer h-5 w-5 appearance-none rounded border-2 border-slate-300 checked:bg-red-600 checked:border-red-600 transition-all"
                                                        />
                                                        <Check className="absolute h-3 w-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <span className="ml-3 text-sm font-bold text-slate-600 group-hover:text-slate-900 capitalize">
                                                        {type}s
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                                            Star Rating
                                        </label>
                                        <div className="space-y-3">
                                            {[5, 4, 3].map(rating => (
                                                <label key={rating} className="flex items-center group cursor-pointer">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRatings.includes(rating)}
                                                            onChange={() => toggleRating(rating)}
                                                            className="peer h-5 w-5 appearance-none rounded border-2 border-slate-300 checked:bg-red-600 checked:border-red-600 transition-all"
                                                        />
                                                        <Check className="absolute h-3 w-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <span className="ml-3 flex items-center gap-1">
                                                        {[...Array(rating)].map((_, i) => (
                                                            <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                                                        ))}
                                                        <span className="text-sm font-bold text-slate-600 ml-1">& Up</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Help Card */}
                                    <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="text-lg font-black mb-2 uppercase italic tracking-tighter">Need Help?</h4>
                                            <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">Expert advice is just a click away.</p>
                                            <button className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-red-700 transition-colors uppercase tracking-widest">
                                                Contact Us
                                            </button>
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 opacity-10">
                                            <Filter size={80} />
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Main Content Area */}
                    <main className={showFilters ? "lg:w-3/4 flex-1" : "w-full"}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-slate-100 shadow-sm" />
                                    ))
                                ) : (
                                    processedServices.map(service => (
                                        <motion.div
                                            key={service.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ServiceCard 
                                                id={service.id}
                                                title={service.name}
                                                location={service.location}
                                                price={getLowestPrice(service)}
                                                image={service.image_url}
                                                duration={service.duration_days ? `${service.duration_days} Days` : service.duration_hours ? `${service.duration_hours} Hours` : ''}
                                                link={getServiceLink(service)}
                                                rating={service.rating}
                                                service_type={service.service_type}
                                                region={service.region}
                                                description={service.description}
                                                short_description={service.short_description}
                                                amenities={service.amenities}
                                                meal_plans={service.meal_plans}
                                                isSeasonal={service.is_seasonal_deal}
                                                dealNote={service.deal_note}
                                                banner_url={service.banner_url}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {!loading && processedServices.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">No services found</h3>
                                <p className="text-slate-500 font-medium">Try adjusting your filters to find what you&apos;re looking for.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
