'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SmartImage from '@/components/ui/SmartImage'
import ServiceCard from '@/components/ServiceCard'
import { createClient } from '@/lib/supabase'
import { Filter, Star, Check, Search, X, ChevronDown, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GridSkeleton } from '@/components/LoadingSkeleton'
import { cn } from '@/lib/utils'
import SearchBar from '@/components/SearchBar'
import { resolveImageUrl } from '@/lib/image'
import { usePageContent } from '@/hooks/usePageContent'
import { enrichServicesWithLeadPrice, getServiceLink, SERVICE_SELECT_FIELDS, type Service } from '@/lib/services'
import { useSettings } from '@/contexts/SettingsContext'

const supabase = createClient()

const MAURITIUS_REGIONS = ['North', 'East', 'South', 'West', 'Mauritius', 'North Coast', 'East Coast', 'South Coast', 'West Coast']

interface MealPlan {
    label: string
    price?: number
}

interface RoomType {
    id?: string
    name?: string
    type?: string
    max_occupancy?: number
    max_adults?: number
    max_children?: number
    max_teens?: number
    max_infants?: number
    price?: number
    weekday_price?: number
    weekend_price?: number
    prices?: Record<string, number>
}

interface ServiceListingProps {
    title?: string
    subtitle?: string
    heroImage?: string
    serviceTypes: string[]
    excludeRegions?: string[]
    includeRegions?: string[]
    tag: string
    showDateFilter?: boolean
    showCheckOutFilter?: boolean
    showOccupancyFilter?: boolean
    showRoomTypeFilter?: boolean
    showMealPlanFilter?: boolean
    defaultSearchCategory?: string
    pageSlug?: string
    searchPlaceholder?: string
    categorySlug?: string
    compactHero?: boolean
    hideMainSearch?: boolean
    hideHero?: boolean
    activityType?: 'Land' | 'Sea'
}

export default function ServiceListing({
    title,
    subtitle,
    heroImage,
    serviceTypes,
    excludeRegions,
    includeRegions,
    tag,
    searchPlaceholder = "Search by name or location...",
    categorySlug,
    compactHero = false,
    showDateFilter = false,
    showCheckOutFilter = false,
    showOccupancyFilter = false,
    showMealPlanFilter = false,
    showRoomTypeFilter = false,
    hideMainSearch = false,
    hideHero = false,
    defaultSearchCategory,
    pageSlug,
    activityType
}: ServiceListingProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F2F5F7] animate-pulse" />}>
            <ServiceListingInner 
                title={title}
                subtitle={subtitle}
                heroImage={heroImage}
                serviceTypes={serviceTypes}
                excludeRegions={excludeRegions}
                includeRegions={includeRegions}
                tag={tag}
                searchPlaceholder={searchPlaceholder}
                categorySlug={categorySlug}
                compactHero={compactHero}
                showDateFilter={showDateFilter}
                showCheckOutFilter={showCheckOutFilter}
                showOccupancyFilter={showOccupancyFilter}
                showMealPlanFilter={showMealPlanFilter}
                showRoomTypeFilter={showRoomTypeFilter}
                hideHero={hideHero}
                defaultSearchCategory={defaultSearchCategory}
                pageSlug={pageSlug}
                activityType={activityType}
            />
        </Suspense>
    )
}

const getLowestPrice = (service: Service) => {
    return service.lowestPrice || 0
}

