'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Clock, ArrowRight, Share2, X, Wifi, Waves, Palmtree, Flower2, Plane } from 'lucide-react'
import StarRating from './ui/StarRating'
import BookingWizard, { BookingWizardData } from './BookingWizard'
import { createBookingRequest } from '@/lib/bookingService'
import { resolveImageUrl } from '@/lib/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/contexts/SettingsContext'
import { cn, stripHtml } from '@/lib/utils'
import SmartImage from './ui/SmartImage'
import ImageSlider from './ui/ImageSlider'

interface ServiceCardProps {
    id: string
    title: string
    location?: string
    price: number
    image: string
    duration?: string
    link: string
    tag?: string
    rating?: number
    service_type?: string
    isSeasonal?: boolean
    dealNote?: string
    region?: string
    description?: string
    short_description?: string
    banner_url?: string
    amenities?: string[] | string
    meal_plans?: { label: string; price?: number }[]
    activity_type?: string
    gallery_images?: string[]
}

export default function ServiceCard({ id, title, location, price, image, duration, link, tag, rating, service_type, isSeasonal, dealNote, region, description, short_description, banner_url, amenities, meal_plans, activity_type, gallery_images }: ServiceCardProps) {
    const { generalConfig: config } = useSettings()
    const labels = (config?.ui_labels || {}) as Record<string, string>
    const [bookingLoading, setBookingLoading] = React.useState(false)
    const router = useRouter()

    // Legacy handleBookingComplete removed

    return (
        <React.Fragment>
            {/* Wizard Modal Removed */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer"
            onClick={() => router.push(link)}
        >
            <div className="relative h-40 md:h-44 overflow-hidden rounded-t-[2rem]">
                <ImageSlider 
                    images={[banner_url || image || '/assets/placeholders/hero-hotel.png', ...(gallery_images || [])]} 
                    alt={title}
                    aspectRatio="h-full"
                    className="w-full h-full rounded-t-[2rem]"
                />
                {(activity_type || tag) && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.1em] shadow-sm z-20 flex items-center gap-1.5 border border-slate-200/50">
                        {activity_type === 'Sea' && <Waves size={12} className="text-blue-500" />}
                        {activity_type === 'Land' && <Palmtree size={12} className="text-emerald-500" />}
                        {activity_type ? `${activity_type} Activities` : tag}
                    </div>
                )}
                {isSeasonal && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 z-20">
                        {dealNote || labels.limited_time || 'Limited Time'}
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                    {(location || region) && (
                        <div className="flex items-center gap-2 text-black text-xs font-bold uppercase line-clamp-1">
                            <MapPin size={14} className="text-red-500 shrink-0" />
                            <span>{location} {location && region && <span className="text-slate-400 mx-1">/</span>} {region}</span>
                        </div>
                    )}
                    {activity_type && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[11px] font-black uppercase tracking-wider border border-red-100/50">
                            {activity_type === 'Sea' && <Waves size={10} />}
                            {activity_type === 'Air' && <Plane size={10} />}
                            {activity_type === 'Land' && <Palmtree size={10} />}
                            {['Sea', 'Land', 'Air'].includes(activity_type) ? `${activity_type} Activities` : activity_type}
                        </div>
                    )}
                    {duration && (
                        <div className="flex items-center gap-2 text-black text-xs font-bold uppercase shrink-0">
                            <Clock size={14} />
                            {duration}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold text-black mb-2 group-hover:text-red-600 transition-colors line-clamp-1">
                    {title}
                </h3>

                {(short_description || description) && (
                    <p className="text-sm text-black line-clamp-2 mb-3 font-medium leading-relaxed">
                        {stripHtml(short_description || description || '')}
                    </p>
                )}

                <div className="flex items-center justify-between mb-4">
                    <StarRating rating={rating || 0} size={14} showNumber={true} />
                    
                    {/* Crucial Amenities Icons */}
                    <div className="flex items-center gap-2">
                        {(() => {
                            const ams = Array.isArray(amenities) 
                                ? amenities 
                                : typeof amenities === 'string' 
                                    ? amenities.split(',').map(a => a.trim().toLowerCase())
                                    : [];
                            
                            const iconMap = [
                                { key: 'wifi', icon: <Wifi size={14} />, label: 'WiFi' },
                                { key: 'pool', icon: <Waves size={14} />, label: 'Pool' },
                                { key: 'beach', icon: <Palmtree size={14} />, label: 'Beach' },
                                { key: 'spa', icon: <Flower2 size={14} />, label: 'Spa' }
                            ];

                            return iconMap.filter(item => ams.some(a => a.includes(item.key))).slice(0, 3).map((item, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all border border-slate-100" title={item.label}>
                                    {item.icon}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Meal Plans */}
                {meal_plans && meal_plans.length > 0 && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                            {meal_plans.map((mp, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md uppercase tracking-wider border border-emerald-100/50"
                                >
                                    {mp.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4">
                    <div className="flex items-end justify-between border-t border-slate-100 pt-4 mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">{labels.as_from || 'As From'}</span>
                            <span className="text-xl font-black text-black leading-none">Rs {(price || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                            {/* <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const shareUrl = window.location.origin + link;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: title,
                                            url: shareUrl
                                        }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                        import('sonner').then(({ toast }) => toast.success(labels.link_copied || 'Link copied to clipboard!'));
                                    }
                                }}
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                                title="Share"
                            >
                                <Share2 size={16} />
                            </button> */}
                            <Link 
                                href={link} 
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                            >
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    </React.Fragment>
    )
}
