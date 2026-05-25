'use client'

import { useState, useEffect } from 'react'
import { MapPin, Check, X, ArrowLeft, ArrowRight, Clock, Heart, Sparkles, Wifi, Waves, Flower2, Dumbbell, Car, GlassWater, ConciergeBell, Wind, Umbrella, WashingMachine, Coffee, Tv, Bath, Bike, Zap, Map, Plane, Briefcase, ShieldCheck, Monitor, Utensils, Moon, ChevronRight, ChevronLeft, ChevronDown, Calendar, Users, Ship } from 'lucide-react'
import SmartImage from '@/components/ui/SmartImage'
import ImageSlider from '@/components/ui/ImageSlider'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWishlist } from '@/contexts/WishlistContext'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, stripHtml } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'
import { sanitizeHtml } from '@/lib/sanitize'
import ReviewsSection from '@/components/ReviewsSection'
import { useSettings } from '@/contexts/SettingsContext'
import { createClient } from '@/lib/supabase'
import { useBrand } from '@/lib/brand'

export type UnifiedService = {
    id: string
    name: string
    description: string
    location: string
    region: string
    lowestPrice: number
    rating: number
    image_url: string
    banner_url?: string
    amenities: string[]
    duration_hours?: number
    duration_days?: number
    max_group_size?: number
    itinerary?: { day?: string; time?: string; title: string; description?: string; desc?: string; image_url?: string }[]
    highlights?: string[]
    included?: string[]
    not_included?: string[]
    cancellation_policy?: string
    terms_and_conditions?: string
    meal_plans?: { id: string; label: string; price: number }[]
    short_description?: string
    secondary_image_url?: string
    gallery_images?: string[]
    activity_type?: string
    variants?: any[]
}

interface UnifiedServiceDetailWrapperProps {
    service: UnifiedService
    serviceType: 'activity' | 'day_package' | 'evening_package' | 'tour' | 'cruise' | 'package'
    backLink?: string
}

const AMENITY_ICONS: Record<string, any> = {
    'wifi': Wifi,
    'free wifi': Wifi,
    'internet': Wifi,
    'pool': Waves,
    'infinity pool': Waves,
    'swimming pool': Waves,
    'spa': Flower2,
    'wellness': Flower2,
    'massage': Flower2,
    'gym': Dumbbell,
    'fitness': Dumbbell,
    'parking': Car,
    'free parking': Car,
    'restaurant': Utensils,
    'dining': Utensils,
    'food': Utensils,
    'bar': GlassWater,
    'lounge': GlassWater,
    'cocktail': GlassWater,
    'room service': ConciergeBell,
    'ac': Wind,
    'air conditioning': Wind,
    'beach': Umbrella,
    'private beach': Umbrella,
    'laundry': WashingMachine,
    'cleaning': WashingMachine,
    'concierge': ConciergeBell,
    'breakfast': Coffee,
    'tv': Tv,
    'television': Tv,
    'security': ShieldCheck,
    'business center': Briefcase,
    'airport shuttle': Plane,
    'transfer': Plane,
    'bath': Bath,
    'bathtub': Bath,
    'bicycle': Bike,
    'bike': Bike,
    'electricity': Zap,
    'power': Zap,
    'view': Map,
    'equipment': Sparkles,
    'gear': Sparkles,
    'ship': Ship,
    'cruise': Ship
};

function getAmenityIcon(amenity: string) {
    const key = amenity.toLowerCase().trim();
    for (const [name, Icon] of Object.entries(AMENITY_ICONS)) {
        if (key.includes(name)) return Icon;
    }
    return Sparkles;
}

