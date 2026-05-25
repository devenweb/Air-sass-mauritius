'use client' // Triggering new build for Vercel deploy

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { 
    Calendar, MapPin, User, Users, CreditCard, Clock, 
    ArrowLeft, CheckCircle, AlertCircle, Info, Coffee, 
    ShieldCheck, Star, Utensils, Zap, Receipt
} from 'lucide-react'
import Link from 'next/link'

const supabase = createClient()

type ServiceDetail = {
    id: string
    name: string
    description: string
    amenities: string[]
    highlights: string[]
    included: string[]
    not_included: string[]
    meal_plans: any[]
    image_url: string
    itinerary?: any[]
}

type BookingItem = {
    id: string
    service_name: string
    service_category: string
    amount: number
    service_id: string
    services?: ServiceDetail
}

type Booking = {
    id: string
    service_type: string
    service_name: string
    description: string | null
    check_in_date: string
    check_out_date: string | null
    amount: number
    status: string
    payment_status: string
    pax_adults: number
    pax_teens: number
    pax_children: number
    pax_infants: number
    lounge_name: string | null
    created_at: string
    booking_items?: BookingItem[]
}

export default function BookingDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadBooking() {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        booking_items (
                            *,
                            services (*)
                        )
                    `)
                    .eq('id', params.id)
                    .eq('customer_id', user.id)
                    .single()

                if (error) throw error
                setBooking(data)
            } catch (error) {
                console.error('Error loading booking:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            loadBooking()
        } else if (!authLoading) {
            router.push('/login')
        }
    }, [user, authLoading, params.id, router])

    function parseDescription(description: string | null) {
        if (!description) return { room: null, mealPlan: null, specialRequests: null }
        
        const roomMatch = description.match(/Room: ([^.]+)\./)
        const mealMatch = description.match(/Meal Plan: ([^.]+)\./)
        
        let specialRequests = description
        if (roomMatch) specialRequests = specialRequests.replace(roomMatch[0], '')
        if (mealMatch) specialRequests = specialRequests.replace(mealMatch[0], '')
        
        const travelersIndex = specialRequests.indexOf('Travelers:')
        if (travelersIndex !== -1) {
            specialRequests = specialRequests.substring(0, travelersIndex)
        }

        return {
            room: roomMatch ? roomMatch[1] : null,
            mealPlan: mealMatch ? mealMatch[1] : null,
            specialRequests: specialRequests.trim() || null
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <AlertCircle size={64} className="mx-auto text-red-600 mb-6" />
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Booking Not Found</h1>
                    <p className="text-slate-600 mb-4">We couldn't find the booking you're looking for. It might have been deleted or doesn't belong to your account.</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-red-600 transition-all">
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const { room, mealPlan, specialRequests } = parseDescription(booking.description)
    const mainItem = booking.booking_items?.[0]
    const service = mainItem?.services

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 md:px-[30px]">
                <Breadcrumbs 
                    items={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Booking Details', active: true }
                    ]}
                    className="py-0 mb-4 breadcrumbs"
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold mb-4 transition-colors text-sm back-link no-print">
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            Booking <span className="text-red-600">Details</span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${
                            booking.status.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            booking.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                            {booking.status}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Main Service Overview */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-32 -mt-16 opacity-40"></div>
                            
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                                        {booking.service_type}
                                    </span>
                                    <span className="text-slate-400 font-bold text-sm">ID: {booking.id.split('-')[0].toUpperCase()}</span>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-[1.1]">
                                    {booking.service_name}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Period</p>
                                            <p className="font-bold text-slate-900">
                                                {new Date(booking.check_in_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {booking.check_out_date && ` — ${new Date(booking.check_out_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Travelers</p>
                                            <p className="font-bold text-slate-900">
                                                {booking.pax_adults} Adult{booking.pax_adults > 1 ? 's' : ''}
                                                {booking.pax_teens > 0 && `, ${booking.pax_teens} Teen${booking.pax_teens > 1 ? 's' : ''}`}
                                                {booking.pax_children > 0 && `, ${booking.pax_children} Child${booking.pax_children > 1 ? 's' : ''}`}
                                                {booking.pax_infants > 0 && `, ${booking.pax_infants} Infant${booking.pax_infants > 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Selections (Meal, Room) */}
                                {(room || mealPlan) && (
                                    <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100">
                                        {room && (
                                            <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl">
                                                <Zap size={18} className="text-amber-500" />
                                                <span className="text-sm font-bold text-slate-700">Room: <span className="text-slate-900">{room}</span></span>
                                            </div>
                                        )}
                                        {mealPlan && (
                                            <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl">
                                                <Utensils size={18} className="text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-700">Meal Plan: <span className="text-slate-900">{mealPlan}</span></span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 1b. Itinerary Section */}
                        {service?.itinerary && Array.isArray(service.itinerary) && service.itinerary.length > 0 && (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <MapPin className="text-red-600" size={24} />
                                    Travel Itinerary
                                </h3>
                                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {service.itinerary.map((item: any, idx: number) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className="absolute left-0 top-1 w-6 h-6 bg-white border-4 border-red-600 rounded-full z-10"></div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    Day {item.day || idx + 1}
                                                </span>
                                                <h4 className="font-black text-slate-900 text-lg">{item.title}</h4>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Service Specifics: Amenities, Inclusions */}
                        {service && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Inclusions */}
                                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <ShieldCheck className="text-emerald-600" size={24} />
                                        Inclusions
                                    </h3>
                                    {service.included && service.included.length > 0 ? (
                                        <ul className="space-y-3">
                                            {service.included.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Standard service inclusions apply.</p>
                                    )}
                                </div>

                                {/* Amenities */}
                                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <Star className="text-amber-500" size={24} />
                                        Amenities
                                    </h3>
                                    {service.amenities && service.amenities.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(service.amenities) ? service.amenities : []).map((item, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-100">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Standard amenities included.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. Pricing Breakdown (Line by Line) */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Receipt className="text-red-600" size={24} />
                                Pricing Breakdown
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Service Line Items */}
                                {booking.booking_items && booking.booking_items.length > 0 ? (
                                    booking.booking_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-6 border-b border-slate-50 last:pb-0 last:border-0">
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-900">{item.service_name}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{item.service_category || 'Service'} Item</p>
                                            </div>
                                            <p className="font-black text-slate-900 text-lg">Rs {parseFloat(item.amount.toString()).toLocaleString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between items-start pb-6 border-b border-slate-50">
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900">{booking.service_name}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Base Service Fee</p>
                                        </div>
                                        <p className="font-black text-slate-900 text-lg">Rs {booking.amount.toLocaleString()}</p>
                                    </div>
                                )}

                                {/* Taxes & Subtotal */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between text-sm font-bold text-slate-400">
                                        <span>Subtotal</span>
                                        <span>Rs {booking.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-slate-400">
                                        <span>VAT (Included)</span>
                                        <span>Rs 0</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <p className="text-lg font-black text-slate-900">Total Amount</p>
                                        <p className="text-3xl font-black text-red-600">Rs {booking.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Support */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-3xl -mb-8 -mr-16 opacity-40"></div>
                            
                            <div className="relative">
                                <h3 className="text-xl font-black mb-6">Booking Status</h3>
                                
                                <div className="space-y-6 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                                            booking.status.toLowerCase() === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}></div>
                                        <span className="font-bold text-slate-300">Request {booking.status}</span>
                                    </div>

                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment</p>
                                        <div className="flex items-center gap-2">
                                            {booking.payment_status.toLowerCase() === 'paid' ? (
                                                <CheckCircle size={18} className="text-emerald-400" />
                                            ) : (
                                                <Clock size={18} className="text-amber-400" />
                                            )}
                                            <span className="font-black text-lg">{booking.payment_status}</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handlePrint}
                                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 no-print"
                                >
                                    Download Voucher / Print
                                </button>
                            </div>
                        </div>

                        {/* Special Requests */}
                        {specialRequests && (
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
                                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className="text-slate-400" />
                                    Special Requests
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed italic">
                                    &quot;{specialRequests}&quot;
                                </p>
                            </div>
                        )}

                        {/* Help Box */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl support-box no-print">
                            <h3 className="text-xl font-black text-slate-900 mb-4">Concierge Support</h3>
                            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                                Need to modify your booking or have special requirements? Our concierge team is ready to assist you.
                            </p>
                            <Link href="/contact" className="block text-center py-4 bg-slate-50 text-slate-900 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all text-sm border border-slate-100">
                                Message Concierge
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print, 
                    .support-box,
                    nav,
                    footer,
                    .breadcrumbs,
                    .back-link,
                    button {
                        display: none !important;
                    }
                    
                    .min-h-screen {
                        min-height: auto !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    
                    .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    
                    .bg-white {
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: none !important;
                        border-radius: 1rem !important;
                    }
                    
                    .shadow-xl, .shadow-2xl {
                        box-shadow: none !important;
                    }
                    
                    .text-red-600 {
                        color: #dc2626 !important;
                    }
                    
                    .bg-slate-900 {
                        background-color: #0f172a !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            ` }} />
        </div>
    )
}