function ServiceListingInner({
    title,
    subtitle,
    heroImage,
    serviceTypes,
    excludeRegions,
    includeRegions,
    tag,
    searchPlaceholder,
    categorySlug,
    compactHero,
    showDateFilter,
    showCheckOutFilter,
    showOccupancyFilter,
    showMealPlanFilter,
    showRoomTypeFilter,
    hideMainSearch,
    hideHero,
    defaultSearchCategory,
    pageSlug,
    activityType
}: ServiceListingProps) {
    const { content: cmsContent } = usePageContent(pageSlug || '')
    const cmsHero = cmsContent?.section_1_hero as any

    const displayTitle = cmsHero?.title || title
    const displaySubtitle = cmsHero?.subtitle || cmsHero?.description || subtitle
    const displayImage = cmsHero?.image || cmsHero?.image_url || heroImage
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const placeholders = (config?.form_placeholders || {}) as Record<string, string>
    const searchParams = useSearchParams()
    const urlRegion = searchParams.get('region')

    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<string>('price-asc')
    const [filterPrice, setFilterPrice] = useState<number>(500000)
    const [selectedRegions, setSelectedRegions] = useState<string[]>([])
    const [selectedRatings, setSelectedRatings] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [amenitySearchTerm, setAmenitySearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>([])
    const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([])
    const [checkInDate, setCheckInDate] = useState<string>('')
    const [checkOutDate, setCheckOutDate] = useState<string>('')
    const [adults, setAdults] = useState<number>(() => Number(searchParams.get('adults')) || 2)
    const [teens, setTeens] = useState<number>(() => Number(searchParams.get('teens')) || 0)
    const [children, setChildren] = useState<number>(() => Number(searchParams.get('children')) || 0)
    const [infants, setInfants] = useState<number>(() => Number(searchParams.get('infants')) || 0)
    const [currentPage, setCurrentPage] = useState(1)
    const perPage = 12

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedRegions, selectedRatings, selectedAmenities, selectedMealPlans, selectedRoomTypes, checkInDate, checkOutDate, adults, teens, children, infants, sortBy, filterPrice])

    const loadServices = useCallback(async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('services')
                .select(categorySlug ? `${SERVICE_SELECT_FIELDS.replace(', service_categories(categories(slug))', '')}, service_categories!inner(categories!inner(slug))` : SERVICE_SELECT_FIELDS)
                .eq('is_active', true)

            if (categorySlug) {
                query = query.eq('service_categories.categories.slug', categorySlug)
            }

            const sTypes = serviceTypes?.join(',')
            if (serviceTypes && serviceTypes.length > 0) {
                query = query.in('service_type', serviceTypes)
            }

            if (includeRegions && includeRegions.length > 0) {
                query = query.in('region', includeRegions)
            }

            if (excludeRegions && excludeRegions.length > 0) {
                query = query.not('region', 'in', `(${excludeRegions.join(',')})`)
            }

            if (activityType) {
                query = query.eq('activity_type', activityType)
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
    }, [serviceTypes, includeRegions, excludeRegions, categorySlug, activityType])

    useEffect(() => {
        loadServices()
        
        const initialSearch = searchParams.get('location')
        if (initialSearch) {
            setSearchTerm(initialSearch)
        }
        
        const initialDate = searchParams.get('checkIn')
        if (initialDate) setCheckInDate(initialDate)
        
        const initialOutDate = searchParams.get('checkOut')
        if (initialOutDate) setCheckOutDate(initialOutDate)
    }, [loadServices, searchParams])

    useEffect(() => {
        if (urlRegion) {
            setSelectedRegions([urlRegion])
        }
    }, [urlRegion])

    const toggleRegion = (region: string) => {
        setSelectedRegions(prev => 
            prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
        )
    }

    const toggleRating = (rating: number) => {
        setSelectedRatings(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating])
    }

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        )
    }

    const availableRegions = useMemo(() => {
        const regions = new Set(services.map(s => s.region).filter(Boolean))
        return Array.from(regions).sort() as string[]
    }, [services])

    const allAmenities = useMemo(() => {
        const amenities = new Set<string>()
        services.forEach(s => {
            if (Array.isArray(s.amenities)) {
                s.amenities.forEach(a => {
                    const text = typeof a === 'string' ? a : (a as any).item;
                    if (text) amenities.add(text);
                })
            } else if (typeof s.amenities === 'string') {
                s.amenities.split(',').forEach(a => amenities.add(a.trim()))
            }
        })
        return Array.from(amenities).sort()
    }, [services]);

    const popularAmenities = useMemo(() => {
        const counts: Record<string, number> = {};
        services.forEach(s => {
            let list: string[] = [];
            if (Array.isArray(s.amenities)) {
                list = s.amenities.map(a => typeof a === 'string' ? a : (a as any).item).filter(Boolean);
            } else if (typeof s.amenities === 'string') {
                list = s.amenities.split(',').map(a => a.trim()).filter(Boolean);
            }
            
            new Set(list).forEach(text => {
                counts[text] = (counts[text] || 0) + 1;
            });
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 25)
            .map(entry => entry[0])
            .sort();
    }, [services]);

    const { exactMatches, approximateMatches } = useMemo(() => {
        let exact: Service[] = []
        let approx: Service[] = []

        const totalPax = adults + teens + children + infants
        const normalizedTerm = (searchTerm || '').toLowerCase().trim()

        services.forEach(s => {
            let score = 0
            let isExactCategory = true
            
            // 1. Category Consistency
            if (categorySlug) {
                // If we are in a category page, any result is technically "category exact"
                isExactCategory = true
            }

            // 2. Search Term Matching
            const nameMatch = s.name.toLowerCase().includes(normalizedTerm)
            const locMatch = (s.location || '').toLowerCase().includes(normalizedTerm)
            const regionMatch = (s.region || '').toLowerCase().includes(normalizedTerm)
            const descMatch = (s.short_description || s.description || '').toLowerCase().includes(normalizedTerm)
            
            // Flexible Region Match (North vs North Coast)
            const sRegion = (s.region || '').toLowerCase();
            const sRegionClean = sRegion.replace(' coast', '').trim();
            const termClean = normalizedTerm.replace(' coast', '').trim();
            const flexibleRegionMatch = sRegion.includes(normalizedTerm) || normalizedTerm.includes(sRegion) || (sRegionClean && sRegionClean === termClean);

            const hasSearchMatch = normalizedTerm === '' || nameMatch || locMatch || flexibleRegionMatch || descMatch

            // 3. Occupancy Validation (Deep Search)
            let occupancyMatch = true
            if (totalPax > 0) {
                const sRoomTypes = (s.room_types as any[]) || []
                
                if (s.service_type === 'hotel' && sRoomTypes.length > 0) {
                    // Check if AT LEAST ONE room type can accommodate the group
                    occupancyMatch = sRoomTypes.some(rt => {
                        const rMaxAdults = rt.max_adults ?? rt.max_occupancy ?? 2
                        const rMaxChildren = rt.max_children ?? 0
                        const rMaxTeens = rt.max_teens ?? 0
                        const rMaxInfants = rt.max_infants ?? 0
                        const rTotalMax = rt.max_occupancy ?? (rMaxAdults + rMaxChildren + rMaxTeens + rMaxInfants)

                        // Strict room occupancy check
                        if (adults > rMaxAdults) return false
                        if (teens > rMaxTeens && rMaxTeens !== 0) return false // 0 usually means unlimited or not specified
                        if (children > rMaxChildren && rMaxChildren !== 0) return false
                        if (infants > rMaxInfants && rMaxInfants !== 0) return false
                        if (totalPax > rTotalMax) return false

                        return true
                    })
                } else {
                    // Generic service level check
                    if (s.max_group_size && totalPax > s.max_group_size) occupancyMatch = false
                    if (s.max_adults && adults > s.max_adults) occupancyMatch = false
                    if (s.max_children && (teens + children) > s.max_children) occupancyMatch = false
                }
            }

            // 4. Filters
            let filtersMatch = true
            if (filterPrice && getLowestPrice(s) > filterPrice) filtersMatch = false
            if (selectedRegions.length > 0) {
                const regionMatch = selectedRegions.includes(s.region || '') || (selectedRegions.includes('Mauritius') && MAURITIUS_REGIONS.includes(s.region || ''))
                if (!regionMatch) filtersMatch = false
            }
            if (selectedRatings.length > 0 && (!s.rating || !selectedRatings.includes(Math.floor(s.rating)))) filtersMatch = false
            if (selectedAmenities.length > 0) {
                const sAmenities = Array.isArray(s.amenities) 
                    ? s.amenities.map((a: any) => typeof a === 'string' ? a : a.item).filter(Boolean)
                    : typeof s.amenities === 'string' 
                        ? s.amenities.split(',').map(a => a.trim()) 
                        : []
                if (!selectedAmenities.every(a => sAmenities.includes(a))) filtersMatch = false
            }

            // Final Assignment
            if (hasSearchMatch && occupancyMatch && filtersMatch) {
                exact.push(s)
            } else if (filtersMatch && (hasSearchMatch || occupancyMatch || selectedRegions.length === 0)) {
                // If it passes filters and matches EITHER search OR occupancy, it's a good approximate
                approx.push(s)
            }
        })

        const sortFn = (a: Service, b: Service) => {
            if (sortBy === 'price-asc') return getLowestPrice(a) - getLowestPrice(b)
            if (sortBy === 'price-desc') return getLowestPrice(b) - getLowestPrice(a)
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
            if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0)
            return 0
        }

        return {
            exactMatches: exact.sort(sortFn),
            approximateMatches: approx.sort(sortFn).slice(0, 8) // Limit approximate results
        }
    }, [services, sortBy, filterPrice, selectedRegions, selectedRatings, searchTerm, selectedAmenities, adults, teens, children, infants, categorySlug])

    const paginatedExactMatches = useMemo(() => {
        return exactMatches.slice((currentPage - 1) * perPage, currentPage * perPage)
    }, [exactMatches, currentPage, perPage])

    const totalPages = useMemo(() => {
        return Math.ceil(exactMatches.length / perPage)
    }, [exactMatches, perPage])



    const resetFilters = () => {
        setSearchTerm('')
        setFilterPrice(500000)
        setSelectedRegions([])
        setSelectedRatings([])
        setSelectedAmenities([])
        setAmenitySearchTerm('')
        setSelectedMealPlans([])
        setSelectedRoomTypes([])
        setCheckInDate('')
        setCheckOutDate('')
        setAdults(2)
        setTeens(0)
        setChildren(0)
        setInfants(0)
    }

    return (
        <div className="min-h-screen bg-[#F2F5F7]">
            {/* Hero Section */}
            {!hideHero && (
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
                                dangerouslySetInnerHTML={{ __html: (displayTitle || '').replace('<br />', ' ').replace('<br/>', ' ') }}
                            />
                            {displaySubtitle && (
                                <p className="mt-4 text-sm md:text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                                    {displaySubtitle}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-4">
                {/* Global Search Bar Integration (Below Hero) */}
                {!hideMainSearch && config?.showSearchBarGlobal !== false && (
                    <div className="mb-6 md:mb-8 relative z-40">
                        <SearchBar initialCategory={defaultSearchCategory} />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <AnimatePresence>
                        {(showFilters || showMobileFilters) && (
                            <motion.aside 
                                initial={showMobileFilters ? { opacity: 0 } : { opacity: 0, x: 20, width: 0 }}
                                animate={showMobileFilters ? { opacity: 1 } : { opacity: 1, x: 0, width: '25%' }}
                                exit={showMobileFilters ? { opacity: 0 } : { opacity: 0, x: 20, width: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={cn(
                                    "flex-shrink-0",
                                    showMobileFilters ? "fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none lg:z-auto" : "hidden lg:block lg:w-1/4"
                                )}
                            >
                                <div className={cn(
                                    "bg-white h-full lg:h-auto overflow-y-auto custom-scrollbar",
                                    showMobileFilters 
                                        ? "w-[85%] max-w-[400px] ml-auto p-8 shadow-2xl" 
                                        : "rounded-3xl p-8 shadow-sm border border-slate-300 sticky top-24 max-h-[calc(100vh-120px)]"
                                )}>
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 lg:hidden">
                                <h3 className="text-xl font-bold text-slate-900">Filters</h3>
                                <button onClick={() => setShowMobileFilters(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Filter size={20} className="text-red-600" />
                                    {labels.filter_tools || 'Filter Tools'}
                                </h3>
                                <button 
                                    onClick={resetFilters}
                                    className="text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest"
                                >
                                    {labels.reset_btn || 'Reset'}
                                </button>
                            </div>
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    placeholder={labels.search_placeholder || "Search packages..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>


                            {/* Advanced Filters: Date & Occupancy */}
                            {showOccupancyFilter && (
                                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                        Occupancy
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Adults</span>
                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                <button onClick={() => setAdults(Math.max(1, adults - 1))} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><ChevronDown size={16} /></button>
                                                <span className="flex-1 text-center font-black text-sm">{adults}</span>
                                                <button onClick={() => setAdults(adults + 1)} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors rotate-180"><ChevronDown size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Teens</span>
                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                <button onClick={() => setTeens(Math.max(0, teens - 1))} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><ChevronDown size={16} /></button>
                                                <span className="flex-1 text-center font-black text-sm">{teens}</span>
                                                <button onClick={() => setTeens(teens + 1)} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors rotate-180"><ChevronDown size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Children</span>
                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                <button onClick={() => setChildren(Math.max(0, children - 1))} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><ChevronDown size={16} /></button>
                                                <span className="flex-1 text-center font-black text-sm">{children}</span>
                                                <button onClick={() => setChildren(children + 1)} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors rotate-180"><ChevronDown size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Infants</span>
                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                <button onClick={() => setInfants(Math.max(0, infants - 1))} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><ChevronDown size={16} /></button>
                                                <span className="flex-1 text-center font-black text-sm">{infants}</span>
                                                <button onClick={() => setInfants(infants + 1)} className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors rotate-180"><ChevronDown size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Price Filter */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                    {labels.budget_label || 'Budget'} ({labels.up_to || 'Up to'} Rs {filterPrice.toLocaleString()})
                                </label>
                                <input
                                    type="range"
                                    min="500"
                                    max="500000"
                                    step="500"
                                    value={filterPrice}
                                    onChange={(e) => setFilterPrice(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                                <div className="flex justify-between mt-3 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                    <span>Rs 500</span>
                                    <span>Rs 500k+</span>
                                </div>
                            </div>

                            {/* Region Filter */}
                            {availableRegions.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{labels.region_label || 'Region'}</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableRegions.map(region => (
                                            <button
                                                key={region}
                                                onClick={() => toggleRegion(region)}
                                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                    selectedRegions.includes(region) 
                                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                                }`}
                                            >
                                                {region}
                                                {selectedRegions.includes(region) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Package / Meal Plan Filter */}
                            {showMealPlanFilter && (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{labels.package_type || 'Package Type'}</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['Room Only', 'Bed & Breakfast', 'Half Board', 'Full Board'].map(plan => (
                                            <button
                                                key={plan}
                                                onClick={() => setSelectedMealPlans(prev => 
                                                    prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
                                                )}
                                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                    selectedMealPlans.includes(plan) 
                                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                                }`}
                                            >
                                                {plan}
                                                {selectedMealPlans.includes(plan) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Room Type Filter */}
                            {showRoomTypeFilter && (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{labels.room_type || 'Room Type'}</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['Standard', 'Superior', 'Deluxe', 'Family Room', 'Suite', 'Villa'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedRoomTypes(prev => 
                                                    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                )}
                                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                    selectedRoomTypes.includes(type) 
                                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                                }`}
                                            >
                                                {type}
                                                {selectedRoomTypes.includes(type) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular Amenities / Tags */}
                            {allAmenities.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{labels.popular_tags || 'Amenities & Features'}</label>
                                    
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search amenities (e.g. water heater)..."
                                            value={amenitySearchTerm}
                                            onChange={(e) => setAmenitySearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-600/10 outline-none transition-all"
                                        />
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {/* Popular Amenities: Always show if found in results (Capped at 25) */}
                                        {popularAmenities.map(amenity => (
                                            <button
                                                key={amenity}
                                                onClick={() => toggleAmenity(amenity)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    selectedAmenities.includes(amenity)
                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {amenity}
                                            </button>
                                        ))}

                                        {/* Other Amenities: Only show if searched or already selected */}
                                        {allAmenities
                                            .filter(a => !popularAmenities.includes(a))
                                            .filter(a => 
                                                (amenitySearchTerm.length > 1 && a.toLowerCase().includes(amenitySearchTerm.toLowerCase())) || 
                                                selectedAmenities.includes(a)
                                            )
                                            .map(amenity => (
                                                <button
                                                    key={amenity}
                                                    onClick={() => toggleAmenity(amenity)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all animate-in zoom-in-95 duration-200 ${
                                                        selectedAmenities.includes(amenity)
                                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-dashed border-slate-300'
                                                    }`}
                                                >
                                                    {amenity}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Rating Filter */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{labels.rating_label || 'Rating'}</label>
                                <div className="space-y-2">
                                    {[5, 4, 3].map(rating => (
                                        <button 
                                            key={rating}
                                            onClick={() => toggleRating(rating)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                                                selectedRatings.includes(rating)
                                                ? 'bg-red-50 border border-red-100'
                                                : 'border border-transparent hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                {[...Array(rating)].map((_, i) => (
                                                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                                                ))}
                                                <span className="text-[11px] font-black text-slate-400 ml-1 uppercase">& {labels.up_suffix || 'Up'}</span>
                                            </div>
                                            {selectedRatings.includes(rating) && <Check size={14} className="text-red-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    <main className={cn(
                        "transition-all duration-300",
                        showFilters ? "lg:w-3/4" : "lg:w-full"
                    )}>
                        {/* Mobile Filter Trigger */}
                        <div className="lg:hidden mb-8 flex gap-3">
                            <button 
                                onClick={() => setShowMobileFilters(true)}
                                className="flex-[4] bg-white border border-slate-200 rounded-2xl py-4.5 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 shadow-xl shadow-slate-200/50 active:scale-95 transition-all"
                            >
                                <SlidersHorizontal size={16} className="text-red-600" />
                                {labels.filter_btn || 'Open Filters'}
                            </button>
                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-black text-red-600 shadow-xl shadow-slate-200/50">
                                {exactMatches.length}
                            </div>
                        </div>


                        {/* Sort Bar */}
                        <div className="bg-white rounded-[2rem] p-4 px-6 shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
                                >
                                    <Filter size={18} className={cn("transition-colors", showFilters ? "text-red-600" : "text-slate-400")} />
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                                    </span>
                                </button>
                                <div className="text-slate-500 font-bold">
                                    {labels.found_prefix || 'Found'} <span className="text-slate-900 font-black">{exactMatches.length}</span> {labels.found_suffix || 'adventures for you'}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{labels.sort_by || 'Sort By'}</label>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/10 transition-all cursor-pointer"
                                >
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                    <option value="rating-desc">Top Rated</option>
                                </select>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className={cn(
                            "grid gap-8",
                            showFilters 
                                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <motion.div 
                                            key={`skel-${i}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="animate-pulse bg-white rounded-[3rem] h-[450px] border border-slate-100" 
                                        />
                                    ))
                                ) : exactMatches.length === 0 && approximateMatches.length === 0 ? (
                                    <motion.div 
                                        key="no-match"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="col-span-full py-8 text-center"
                                    >
                                        <div className="bg-white rounded-[3rem] p-8 inline-block border border-slate-100 shadow-xl shadow-slate-200/50">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                                <Filter size={48} />
                                            </div>
                                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{labels.no_results_title || 'No adventures found'}</h3>
                                            <p className="text-slate-500 font-medium max-w-xs mx-auto mb-6"> {labels.no_results_subtitle || "We couldn't find any matches for your current filters. Try broadening your search."} </p>
                                            <button 
                                                onClick={resetFilters}
                                                className="px-12 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                                            >
                                                {labels.reset_all_filters || 'Reset All Filters'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Exact Matches */}
                                        {/* ORIGINAL:
                                        {exactMatches.length > 0 && exactMatches.map((service) => (
                                        */}
                                        {paginatedExactMatches.length > 0 && paginatedExactMatches.map((service) => (
                                            <motion.div
                                                key={service.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                <ServiceCard
                                                    id={service.id}
                                                    title={service.name}
                                                    location={service.location}
                                                    price={getLowestPrice(service)}
                                                    image={service.image_url}
                                                    duration={service.duration_days ? `${service.duration_days} Days` : service.duration_hours ? `${service.duration_hours} Hours` : ''}
                                                    link={getServiceLink(service)}
                                                    tag={service.badge_text !== null && service.badge_text !== undefined ? service.badge_text : (tag || service.service_type.toUpperCase())}
                                                    rating={service.rating}
                                                    service_type={service.service_type}
                                                    isSeasonal={service.is_seasonal_deal}
                                                    dealNote={service.deal_note}
                                                    region={service.region}
                                                    description={service.description}
                                                    short_description={service.short_description}
                                                    banner_url={service.banner_url}
                                                    amenities={service.amenities}
                                                    meal_plans={service.meal_plans}
                                                    activity_type={service.activity_type}
                                                    gallery_images={service.gallery_images}
                                                />
                                            </motion.div>
                                        ))}

                                        {/* Pagination Controls - Commented out to move outside CSS grid & AnimatePresence for layout transition stability
                                        {totalPages > 1 && (
                                            <motion.div 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="col-span-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-sm mt-4 mb-6"
                                            >
                                                <span className="text-sm text-slate-500 font-bold">
                                                    Showing <span className="text-slate-900 font-black">{Math.min(exactMatches.length, (currentPage - 1) * perPage + 1)}</span> to{' '}
                                                    <span className="text-slate-900 font-black">{Math.min(exactMatches.length, currentPage * perPage)}</span> of{' '}
                                                    <span className="text-slate-900 font-black">{exactMatches.length}</span> adventures
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentPage(prev => Math.max(1, prev - 1))
                                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                                        }}
                                                        disabled={currentPage === 1}
                                                        className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <span className="text-sm font-black text-slate-900 px-4">
                                                        Page {currentPage} of {totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                                        }}
                                                        disabled={currentPage === totalPages}
                                                        className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                        */}

                                        {/* Approximate Matches Header */}
                                        {approximateMatches.length > 0 && (
                                            <div className="col-span-full mt-12 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px flex-1 bg-slate-200" />
                                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
                                                        {exactMatches.length > 0 ? "You Might Also Like" : "Suggested Results"}
                                                    </h3>
                                                    <div className="h-px flex-1 bg-slate-200" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Approximate Matches */}
                                        {approximateMatches.length > 0 && approximateMatches.map((service) => (
                                            <motion.div
                                                key={`approx-${service.id}`}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="opacity-75 hover:opacity-100 transition-opacity"
                                            >
                                                <ServiceCard
                                                    id={service.id}
                                                    title={service.name}
                                                    location={service.location}
                                                    price={getLowestPrice(service)}
                                                    image={service.image_url}
                                                    duration={service.duration_days ? `${service.duration_days} Days` : service.duration_hours ? `${service.duration_hours} Hours` : ''}
                                                    link={getServiceLink(service)}
                                                    tag={service.badge_text !== null && service.badge_text !== undefined ? service.badge_text : (tag || service.service_type.toUpperCase())}
                                                    rating={service.rating}
                                                    service_type={service.service_type}
                                                    isSeasonal={service.is_seasonal_deal}
                                                    dealNote={service.deal_note}
                                                    region={service.region}
                                                    description={service.description}
                                                    short_description={service.short_description}
                                                    banner_url={service.banner_url}
                                                    amenities={service.amenities}
                                                    meal_plans={service.meal_plans}
                                                    activity_type={service.activity_type}
                                                    gallery_images={service.gallery_images}
                                                />
                                            </motion.div>
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {exactMatches.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-slate-100 shadow-sm mt-8 mb-6 animate-in fade-in duration-300">
                                <span className="text-sm text-slate-500 font-bold">
                                    Showing <span className="text-slate-900 font-black">{exactMatches.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</span> to{' '}
                                    <span className="text-slate-900 font-black">{Math.min(exactMatches.length, currentPage * perPage)}</span> of{' '}
                                    <span className="text-slate-900 font-black">{exactMatches.length}</span> adventures
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentPage(prev => Math.max(1, prev - 1))
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }}
                                        disabled={currentPage === 1}
                                        className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-black text-slate-900 px-4">
                                        Page {currentPage} of {totalPages || 1}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