export default function UnifiedServiceDetailWrapper({ service, serviceType, backLink: manualBackLink }: UnifiedServiceDetailWrapperProps) {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const router = useRouter()
    const { isLeisure } = useBrand()
    const [date, setDate] = useState('')
    const [participants, setParticipants] = useState(2)
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null)
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    useEffect(() => {
        if (service.variants && service.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(service.variants[0])
        }
    }, [service.variants, selectedVariant])

    useEffect(() => {
        if (service?.region?.toLowerCase() === 'rodrigues' || service?.location?.toLowerCase().includes('rodrigues')) {
            ;(window as any).__RODRIGUES_OVERRIDE__ = true
            window.dispatchEvent(new CustomEvent('brand-override', { detail: 'normal' }))
        }
        return () => {
            ;(window as any).__RODRIGUES_OVERRIDE__ = false
            window.dispatchEvent(new CustomEvent('brand-override', { detail: 'reset' }))
        }
    }, [service])

    const isEvening = serviceType === 'evening_package'
    const isDay = serviceType === 'day_package'
    const isActivity = serviceType === 'activity'
    const isTour = serviceType === 'tour'
    const isCruise = serviceType === 'cruise'
    const isPackage = serviceType === 'package'

    const colorClass = isEvening ? 'blue-600' : isCruise ? 'blue-900' : 'red-600'
    const accentColorClass = isEvening ? 'blue-400' : isCruise ? 'blue-400' : 'red-500'
    const bgAccentClass = isEvening ? 'bg-slate-900' : isCruise ? 'bg-blue-900' : 'bg-red-600'
    const shadowClass = isEvening ? 'shadow-blue-900/20' : isCruise ? 'shadow-blue-900/20' : 'shadow-red-600/20'
    const buttonShadowClass = (isEvening || isCruise) ? 'shadow-[0_20px_50px_rgba(30,58,138,0.3)]' : 'shadow-[0_20px_50px_rgba(220,38,38,0.3)]'
    const buttonBgClass = (isEvening || isCruise) ? (isEvening ? 'bg-slate-900/95' : 'bg-blue-900/95') : 'bg-red-600/95'
    const buttonHoverClass = isEvening ? 'hover:bg-blue-600' : isCruise ? 'hover:bg-blue-800' : 'hover:bg-slate-900'

    const backLink = manualBackLink || (isActivity ? '/activities' : isDay ? '/day-packages' : isEvening ? '/evening-packages' : isTour ? '/tours' : isCruise ? '/cruises' : '/packages')
    const isTravelPackage = backLink === '/travel-packages'
    const backLabel = isActivity ? (labels.back_to_activities || 'Discover More Activities') : 
                      isDay ? (labels.back_to_day_packages || 'Discover More Day Packages') :
                      isEvening ? (labels.back_to_evening_packages || 'Discover More Evening Packages') :
                      isTour ? (labels.back_to_tours || 'Discover More Tours') :
                      isCruise ? (labels.back_to_cruises || 'Discover More Cruises') :
                      isTravelPackage ? (labels.back_to_travel_packages || 'Discover More Travel Packages') :
                      (labels.back_to_packages || 'Discover More Packages')

    const breadcrumbLabel = isActivity ? 'Activities' : isDay ? 'Day Packages' : isEvening ? 'Evening Packages' : isTour ? 'Tours' : isCruise ? 'Cruises' : isTravelPackage ? 'Travel Packages' : 'Packages'

    function toggleWishlist() {
        if (isInWishlist(service.id)) {
            removeFromWishlist(service.id)
            toast.success(labels.wishlist_removed || 'Removed from wishlist')
        } else {
            addToWishlist({
                id: service.id,
                service_type: serviceType,
                name: service.name,
                image_url: service.image_url,
                price: service.lowestPrice,
                location: service.location
            })
            toast.success(labels.wishlist_added || 'Added to wishlist')
        }
    }

    const handleBookNow = () => {
        const queryParams = new URLSearchParams()
        queryParams.append('id', service.id)
        queryParams.append('category', serviceType)
        if (selectedVariant?.id) queryParams.append('variantId', selectedVariant.id)
        if (date) queryParams.append('checkIn', date)
        if (participants) queryParams.append('adults', participants.toString())
        if (isLeisure) queryParams.append('brand', 'leisure')
        
        router.push(`/book?${queryParams.toString()}`)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Floating Back Navigation */}
            <div className="fixed top-32 left-12 z-[100] hidden md:block">
                <Link 
                    href={backLink} 
                    className="flex items-center gap-3 px-6 py-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl text-slate-900 hover:text-red-600 font-black transition-all shadow-2xl shadow-slate-200/50 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] uppercase tracking-[0.2em]">{backLabel}</span>
                </Link>
            </div>

            {/* Mobile Back Bar */}
            <div className="md:hidden bg-white border-b border-slate-100 sticky top-0 z-[100]">
                <div className="px-4 py-4 flex items-center justify-between">
                    <Link href={backLink} className="flex items-center gap-2 text-slate-600 font-bold uppercase text-[11px] tracking-widest">
                        <ArrowLeft size={16} />
                        {labels.back_label || 'Back'}
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleWishlist}
                            className={cn(
                                "p-2 rounded-full transition-all border",
                                isInWishlist(service.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-200 text-slate-400'
                            )}
                        >
                            <Heart size={16} className={isInWishlist(service.id) ? 'fill-white' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-[400px] md:h-[550px]">
                <SmartImage
                    src={service.banner_url || service.image_url}
                    fallback="/assets/placeholders/hero-adventure.png"
                    options={{ width: 1920, height: 1080, quality: 90 }}
                    alt={service.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                
                <div className="absolute bottom-12 left-0 w-full z-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <Breadcrumbs 
                            items={[
                                { label: breadcrumbLabel, href: backLink },
                                { label: service.name, active: true }
                            ]}
                            className="text-white/80 mb-6"
                        />
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white">
                                    <StarRating rating={service.rating} size={14} />
                                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{service.rating} / 5</span>
                                </div>
                                {isActivity && service.activity_type && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-lg text-white">
                                        {service.activity_type === 'Sea' && <Waves size={14} />}
                                        {service.activity_type === 'Land' && <Map size={14} />}
                                        {service.activity_type === 'Air' && <Plane size={14} />}
                                        <span className="text-[11px] font-black uppercase tracking-widest">{service.activity_type}</span>
                                    </div>
                                )}
                                {isDay && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-lg text-white">
                                        <Sparkles size={14} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">DAY PASS</span>
                                    </div>
                                )}
                                {isEvening && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg text-white border border-white/10">
                                        <Moon size={14} className="text-blue-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">EVENING PASS</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-2xl">
                                {service.name.split(' ').join('  ')}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-white/90">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                    <MapPin size={20} className="text-red-500" />
                                    <span className="font-bold text-sm uppercase tracking-wide">{service.location}</span>
                                </div>
                                {(service.duration_hours || service.duration_days) && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <Clock size={20} className="text-white/60" />
                                        <span className="font-bold text-sm uppercase tracking-wide">
                                            {service.duration_days ? `${service.duration_days} Days` : ''}
                                            {service.duration_days && service.duration_hours ? ' • ' : ''}
                                            {service.duration_hours ? `${service.duration_hours} ${labels.hours || 'Hours'}` : ''}
                                        </span>
                                    </div>
                                )}
                                {isTour && service.max_group_size && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <Users size={20} className="text-white/60" />
                                        <span className="font-bold text-sm uppercase tracking-wide">{service.max_group_size} Max Pax</span>
                                    </div>
                                )}
                                {service.meal_plans && service.meal_plans.length > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <Utensils size={20} className="text-white/60" />
                                        <span className="font-bold text-sm uppercase tracking-wide">
                                            {service.meal_plans.map(m => m.label).join(' • ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-30 -mt-20 pb-12">
                <div className="bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl p-8 md:p-16 border border-slate-100 mb-8">
                    <div className="flex flex-col gap-12">
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-6 mb-8">
                                <div className="flex-1">
                                    {service.short_description && (
                                        <p className={cn("text-lg font-black mb-4 text-left", isEvening ? "text-blue-600" : "text-red-600")}>
                                            {stripHtml(service.short_description)}
                                        </p>
                                    )}
                                    <div 
                                        className="text-slate-600 leading-relaxed font-medium text-lg boutique-prose w-full"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.description) }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
                                <div className="space-y-10">
                                    {service.highlights && service.highlights.length > 0 && (
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Key Highlights</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {service.highlights.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start group">
                                                        <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full group-hover:scale-150 transition-transform shrink-0", isEvening ? "bg-blue-600" : "bg-red-600")} />
                                                        <p className="text-slate-600 font-bold leading-relaxed">{typeof item === 'string' ? item : (item as any).item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                        {service.included && service.included.length > 0 && (
                                            <div className="space-y-6">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-green-600">What's Included</h4>
                                                <div className="grid gap-3">
                                                    {service.included.map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 items-center">
                                                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                                                <Check size={12} strokeWidth={3} />
                                                            </div>
                                                            <p className="text-slate-600 font-bold text-sm">{typeof item === 'string' ? item : (item as any).item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {service.not_included && service.not_included.length > 0 && (
                                            <div className="space-y-6">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">What's NOT Included</h4>
                                                <div className="grid gap-3">
                                                    {service.not_included.map((not, idx) => (
                                                        <div key={idx} className="flex gap-3 items-center">
                                                            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                                <X size={12} strokeWidth={3} />
                                                            </div>
                                                            <p className="text-slate-500 font-bold text-sm">{typeof not === 'string' ? not : (not as any).item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {service.secondary_image_url && (
                                    <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl">
                                        <SmartImage 
                                            src={service.secondary_image_url} 
                                            fallback="/assets/placeholders/hero-adventure.png"
                                            options={{ width: 800, height: 500, resize: 'cover' }}
                                            alt={service.name} 
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="max-w-7xl mx-auto px-6 mt-12 pb-32">
                {service.gallery_images && service.gallery_images.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={cn("text-xs font-black uppercase tracking-[0.4em]", isEvening ? "text-blue-600" : "text-red-600")}>
                                {labels.gallery_label || 'Gallery'}
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        const el = document.getElementById('gallery-scroll');
                                        if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
                                    }}
                                    className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900 bg-white"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button 
                                    onClick={() => {
                                        const el = document.getElementById('gallery-scroll');
                                        if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
                                    }}
                                    className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900 bg-white"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div 
                            id="gallery-scroll"
                            className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
                        >
                            {service.gallery_images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className="relative flex-shrink-0 w-[85%] md:w-[400px] aspect-[4/3] rounded-[2rem] overflow-hidden snap-start cursor-pointer group"
                                >
                                    <SmartImage 
                                        src={img} 
                                        fallback="/assets/placeholders/hero-adventure.png"
                                        options={{ width: 800, height: 600, resize: 'cover' }}
                                        alt={`${service.name} gallery ${idx + 1}`} 
                                        fill 
                                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {service.amenities && service.amenities.length > 0 && (
                    <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm mb-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h2 className={cn("text-xs font-black uppercase tracking-[0.4em]", isEvening ? "text-blue-600" : "text-red-600")}>Experience</h2>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight">Amenities & Services</h3>
                            </div>
                            <div className={cn("p-3 rounded-2xl", isEvening ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600")}>
                                <Sparkles size={24} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {service.amenities.map((amenity, idx) => {
                                const Icon = getAmenityIcon(amenity);
                                return (
                                    <div key={idx} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-900 hover:border-slate-900 transition-all duration-300">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className={cn("p-2.5 bg-white rounded-xl text-slate-400 group-hover:text-white transition-all shadow-sm", isEvening ? "group-hover:bg-blue-600" : "group-hover:bg-red-600")}>
                                                <Icon size={20} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white/80 transition-colors">
                                                {amenity}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {service.itinerary && service.itinerary.length > 0 && (
                    <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm mb-8">
                        <h2 className={cn("text-xs font-black uppercase tracking-[0.4em] mb-6", isEvening ? "text-blue-600" : "text-red-600")}>Experience</h2>
                        <h3 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{labels.detailed_itinerary || 'Detailed Plan'}</h3>
                        <div className="space-y-0">
                            {service.itinerary.map((item, idx) => (
                                <div key={idx} className="relative pl-12 pb-8 last:pb-0">
                                    {idx !== service.itinerary!.length - 1 && (
                                        <div className="absolute left-[15px] top-[30px] bottom-0 w-0.5 bg-slate-100" />
                                    )}
                                    <div className={cn("absolute left-0 top-1.5 w-8 h-8 bg-white border-2 rounded-full flex items-center justify-center z-10", isEvening ? "border-blue-600" : "border-red-600")}>
                                        <div className={cn("w-2 h-2 rounded-full", isEvening ? "bg-blue-600" : "bg-red-600")} />
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-3 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-500">
                                                    {item.day}{item.time ? ` · ${item.time}` : ''}
                                                </span>
                                                <h4 className="text-xl font-black text-slate-900 leading-none">{item.title}</h4>
                                            </div>
                                            <div 
                                                className="text-slate-500 font-medium leading-relaxed boutique-prose w-full"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description || item.desc || '') }}
                                            />
                                        </div>
                                        {item.image_url && (
                                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-slate-200 relative">
                                                <SmartImage 
                                                    src={item.image_url} 
                                                    fallback="/assets/placeholders/hero-adventure.png"
                                                    options={{ width: 400, height: 300, resize: 'cover' }}
                                                    alt={item.title} 
                                                    fill
                                                    className="object-cover" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {service.variants && service.variants.length > 0 && (
                    <section id="variants-selection" className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
                        <div 
                            className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors group/header bg-slate-50/30"
                            onClick={() => toggleSection('variants')}
                        >
                            <div className="space-y-1">
                                <h2 className={cn("text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1", isEvening ? "text-blue-600" : "text-red-600")}>
                                    {labels.accommodation_label || 'Accommodation'}
                                </h2>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Choose Your Itinerary</h3>
                            </div>
                            <div className={cn("p-2.5 bg-white rounded-xl text-slate-400 group-hover/header:text-white transition-all shadow-sm", isEvening ? "group-hover/header:bg-blue-600" : "group-hover/header:bg-red-600")}>
                                {collapsedSections.variants ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {!collapsedSections.variants && (
                            <div className="px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-6">
                                    {service.variants.map((variant, idx) => {
                                        const isSelected = selectedVariant?.id === variant.id;
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedVariant(variant)}
                                                className={cn(
                                                    "group relative overflow-hidden transition-all duration-500 cursor-pointer",
                                                    isSelected 
                                                        ? "ring-2 shadow-2xl scale-[1.01] bg-slate-900 border-transparent rounded-[2rem] p-3" 
                                                        : "bg-white border border-slate-100 hover:shadow-xl rounded-[2rem] p-3 hover:border-slate-300",
                                                    isSelected && (isEvening ? "ring-blue-600" : "ring-red-600")
                                                )}
                                            >
                                                <div className="flex flex-col md:flex-row gap-8">
                                                    <div className="w-full md:w-72 h-64 md:h-auto relative overflow-hidden rounded-[2rem] group">
                                                        <ImageSlider 
                                                            images={[variant.image_url || service.image_url || '/placeholder.jpg', ...(variant.images || [])]} 
                                                            alt={variant.name || 'Variant'}
                                                            aspectRatio="h-full"
                                                            className="w-full h-full"
                                                        />
                                                        {/* Labels overlay */}
                                                        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                                                            <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-black text-slate-900 uppercase tracking-widest shadow-sm border border-slate-200">
                                                                {variant.type || 'Itinerary'}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className={cn("absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-20", isEvening ? "bg-blue-600/20" : "bg-red-600/20")}>
                                                                <div className={cn("bg-white p-2 rounded-full shadow-lg", isEvening ? "text-blue-600" : "text-red-600")}>
                                                                    <Check size={20} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-between py-2">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className={cn("text-2xl font-black tracking-tight", isSelected ? "text-white" : "text-slate-900")}>
                                                                    {variant.name}
                                                                </h4>
                                                                <div className="text-right">
                                                                    <div className={cn("text-2xl font-black", isSelected ? (isEvening ? "text-blue-400" : "text-red-400") : (isEvening ? "text-blue-600" : "text-red-600"))}>
                                                                        MUR {(variant.price || service.lowestPrice || 0).toLocaleString()}
                                                                    </div>
                                                                    <div className={cn("text-[11px] font-black uppercase tracking-widest", isSelected ? "text-slate-400" : "text-slate-500")}>
                                                                        {isTravelPackage ? (labels.per_person || 'Per Person') : (labels.per_package || 'Per Package')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div 
                                                                className={cn("text-sm mb-4 font-medium leading-relaxed boutique-prose w-full", isSelected ? "text-slate-300" : "text-slate-500")}
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(variant.description || `Select this itinerary for your package.`) }}
                                                            />
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className={cn(
                                                                        "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                        isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                    )}>
                                                                        <Users size={12} className="shrink-0" />
                                                                        {variant.max_adults || 2} {(variant.max_adults || 2) === 1 ? (labels.adult_label || 'Adult') : (labels.adults_label || 'Adults')}
                                                                    </span>
                                                                    {variant.max_teens > 0 && (
                                                                        <span className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                            isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                        )}>
                                                                            <Users size={12} className="shrink-0" />
                                                                            {variant.max_teens} {variant.max_teens === 1 ? (labels.teen_label || 'Teen') : (labels.teens_label || 'Teens')} (UP TO 17 YRS)
                                                                        </span>
                                                                    )}
                                                                    {variant.max_children > 0 && (
                                                                        <span className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                            isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                        )}>
                                                                            <Users size={12} className="shrink-0" />
                                                                            {variant.max_children} {variant.max_children === 1 ? (labels.child_label || 'Child') : (labels.children_label || 'Children')}
                                                                        </span>
                                                                    )}
                                                                    {variant.max_infants > 0 && (
                                                                        <span className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                            isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                        )}>
                                                                            <Users size={12} className="shrink-0" />
                                                                            {variant.max_infants} {variant.max_infants === 1 ? (labels.infant_label || 'Infant') : (labels.infants_label || 'Infants')}
                                                                        </span>
                                                                    )}
                                                                    {variant.meal_plan && (
                                                                        <span className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                            isSelected ? "bg-white/10 border-white/10 text-amber-300" : "bg-amber-50 border-amber-100 text-amber-600"
                                                                        )}>
                                                                            <Utensils size={12} className="shrink-0" />
                                                                            {variant.meal_plan}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 mt-6">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedVariant(variant);
                                                                }}
                                                                className={cn(
                                                                    "px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-lg",
                                                                    isSelected 
                                                                        ? "bg-white text-slate-900 hover:bg-slate-50 shadow-white/10" 
                                                                        : (isEvening ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20" : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20")
                                                                )}
                                                            >
                                                                {labels.select_itinerary || 'Select Itinerary'}
                                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm mb-8 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-8 transition-transform group-hover:scale-110 duration-700" />
                    <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {service.cancellation_policy && (
                            <section>
                                <h2 className={cn("text-[11px] font-black uppercase tracking-[0.4em] mb-4", isEvening ? "text-blue-600" : "text-red-600")}>Refund Policy</h2>
                                <h3 className="text-3xl font-black text-slate-900 mb-6">Cancellation</h3>
                                <div 
                                    className="text-slate-500 font-medium leading-relaxed boutique-prose w-full"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.cancellation_policy) }}
                                />
                            </section>
                        )}
                        {service.terms_and_conditions && (
                            <section>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Legal Notice</h2>
                                <h3 className="text-3xl font-black text-slate-900 mb-6">Terms & Conditions</h3>
                                <div 
                                    className="text-slate-500 font-medium leading-relaxed boutique-prose w-full"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.terms_and_conditions) }}
                                />
                            </section>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <ReviewsSection serviceId={service.id} serviceType={serviceType} />
                </div>
            </div>

            {/* Floating CTA */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50] w-[92%] max-w-[380px] animate-in slide-in-from-bottom duration-700">
                <Button 
                    size="xl" 
                    onClick={handleBookNow}
                    disabled={service.variants && service.variants.length > 0 && !selectedVariant}
                    className={cn(
                        "w-full rounded-full h-16 flex items-center justify-between px-8 backdrop-blur-md transition-all border-2 border-white/20 text-white", 
                        buttonShadowClass, buttonBgClass, buttonHoverClass,
                        (service.variants && service.variants.length > 0 && !selectedVariant) ? "opacity-50 cursor-not-allowed" : ""
                    )}
                >
                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{selectedVariant ? (labels.price_label || 'Price') : (labels.as_from || 'As From')}</span>
                        <span className="font-black text-xl tracking-tight">Rs {(selectedVariant?.price || service?.lowestPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-black uppercase tracking-widest text-xs">
                            {service.variants && service.variants.length > 0 && !selectedVariant ? "Select an Itinerary" : (labels.request_quote_btn || 'Request a Quote')}
                        </span>
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </Button>
            </div>
        </div>
    )
}
