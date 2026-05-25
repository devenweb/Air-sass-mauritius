'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Calendar,
    Check,
    X,
    Moon,
    MapPin,
    ArrowLeft,
    Heart,
    ChevronDown,
    ChevronRight,
    MessageCircle,
    ArrowRight,
    Utensils,
    Wifi, 
    Waves, 
    Flower2, 
    Dumbbell, 
    Car, 
    GlassWater, 
    ConciergeBell, 
    Wind, 
    Umbrella, 
    WashingMachine, 
    Sparkles, 
    Coffee,
    Monitor,
    ShieldCheck,
    Briefcase,
    Plane,
    Tv,
    Bath,
    Bike,
    Zap,
    Map,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWishlist } from '@/contexts/WishlistContext'
import { useBrand } from '@/lib/brand'
import { useSettings } from '@/contexts/SettingsContext'
import ReviewsSection from '@/components/ReviewsSection'
import BookingWizard, { BookingWizardData } from '@/components/BookingWizard'
import { createBookingRequest } from '@/lib/bookingService'
import { Breadcrumbs } from './ui/Breadcrumbs'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { cn, stripHtml } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import StarRating from './ui/StarRating'
import SocialShare from '@/components/SocialShare'
import { sanitizeHtml } from '@/lib/sanitize'
import ImageSlider from '@/components/ui/ImageSlider'

type RoomType = {
    id?: string;
    type: string;
    price?: number;
    image_url?: string;
    images?: string[]; // Support for multiple images
    features?: string[];
    available?: boolean;
    prices?: Record<string, string>;
    min_stay?: number;
    name?: string;
    total_units?: number;
    size?: string;
    bed?: string;
    view?: string;
    max_occupancy?: number;
    meal_plan?: string;
    max_adults?: number;
    max_teens?: number;
    max_children?: number;
    max_infants?: number;
    child_age_limit?: number;
    cancellation_policy?: string;
    deposit_policy?: string;
    is_active?: boolean;
    description?: string;
}

type Hotel = {
    id: string
    name: string
    description: string
    location: string
    region: string
    short_description?: string
    lowestPrice: number
    rating: number
    image_url?: string
    amenities?: string[]
    service_type?: string
    duration_days?: number
    duration_hours?: number
    max_group_size?: number
    secondary_image_url?: string
    gallery_images?: string[]
    meta_title?: string
    meta_description?: string
    special_features?: string[]
    highlights?: string[]
    included?: string[]
    not_included?: string[]
    cancellation_policy?: string
    terms_and_conditions?: string
    thumbnail_url?: string
    banner_url?: string
    featured?: boolean
    priority?: number
    max_adults?: number
    max_children?: number
    child_age_limit?: number
    meal_plans?: { label: string; price?: number }[]
    room_types?: RoomType[]
    itinerary?: { day: string; title: string; desc?: string; description?: string; time?: string; image_url?: string }[]
}

interface UserProfile {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    user_metadata?: {
        first_name?: string;
        last_name?: string;
    };
}

const AMENITY_ICONS: Record<string, any> = {
    'wifi': Wifi,
    'free wifi': Wifi,
    'internet': Wifi,
    'computer': Monitor,
    'pool': Waves,
    'infinity pool': Waves,
    'swimming pool': Waves,
    'water activities': Waves,
    'spa': Flower2,
    'wellness': Flower2,
    'massage': Flower2,
    'gym': Dumbbell,
    'fitness': Dumbbell,
    'parking': Car,
    'free parking': Car,
    'restaurant': Utensils,
    'dining': Utensils,
    'bar': GlassWater,
    'lounge': GlassWater,
    'cocktail': GlassWater,
    'room service': ConciergeBell,
    'ac': Wind,
    'air conditioning': Wind,
    'beach': Umbrella,
    'towels': Wind,
    'private beach': Umbrella,
    'laundry': WashingMachine,
    'cleaning': WashingMachine,
    'concierge': ConciergeBell,
    'breakfast': Coffee,
    'tv': Tv,
    'television': Tv,
    'security': ShieldCheck,
    'business center': Briefcase,
    'shop': Briefcase,
    'airport shuttle': Plane,
    'transfer': Plane,
    'bath': Bath,
    'bathtub': Bath,
    'bicycle': Bike,
    'bike': Bike,
    'electricity': Zap,
    'power': Zap,
    'games': Zap,
    'view': Map
};

