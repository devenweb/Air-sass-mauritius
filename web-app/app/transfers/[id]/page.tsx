'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Car, ArrowLeft, Calendar, Users, MapPin, Heart, Shield, Clock, Luggage, X, ChevronRight } from 'lucide-react'

import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useWishlist } from '@/contexts/WishlistContext'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { resolveImageUrl } from '@/lib/image'
import { cn } from '@/lib/utils'
import { calculateLeadPrice } from '@/lib/services'
import ReviewsSection from '@/components/ReviewsSection'
import BookingWizard, { BookingWizardData } from '@/components/BookingWizard'
import { createBookingRequest } from '@/lib/bookingService'
import { useRouter } from 'next/navigation'


const supabase = createClient()

type Transfer = {
    id: string
    name: string
    description: string
    short_description?: string
    location: string
    region: string
    lowestPrice: number
    rating: number
    image_url: string
    secondary_image_url?: string
    banner_url?: string
    gallery_images?: string[]
    amenities: string[]
    highlights?: string[]
    included?: string[]
    not_included?: string[]
    cancellation_policy?: string
    terms_and_conditions?: string
}

export default function TransferDetailPage() {
    const params = useParams()
    const [transfer, setTransfer] = useState<Transfer | null>(null)
    const [loading, setLoading] = useState(true)
    const [pickupDate, setPickupDate] = useState('')
    const [travelers, setTravelers] = useState(1)
    const [bookingLoading, setBookingLoading] = useState(false)
    const router = useRouter()
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()


    useEffect(() => {
        if (params.id) {
            loadTransfer(params.id as string)
        }
    }, [params.id])

    async function loadTransfer(id: string) {
        try {
            // 1. Fetch transfer details
            const { data: transferData, error: transferError } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .in('service_type', ['transfer', 'transfers'])
                .single()

            if (transferError) throw transferError

            // 2. Fetch authoritative lead price using standardized helper
            const lowestPrice = await calculateLeadPrice(id, transferData.service_type || 'transfer')

            setTransfer({
                ...transferData,
                lowestPrice: lowestPrice
            })
        } catch (error) {
            console.error('Error loading transfer:', error)
            toast.error('Transfer service not found')
        } finally {
            setLoading(false)
        }
    }

    function toggleWishlist() {
        if (!transfer) return
        if (isInWishlist(transfer.id)) {
            removeFromWishlist(transfer.id)
            toast.success('Removed from saved items')
        } else {
            addToWishlist({
                id: transfer.id,
                service_type: 'transfer',
                name: transfer.name,
                image_url: transfer.image_url,
                price: transfer.lowestPrice,
                location: transfer.location
            })
            toast.success('Saved for later')
        }
    }

    function handleBookNow() {
        if (!pickupDate) {
            toast.error('Please select a pickup date')
            return
        }
        router.push(`/book?id=${transfer?.id}&category=transfer&checkIn=${pickupDate}&adults=${travelers}`)
    }

    // Legacy handleBookingComplete removed in favor of standalone /book page


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent"></div>
            </div>
        )
    }

    if (!transfer) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Transfer Not Found</h1>
                    <Button variant="outline" asChild>
                        <Link href="/transfers">
                            Back to Transfers
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Wizard Modal Removed - Moved to /book page */}
            {/* Hero Section */}

            <div className="relative py-8 w-full overflow-hidden">
                <Image
                    src={resolveImageUrl(transfer.banner_url || transfer.image_url, '/assets/placeholders/service-placeholder.png')}
                    alt={transfer.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                
                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="bg-white/10 backdrop-blur-md text-white hover:bg-white/30 rounded-full"
                    >
                        <Link href="/transfers">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleWishlist}
                        className={cn(
                            "backdrop-blur-md rounded-full text-white transition-all",
                            isInWishlist(transfer.id) ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/30'
                        )}
                    >
                        <Heart size={20} fill={isInWishlist(transfer.id) ? 'currentColor' : 'none'} />
                    </Button>
                </div>

                <div className="absolute bottom-12 left-8 right-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <Badge className="bg-slate-900 text-white border-none py-1.5 px-4 shadow-lg">
                                Reliable & Professional
                            </Badge>
                        </div>
                        <h1 className="text-3xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none uppercase">
                            {transfer.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 font-bold uppercase tracking-[0.2em] text-xs">
                            <div className="flex items-center gap-2">
                                <Car size={18} className="text-red-500" />
                                Chauffeur Service
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-red-500" />
                                {transfer.location}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 pt-12 pb-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Transfers', href: '/transfers' },
                        { label: transfer.name, active: true }
                    ]}
                    className="mb-8 mt-4"
                />

                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Description */}
                    <section>
                        <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4">Comfort First</h2>
                        <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{transfer.short_description || 'Travel in Style'}</h3>
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 min-w-0">
                                <div 
                                    className="text-lg text-slate-500 leading-relaxed font-medium boutique-prose w-full"
                                    dangerouslySetInnerHTML={{ __html: transfer.description }}
                                />
                            </div>
                            {transfer.secondary_image_url && (
                                <div className="w-full md:w-1/3 aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200">
                                    <Image 
                                        src={resolveImageUrl(transfer.secondary_image_url)} 
                                        alt={transfer.name} 
                                        width={400} 
                                        height={600} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Amenities / Included */}
                    {transfer.amenities && transfer.amenities.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Service Features</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(Array.isArray(transfer.amenities) ? transfer.amenities : []).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm border border-slate-200/50 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Shield size={18} />
                                        </div>
                                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Driver Info */}
                    <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 mx-auto sm:mx-0 shadow-sm">
                                    <Users size={24} />
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Professional</h4>
                                <p className="text-slate-500 text-xs font-medium">Experienced, uniformed drivers with local expertise.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 mx-auto sm:mx-0 shadow-sm">
                                    <Clock size={24} />
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Punctual</h4>
                                <p className="text-slate-500 text-xs font-medium">We track flights and adjust for delays automatically.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 mx-auto sm:mx-0 shadow-sm">
                                    <Luggage size={24} />
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest">Helpful</h4>
                                <p className="text-slate-500 text-xs font-medium">Full assistance with your luggage and special needs.</p>
                            </div>
                            </div>
                    </section>

                    {/* Policies section */}
                    {(transfer.cancellation_policy || transfer.terms_and_conditions) && (
                        <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-6">IMPORTANT POLICIES</h2>
                            <div className="space-y-4">
                                {transfer.cancellation_policy && (
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-3">Cancellation Policy</h3>
                                        <div 
                                            className="text-slate-500 font-medium leading-relaxed text-sm boutique-prose w-full"
                                            dangerouslySetInnerHTML={{ __html: transfer.cancellation_policy }}
                                        />
                                    </div>
                                )}
                                {transfer.terms_and_conditions && (
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-3">Terms & Conditions</h3>
                                        <div 
                                            className="text-slate-500 font-medium leading-relaxed text-sm boutique-prose w-full"
                                            dangerouslySetInnerHTML={{ __html: transfer.terms_and_conditions }}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
                
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <ReviewsSection serviceId={transfer.id} serviceType="transfer" />
                </div>
            </div>

            {/* Floating Request Quote Button */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50] w-[92%] max-w-[380px] animate-in slide-in-from-bottom duration-700">
                <Button 
                    size="xl" 
                    onClick={handleBookNow}
                    className="w-full shadow-[0_20px_50px_rgba(220,38,38,0.3)] rounded-full h-16 flex items-center justify-between px-8 bg-red-600/95 backdrop-blur-md hover:bg-slate-900 transition-all border-2 border-white/20 text-white"
                >
                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Fixed Rate</span>
                        <span className="font-black text-xl tracking-tight">Rs {transfer.lowestPrice?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-black uppercase tracking-widest text-xs">Request a Quote</span>
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </Button>
            </div>
        </div>
    )
}
