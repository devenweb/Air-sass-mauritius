'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { useParams } from 'next/navigation'
import { Plane, ArrowLeft, Calendar, Users, MapPin, Heart, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useWishlist } from '@/contexts/WishlistContext'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { calculateLeadPrice } from '@/lib/services'
import ReviewsSection from '@/components/ReviewsSection'

const supabase = createClient()

type Flight = {
    id: string
    name: string
    description: string
    location: string
    region: string
    lowestPrice: number
    rating: number
    image_url: string
    amenities: string[]
}

export default function FlightDetailPage() {
    const params = useParams()
    const [flight, setFlight] = useState<Flight | null>(null)
    const [loading, setLoading] = useState(true)
    const [travelDate, setTravelDate] = useState('')
    const [travelers, setTravelers] = useState(1)
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

    useEffect(() => {
        if (params.id) {
            loadFlight(params.id as string)
        }
    }, [params.id])

    async function loadFlight(id: string) {
        try {
            // 1. Fetch flight details
            const { data: flightData, error: flightError } = await supabase
                .from('services')
                .select('id, name, description, location, region, rating, image_url, amenities, service_type')
                .eq('id', id)
                .eq('service_type', 'flight')
                .single()

            if (flightError) throw flightError

            // 2. Fetch authoritative lead price using standardized helper
            const lowestPrice = await calculateLeadPrice(id, flightData.service_type || 'flight')

            setFlight({
                ...flightData,
                lowestPrice: lowestPrice
            })
        } catch (error) {
            console.error('Error loading flight:', error)
            toast.error('Flight connection not found')
        } finally {
            setLoading(false)
        }
    }

    function toggleWishlist() {
        if (!flight) return
        if (isInWishlist(flight.id)) {
            removeFromWishlist(flight.id)
            toast.success('Removed from favorites')
        } else {
            addToWishlist({
                id: flight.id,
                service_type: 'flight',
                name: flight.name,
                image_url: flight.image_url,
                price: flight.lowestPrice,
                location: flight.location
            })
            toast.success('Added to favorites')
        }
    }

    function handleBookNow() {
        if (!travelDate) {
            toast.error('Please select a travel date')
            return
        }
        toast.success('Our agents will contact you for flight confirmation!')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!flight) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Flight Not Found</h1>
                    <Button variant="outline" asChild>
                        <Link href="/flights">
                            Back to Flights
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative py-8 w-full overflow-hidden">
                <Image
                    src={resolveImageUrl(flight.image_url || '/placeholders/flight_main.png')}
                    alt={flight.name}
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
                        <Link href="/flights">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleWishlist}
                        className={cn(
                            "backdrop-blur-md rounded-full text-white transition-all",
                            isInWishlist(flight.id) ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/30'
                        )}
                    >
                        <Heart size={20} fill={isInWishlist(flight.id) ? 'currentColor' : 'none'} />
                    </Button>
                </div>

                <div className="absolute bottom-12 left-8 right-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <Badge className="bg-red-600 text-white border-none py-1.5 px-4 shadow-lg">
                                Best Value Connection
                            </Badge>
                        </div>
                        <h1 className="text-3xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none uppercase">
                            {flight.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                                <MapPin size={18} className="text-red-500" />
                                {flight.location}
                            </div>
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                                <Plane size={18} className="text-red-400" />
                                Domestic & International
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
                <Breadcrumbs 
                    items={[
                        { label: 'Flights', href: '/flights' },
                        { label: flight.name, active: true }
                    ]}
                    className="mb-8 mt-4"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Description */}
                        <section>
                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4 text-center sm:text-left">Journey Details</h2>
                            <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight text-center sm:text-left">Fly to {flight.location}</h3>
                            <p className="text-lg text-slate-500 leading-relaxed font-medium">
                                {flight.description}
                                <br />We partner with leading airlines to provide you with the most reliable and comfortable flight connections. Whether you&apos;re traveling for business or leisure, we ensure a smooth booking process and support throughout your journey.
                            </p>
                        </section>

                        {/* Amenities / Included */}
                        {flight.amenities && flight.amenities.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">What&apos;s Included</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(Array.isArray(flight.amenities) ? flight.amenities : []).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm border border-slate-200/50">
                                                <Shield size={18} />
                                            </div>
                                            <span className="font-bold text-xs uppercase tracking-widest text-slate-600">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Why Book With Us */}
                        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Support</h4>
                                    <h5 className="text-2xl font-black mb-4">Travel Expert Assistance</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Our dedicated agents handle all the complexities of airline schedules and connections so you can focus on your trip.</p>
                                </div>
                                <div>
                                    <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Benefits</h4>
                                    <h5 className="text-2xl font-black mb-4">Flexible Booking</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">We negotiate special rates and flexible terms for our clients, ensuring you get the best value for your flight.</p>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Plane size={200} />
                             </div>
                        </section>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)]">
                                <div className="mb-4">
                                    <span className="text-xs text-slate-400 font-bold block mb-1">Estimated Starting Price</span>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">Rs {flight.lowestPrice?.toLocaleString()}</span>
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">/ Return</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Travel Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input
                                                type="date"
                                                value={travelDate}
                                                onChange={(e) => setTravelDate(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:bg-white font-bold text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Travelers</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input
                                                type="number"
                                                min="1"
                                                value={travelers}
                                                onChange={(e) => setTravelers(parseInt(e.target.value))}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:bg-white font-bold text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        size="xl"
                                        onClick={handleBookNow}
                                        className="w-full bg-red-600 hover:bg-slate-900 shadow-xl shadow-red-600/20 mt-4"
                                    >
                                        Inquire Availability
                                    </Button>

                                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
                                        <Clock className="text-red-600 shrink-0" size={18} />
                                        <p className="text-[10px] text-red-700 font-bold leading-tight">Prices are subject to airline availability at the time of booking.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <ReviewsSection serviceId={flight.id} serviceType="flight" />
                </div>
            </div>
        </div>
    )
}