function getAmenityIcon(amenity: string) {
    const key = amenity.toLowerCase().trim();
    for (const [name, Icon] of Object.entries(AMENITY_ICONS)) {
        if (key.includes(name)) return Icon;
    }
    return Sparkles;
}

export default function HotelClientWrapper({ hotel }: { hotel: Hotel }) {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const router = useRouter()
    const { isLeisure } = useBrand()
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
    
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [guests, setGuests] = useState(2)
    const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [activeGallery, setActiveGallery] = useState<{ images: string[], title: string } | null>(null)
    const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0)

    const [collapsedSections, setCollapsedSections] = useState({
        introduction: false,
        accommodation: false,
        itinerary: false,
        policies: false,
        reviews: false
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section as keyof typeof prev]
        }));
    };

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setUserProfile(profile || user)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (hotel?.region?.toLowerCase() === 'rodrigues' || hotel?.location?.toLowerCase().includes('rodrigues')) {
            ;(window as any).__RODRIGUES_OVERRIDE__ = true
            window.dispatchEvent(new CustomEvent('brand-override', { detail: 'normal' }))
        }
        return () => {
            ;(window as any).__RODRIGUES_OVERRIDE__ = false
            window.dispatchEvent(new CustomEvent('brand-override', { detail: 'reset' }))
        }
    }, [hotel])

    function toggleWishlist() {
        if (!hotel) return
        if (isInWishlist(hotel.id)) {
            removeFromWishlist(hotel.id)
            toast.success(labels.wishlist_removed || 'Removed from wishlist')
        } else {
            addToWishlist({
                id: hotel.id,
                service_type: 'hotel',
                name: hotel.name,
                image_url: hotel.image_url,
                price: hotel.lowestPrice,
                location: hotel.location
            })
            toast.success(labels.wishlist_added || 'Added to wishlist')
        }
    }
    
    const [isMounted, setIsMounted] = useState(false)
    
    useEffect(() => {
        setIsMounted(true)
    }, [])
    const handleBookNow = () => {
        const isRodrigues = hotel.region?.toLowerCase() === 'rodrigues'
        const effectiveIsLeisure = isRodrigues ? false : isLeisure
        const brandStr = effectiveIsLeisure ? '&brand=leisure' : '&brand=normal'
        router.push(`/book?id=${hotel.id}&category=hotel&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}${selectedRoom ? `&roomId=${selectedRoom.id}` : ''}${brandStr}`)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Floating Back Navigation */}
            <div className="fixed top-32 left-12 z-[100] hidden md:block">
                <Link 
                    href="/hotels" 
                    className="flex items-center gap-3 px-6 py-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl text-slate-900 hover:text-red-600 font-black transition-all shadow-2xl shadow-slate-200/50 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] uppercase tracking-[0.2em]">{labels.back_to_hotels || 'Discover More Hotels'}</span>
                </Link>
            </div>

            {/* Mobile Back Bar */}
            <div className="md:hidden bg-white border-b border-slate-100 sticky top-0 z-[100]">
                <div className="px-4 py-4 flex items-center justify-between">
                    <Link href="/hotels" className="flex items-center gap-2 text-slate-600 font-bold uppercase text-[11px] tracking-widest">
                        <ArrowLeft size={16} />
                        {labels.back_to_hotels || 'Back'}
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleWishlist}
                            className={cn(
                                "p-2 rounded-full transition-all border",
                                isInWishlist(hotel.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-200 text-slate-400'
                            )}
                        >
                            <Heart size={16} className={isInWishlist(hotel.id) ? 'fill-white' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative h-[40vh] md:h-[65vh] min-h-[450px]">
                {(hotel.banner_url || hotel.image_url) ? (
                    <Image
                        src={resolveImageUrl(hotel.banner_url || hotel.image_url, '/assets/placeholders/hero-hotel.png')}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-slate-900 flex items-center justify-center">
                        <MapPin size={120} className="text-white/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                
                <div className="absolute bottom-12 left-0 w-full z-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <StarRating rating={hotel.rating} size={18} />
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black text-white uppercase tracking-widest border border-white/20">
                                        {hotel.rating} {labels.rating_label || 'Rating'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-2xl">
                                    {hotel.name.split(' ').join('  ')}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-white/90">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <MapPin size={20} className="text-red-500" />
                                        <span className="font-bold text-sm uppercase tracking-wide">{hotel.location}</span>
                                    </div>
                                    {hotel.meal_plans && hotel.meal_plans.length > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                            <Utensils size={20} className="text-white/60" />
                                            <span className="font-bold text-sm uppercase tracking-wide">
                                                {hotel.meal_plans.map(mp => typeof mp === 'string' ? mp : (mp as any).label).join(' • ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Hotels', href: '/hotels' },
                        { label: hotel.name, active: true }
                    ]}
                    className="mb-0"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8 pb-32">
                <div className="grid grid-cols-1 gap-12">
                    <div className="space-y-8">
                        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div 
                                className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors group/header bg-slate-50/30"
                                onClick={() => toggleSection('introduction')}
                            >
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] leading-none mb-1">{labels.introduction || 'Introduction'}</h2>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{labels.about_destination || 'About this destination'}</h3>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl text-slate-400 group-hover/header:text-brand-red group-hover/header:bg-red-50 transition-all shadow-sm">
                                    {collapsedSections.introduction ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>
                            
                            {!collapsedSections.introduction && (
                                <div className="px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col md:flex-row gap-10">
                                        <div className="flex-1 min-w-0">
                                            {hotel.description && (
                                                <div 
                                                    className="text-xl boutique-prose font-medium w-full text-left"
                                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(hotel.description) }}
                                                />
                                            )}
                                            {hotel.special_features && hotel.special_features.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    {hotel.special_features.map((feature, idx) => (
                                                        <span key={idx} className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                                                            {typeof feature === 'string' ? feature : (feature as any).item}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {hotel.secondary_image_url && (
                                            <div className="w-full md:w-1/3 aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 shrink-0">
                                                <Image 
                                                    src={resolveImageUrl(hotel.secondary_image_url, '/assets/placeholders/hero-hotel.png', { width: 400, height: 600, quality: 85 })} 
                                                    alt={hotel.name} 
                                                    width={400} 
                                                    height={600} 
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Multi-Image Experience Slider */}
                                    {hotel.gallery_images && hotel.gallery_images.length > 0 && (
                                        <div className="mt-12 relative group/slider">
                                            <div className="flex items-center justify-between mb-6 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Multi-Image Experience</h4>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const el = document.getElementById('hotel-gallery-slider');
                                                            if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
                                                        }}
                                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-red hover:border-red-100 transition-all shadow-sm"
                                                    >
                                                        <ArrowLeft size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const el = document.getElementById('hotel-gallery-slider');
                                                            if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
                                                        }}
                                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-red hover:border-red-100 transition-all shadow-sm"
                                                    >
                                                        <div className="rotate-180">
                                                            <ArrowLeft size={18} />
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            <div 
                                                id="hotel-gallery-slider"
                                                className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {hotel.gallery_images.map((img, idx) => (
                                                    <motion.div 
                                                        key={idx}
                                                        whileHover={{ y: -8 }}
                                                        className="relative min-w-[200px] md:min-w-[280px] aspect-[16/10] rounded-[2.5rem] overflow-hidden snap-center shadow-xl shadow-slate-100 group/img"
                                                        onClick={() => {
                                                            setActiveGallery({ images: hotel.gallery_images!, title: hotel.name });
                                                            setCurrentGalleryIdx(idx);
                                                        }}
                                                    >
                                                        <Image
                                                            src={resolveImageUrl(img, undefined, { width: 560, height: 350, quality: 80 })}
                                                            alt={`${hotel.name} - ${idx + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 200px, 280px"
                                                            className="object-cover transition-transform duration-1000 group-hover/img:scale-110"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-8">
                                                            <div className="flex items-center gap-3 text-white">
                                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                                    <Users size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black uppercase tracking-widest">{labels.view_image || 'View Image'}</p>
                                                                    <p className="text-[8px] font-bold text-white/60 uppercase">{idx + 1} / {hotel.gallery_images?.length}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            
                                            {/* Scroll Progress Bar */}
                                            <div className="max-w-[200px] mx-auto h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className="h-full bg-red-600 rounded-full"
                                                    initial={{ width: "10%" }}
                                                    whileInView={{ width: "100%" }}
                                                    transition={{ duration: 2 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Highlights & Details Section (Decision Support) */}
                        {( (hotel.highlights && hotel.highlights.length > 0) || 
                           (hotel.included && hotel.included.length > 0) || 
                           (hotel.not_included && hotel.not_included.length > 0) ) && (
                            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner">
                                            <Info size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] leading-none mb-1">Essentials</h2>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight">Highlights & Inclusions</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {hotel.highlights && hotel.highlights.length > 0 && (
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Key Highlights</h4>
                                            <div className="grid gap-4">
                                                {hotel.highlights.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start group">
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red group-hover:scale-150 transition-transform shrink-0" />
                                                        <p className="text-slate-600 font-medium leading-relaxed text-left">{typeof item === 'string' ? item : (item as any).item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-10">
                                        {hotel.included && hotel.included.length > 0 && (
                                            <div className="space-y-6">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-green-600">What's Included</h4>
                                                <div className="grid gap-3">
                                                    {hotel.included.map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 items-center">
                                                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                                                <Check size={12} strokeWidth={3} />
                                                            </div>
                                                            <p className="text-slate-600 font-medium text-sm text-left">{typeof item === 'string' ? item : (item as any).item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {hotel.not_included && hotel.not_included.length > 0 && (
                                            <div className="space-y-6">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">What's NOT Included</h4>
                                                <div className="grid gap-3">
                                                    {hotel.not_included.map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 items-center">
                                                            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                                <X size={12} strokeWidth={3} />
                                                            </div>
                                                            <p className="text-slate-500 font-medium text-sm">{typeof item === 'string' ? item : (item as any).item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                        
                        {/* Amenities & Services Section - Ultra Compact & Minimalist */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] leading-none mb-1">Experience</h2>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight">Amenities & Services</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                        {hotel.amenities.map((amenity, idx) => {
                                            const Icon = getAmenityIcon(amenity);
                                            return (
                                                <motion.div 
                                                    key={idx} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    className="flex items-center gap-4 group p-3 rounded-[1.25rem] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300"
                                                >
                                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-white group-hover:text-red-600 transition-all duration-300 shadow-sm border border-slate-100/50 group-hover:border-red-600 group-hover:shadow-red-100/50">
                                                        <Icon size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-red-600 transition-colors leading-tight">
                                                        {amenity}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}
                        {/* Itinerary Section */}
                        {hotel?.itinerary && hotel.itinerary.length > 0 && (
                            <section id="experience" className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
                                <div 
                                    className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors group/header bg-slate-50/30"
                                    onClick={() => toggleSection('itinerary')}
                                >
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] leading-none mb-1">Experience</h2>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight">Detailed Plan</h3>
                                    </div>
                                    <div className="p-2.5 bg-white rounded-xl text-slate-400 group-hover/header:text-brand-red group-hover/header:bg-red-50 transition-all shadow-sm">
                                        {collapsedSections.itinerary ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>

                                {!collapsedSections.itinerary && (
                                    <div className="px-8 pb-8 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-4">
                                            {hotel.itinerary!.map((item, idx) => (
                                                <div key={idx} className="relative pl-10 pb-6 last:pb-0">
                                                    {/* Vertical Line */}
                                                    {idx !== hotel.itinerary!.length - 1 && (
                                                        <div className="absolute left-[15px] top-[30px] bottom-0 w-[2px] bg-slate-100" />
                                                    )}
                                                    
                                                    {/* Marker */}
                                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center z-10">
                                                        <div className="w-2 h-2 rounded-full bg-red-600" />
                                                    </div>

                                                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 hover:border-red-100 transition-colors">
                                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                                                            {item.day}: {item.title}
                                                        </h4>
                                                        <div 
                                                            className="text-sm text-slate-600 leading-relaxed font-medium prose prose-slate max-w-none"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description || '') }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        <section id="rooms-selection" className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div 
                                className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors group/header bg-slate-50/30"
                                onClick={() => toggleSection('accommodation')}
                            >
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] leading-none mb-1">{labels.accommodation_label || 'Accommodation'}</h2>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{labels.choose_room || 'Choose Your Room'}</h3>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl text-slate-400 group-hover/header:text-brand-red group-hover/header:bg-red-50 transition-all shadow-sm">
                                    {collapsedSections.accommodation ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {!collapsedSections.accommodation && (
                                <div className="px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-6">
                                        {hotel?.room_types && hotel.room_types.length > 0 ? (
                                            hotel.room_types.map((room, idx) => {
                                                const isSelected = selectedRoom?.id === room.id;
                                                const roomPrice = room.price || 0;
                                                
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => setSelectedRoom(room)}
                                                        className={cn(
                                                            "group relative overflow-hidden transition-all duration-500 cursor-pointer",
                                                            isSelected 
                                                                ? "ring-2 ring-red-600 shadow-2xl scale-[1.01] bg-slate-900 border-transparent rounded-[2rem] p-3" 
                                                                : "bg-white border border-slate-100 hover:border-red-100 hover:shadow-xl rounded-[2rem] p-3"
                                                        )}
                                                    >
                                                        <div className="flex flex-col md:flex-row gap-8">
                                                            <div className="w-full md:w-72 h-64 md:h-auto relative overflow-hidden rounded-[2rem] group">
                                                                <ImageSlider 
                                                                    images={[room.image_url || hotel.image_url || '/placeholder-hotel.jpg', ...(room.images || [])]} 
                                                                    alt={room.name || 'Room'}
                                                                    aspectRatio="h-full"
                                                                    className="w-full h-full"
                                                                />
                                                                {/* Labels overlay */}
                                                                <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                                                                    <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-black text-slate-900 uppercase tracking-widest shadow-sm border border-slate-200">
                                                                        {room.type || 'Room'}
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center backdrop-blur-[2px] z-20">
                                                                        <div className="bg-white text-red-600 p-2 rounded-full shadow-lg">
                                                                            <Check size={20} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-between py-2">
                                                                <div>
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <h4 className={cn("text-2xl font-black tracking-tight", isSelected ? "text-white" : "text-slate-900")}>
                                                                            {room.name}
                                                                        </h4>
                                                                        <div className="text-right">
                                                                            <div className={cn("text-2xl font-black", isSelected ? "text-red-400" : "text-red-600")}>
                                                                                MUR {(roomPrice || 0).toLocaleString()}
                                                                            </div>
                                                                            <div className={cn("text-[11px] font-black uppercase tracking-widest", isSelected ? "text-slate-400" : "text-slate-500")}>
                                                                                {labels.per_night || 'Per Night'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div 
                                                                        className={cn("text-sm mb-4 font-medium leading-relaxed boutique-prose w-full", isSelected ? "text-slate-300" : "text-slate-500")}
                                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(room.description || `Indulge in our refined ${room.name?.toLowerCase() || 'deluxe room'} featuring premium amenities and world-class comfort.`) }}
                                                                    />
                                                                    <div className="flex flex-col gap-3">
                                                                        {/* Occupancy Line */}
                                                                        <div className="flex flex-wrap gap-2">
                                                                            <span className={cn(
                                                                                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                                isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                            )}>
                                                                                <Users size={12} className="shrink-0" />
                                                                                {room.max_adults || hotel.max_adults || 2} {(room.max_adults || hotel.max_adults || 2) === 1 ? (labels.adult_label || 'Adult') : (labels.adults_label || 'Adults')}
                                                                            </span>
                                                                            {(room.max_teens !== undefined) && room.max_teens > 0 && (
                                                                                <span className={cn(
                                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                                    isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                                )}>
                                                                                    <Users size={12} className="shrink-0" />
                                                                                    {room.max_teens} {room.max_teens === 1 ? (labels.teen_label || 'Teen') : (labels.teens_label || 'Teens')} (UP TO 17 YRS)
                                                                                </span>
                                                                            )}
                                                                            {(room.max_children !== undefined || hotel.max_children !== undefined) && (room.max_children ?? hotel.max_children ?? 0) > 0 && (
                                                                                <span className={cn(
                                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                                    isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                                )}>
                                                                                    <Users size={12} className="shrink-0" />
                                                                                    {room.max_children ?? hotel.max_children ?? 0} {(room.max_children ?? hotel.max_children ?? 0) === 1 ? (labels.child_label || 'Child') : (labels.children_label || 'Children')}
                                                                                </span>
                                                                            )}
                                                                            {(room.max_infants !== undefined) && room.max_infants > 0 && (
                                                                                <span className={cn(
                                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5",
                                                                                    isSelected ? "bg-white/10 border-white/10 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-600"
                                                                                )}>
                                                                                    <Users size={12} className="shrink-0" />
                                                                                    {room.max_infants} {room.max_infants === 1 ? (labels.infant_label || 'Infant') : (labels.infants_label || 'Infants')}
                                                                                </span>
                                                                            )}
                                                                            {room.min_stay && (room.min_stay as number) > 1 && (
                                                                                <span className={cn(
                                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border border-red-200/50 bg-red-50 text-red-600 flex items-center gap-1.5",
                                                                                    isSelected && "bg-red-600/10 border-red-500/20 text-red-400"
                                                                                )}>
                                                                                    <Moon size={12} />
                                                                                    {room.min_stay} {labels.nights_min || 'Nights Min'}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Meal Plans & Features Line */}
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {room.meal_plan ? (
                                                                                <span className={cn(
                                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border border-amber-200/50 bg-amber-50 text-amber-600 flex items-center gap-1.5",
                                                                                    isSelected && "bg-amber-600/10 border-amber-500/20 text-amber-400"
                                                                                )}>
                                                                                    <Utensils size={12} />
                                                                                    {room.meal_plan}
                                                                                </span>
                                                                            ) : (
                                                                                hotel.meal_plans?.map((mp, i) => (
                                                                                    <span key={i} className={cn(
                                                                                        "px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border border-amber-200/50 bg-amber-50 text-amber-600 flex items-center gap-1.5",
                                                                                        isSelected && "bg-amber-600/10 border-amber-500/20 text-amber-400"
                                                                                    )}>
                                                                                        <Utensils size={12} />
                                                                                        {typeof mp === 'string' ? mp : (mp as any).label}
                                                                                    </span>
                                                                                ))
                                                                            )}
                                                                            {room.features?.map((f, i) => (
                                                                                <span key={i} className={cn(
                                                                                    "px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors",
                                                                                    isSelected 
                                                                                        ? "bg-white/5 border-white/10 text-slate-300" 
                                                                                        : "bg-slate-50 border-slate-100 text-slate-500"
                                                                                )}>
                                                                                    {typeof f === 'string' ? f : (f as any).item}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-3 mt-6">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedRoom(room);
                                                                            const brandStr = isLeisure ? '&brand=leisure' : ''
                                                                            router.push(`/book?id=${hotel.id}&category=hotel&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&roomId=${room.id}${brandStr}`);
                                                                        }}
                                                                        className={cn(
                                                                            "px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-lg",
                                                                            isSelected 
                                                                                ? "bg-white text-slate-900 hover:bg-slate-50 shadow-white/10" 
                                                                                : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20"
                                                                        )}
                                                                    >
                                                                        {labels.select_room || 'Select Room'}
                                                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                                <p className="text-slate-400 font-bold">{labels.rooms_coming_soon || 'Multiple room types coming soon...'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        <section id="policy-sections" className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div 
                                className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50 transition-colors group/header bg-slate-50/30"
                                onClick={() => toggleSection('policies')}
                            >
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] leading-none mb-1">Policies & Facts</h2>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">Essential Information</h3>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl text-slate-400 group-hover/header:text-brand-red group-hover/header:bg-red-50 transition-all shadow-sm">
                                    {collapsedSections.policies ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {!collapsedSections.policies && (
                                <div className="px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Highlights */}
                                        {hotel.highlights && hotel.highlights.length > 0 && (
                                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                                                <h2 className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-6">Key Highlights</h2>
                                                <ul className="space-y-4">
                                                    {hotel.highlights.map((h, i) => (
                                                        <li key={i} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                                                            <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                                                <Check size={14} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-sm">{typeof h === 'string' ? h : (h as any).item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Included & Not Included */}
                                        <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-8 -mt-4" />
                                            <h2 className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-6">Value Inclusions</h2>
                                            <div className="space-y-6 relative">
                                                {hotel.included && hotel.included.length > 0 && (
                                                    <div>
                                                        <h3 className="text-white font-black uppercase text-[11px] tracking-widest mb-3">Package Features</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {hotel.included.map((inc, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/80 text-[11px] font-black tracking-widest">{typeof inc === 'string' ? inc : (inc as any).item}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {hotel.not_included && hotel.not_included.length > 0 && (
                                                    <div>
                                                        <h3 className="text-white/40 font-black uppercase text-[11px] tracking-widest mb-3">Not Included</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {hotel.not_included.map((not, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 border-dashed rounded-full text-white/40 text-[11px] font-black tracking-widest">{typeof not === 'string' ? not : (not as any).item}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extended Policies */}
                                    <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 shadow-inner">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            {hotel.cancellation_policy && (
                                                <section>
                                                    <h2 className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-4">Refund Policy</h2>
                                                    <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Cancellation</h3>
                                                    <div 
                                                        className="text-slate-500 font-medium leading-relaxed text-sm boutique-prose w-full"
                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(hotel.cancellation_policy) }}
                                                    />
                                                </section>
                                            )}
                                            {hotel.terms_and_conditions && (
                                                <section>
                                                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">House Rules</h2>
                                                    <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Terms & Conditions</h3>
                                                    <div 
                                                        className="text-slate-500 font-medium leading-relaxed text-sm boutique-prose w-full"
                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(hotel.terms_and_conditions) }}
                                                    />
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div 
                                className="flex items-center justify-between p-8 cursor-pointer hover:bg-slate-50 transition-colors group/header"
                                onClick={() => toggleSection('reviews')}
                            >
                                <div className="space-y-1">
                                    <h2 className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em]">{labels.reviews_subtitle || 'Public Opinion'}</h2>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{labels.reviews_title || 'Guest Reviews'}</h3>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover/header:text-brand-red group-hover/header:bg-red-50 transition-all">
                                    {collapsedSections.reviews ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {!collapsedSections.reviews && (
                                <div className="px-8 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <ReviewsSection serviceId={hotel.id} serviceType="hotel" />
                                </div>
                            )}
                        </section>
                </div>
            </div>

            {/* Wizard Modal Removed - Moved to /book page */}


            {/* Room Image Gallery Modal */}
            {activeGallery && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <button 
                        onClick={() => setActiveGallery(null)}
                        className="absolute top-8 right-8 p-4 text-white hover:text-red-500 transition-colors z-[210] bg-white/10 rounded-full"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-6xl px-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 mb-2">{labels.room_preview || 'Room Preview'}</h3>
                                <h2 className="text-3xl font-black tracking-tight">{activeGallery.title}</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{labels.image_label || 'Image'}</span>
                                <div className="text-2xl font-black">{currentGalleryIdx + 1} / {activeGallery.images.length}</div>
                            </div>
                        </div>

                        <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden group shadow-2xl">
                            <Image
                                src={activeGallery.images[currentGalleryIdx]}
                                alt={`${activeGallery.title} - ${currentGalleryIdx + 1}`}
                                fill
                                className="object-cover animate-in fade-in duration-500"
                            />
                            
                            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setCurrentGalleryIdx(prev => (prev > 0 ? prev - 1 : activeGallery.images.length - 1))}
                                    className="p-5 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-white/30 transition-all border border-white/20"
                                >
                                    <ArrowLeft size={32} />
                                </button>
                                <button 
                                    onClick={() => setCurrentGalleryIdx(prev => (prev < activeGallery.images.length - 1 ? prev + 1 : 0))}
                                    className="p-5 bg-brand-red text-white rounded-full hover:bg-red-600 transition-all shadow-xl shadow-red-600/20"
                                >
                                    <div className="rotate-180">
                                        <ArrowLeft size={32} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                            {activeGallery.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentGalleryIdx(i)}
                                    className={cn(
                                        "relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 border-2",
                                        currentGalleryIdx === i ? "border-red-500 scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                >
                                    <Image src={resolveImageUrl(img)} alt={`Thumb ${i}`} fill className="object-cover" unoptimized />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
                </div>

            {/* Floating Request Quote Button */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50] w-[92%] max-w-[380px] animate-in slide-in-from-bottom duration-700">
                <Button 
                    size="xl" 
                    onClick={handleBookNow}
                    className="w-full shadow-[0_20px_50px_rgba(220,38,38,0.3)] rounded-full h-16 flex items-center justify-between px-8 bg-red-600/95 backdrop-blur-md hover:bg-slate-900 transition-all border-2 border-white/20 text-white"
                >
                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{labels.as_from || 'As From'}</span>
                        <span className="font-black text-xl tracking-tight">
                            Rs {((selectedRoom 
                                ? (selectedRoom.price || hotel.lowestPrice)
                                : hotel.lowestPrice
                            ) || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-black uppercase tracking-widest text-xs">{labels.request_quote_btn || 'Request a Quote'}</span>
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </Button>
            </div>
        </div>
    )
}
