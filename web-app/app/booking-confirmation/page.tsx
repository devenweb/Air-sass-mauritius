'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Home, User } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

function BookingConfirmationContent() {
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('id') || ''
    const [booking, setBooking] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadBooking() {
            if (!bookingId) {
                setLoading(false)
                return
            }
            const supabase = createClient()
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', bookingId)
                .single()
            
            if (!error) setBooking(data)
            setLoading(false)
        }
        loadBooking()
    }, [bookingId])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    const amount = booking?.amount || searchParams.get('amount') || '0'
    const serviceName = booking?.service_name || searchParams.get('service') || 'Service'

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-2xl w-full">
                {/* Success Card */}
                <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
                    
                    {/* Success Icon */}
                    <div className="mb-8 inline-block p-6 bg-emerald-50 rounded-3xl relative">
                        <CheckCircle size={48} className="text-emerald-600" />
                    </div>

                    {/* Success Message */}
                    <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">Booking Request <span className="text-emerald-600">Received!</span></h1>
                    <p className="text-lg text-slate-500 mb-8 font-medium">
                        Thank you for your interest in <span className="font-bold text-slate-900">{serviceName}</span>. Our team will review your reservation and contact you shortly.
                    </p>

                    {/* Reservation Summary - Matching Image Style */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-10 text-left">
                        <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                            <h2 className="text-xs font-black text-red-600 uppercase tracking-[0.2em]">Reservation Summary</h2>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</span>
                                <span className="font-bold text-slate-900">{serviceName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking ID</span>
                                <span className="font-bold text-slate-900">#{bookingId.split('-')[0].toUpperCase()}</span>
                            </div>
                            {booking?.check_in_date && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
                                    <span className="font-bold text-slate-900">{new Date(booking.check_in_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            )}
                            {booking?.check_out_date && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</span>
                                    <span className="font-bold text-slate-900">{new Date(booking.check_out_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guests</span>
                                <span className="font-bold text-slate-900">
                                    {booking?.pax_adults || 0} Adults, {booking?.pax_teens || 0} Teens, {booking?.pax_children || 0} Kids
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
                                <span className="text-2xl font-black text-red-600">Rs {parseInt(amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4">
                        {/* 
                        <Link
                            href={bookingId ? `/dashboard/bookings/${bookingId}` : '/dashboard'}
                            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-xl shadow-red-900/10 flex items-center justify-center gap-2 text-lg"
                        >
                            View My Booking
                        </Link>
                        */}
                        <Link
                            href="/"
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 text-lg"
                        >
                            <Home size={20} />
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center text-sm text-slate-500">
                    Need help? <Link href="/contact" className="text-red-600 font-bold hover:underline">Contact Support</Link>
                </div>
            </div>
        </div>
    )
}

export default function BookingConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        }>
            <BookingConfirmationContent />
        </Suspense>
    )
}
