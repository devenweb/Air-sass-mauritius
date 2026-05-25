'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BookingWizard, { BookingWizardData } from '@/components/BookingWizard'
import { useSettings } from '@/contexts/SettingsContext'
import { toast } from 'sonner'
import { createBookingRequest } from '@/lib/bookingService'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { enrichServicesWithLeadPrice } from '@/lib/services'
import { useBrand } from '@/lib/brand'

export default function BookingPageClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { generalConfig } = useSettings()
    const { logo, brandName, whatsappFormatted } = useBrand()
    const labels = generalConfig?.ui_labels || {}

    const id = searchParams.get('id')
    const category = searchParams.get('category') || 'hotel'
    const roomId = searchParams.get('roomId')
    const variantId = searchParams.get('variantId')
    const checkInParam = searchParams.get('checkIn')
    const checkOutParam = searchParams.get('checkOut')
    const adultsParam = searchParams.get('adults')

    const [service, setService] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)

    useEffect(() => {
        if (!id) {
            router.push('/')
            return
        }

        async function fetchData() {
            const supabase = createClient()
            
            // Fetch User
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setUserProfile(profile || user)
            }

            // Fetch Service
            const { data: serviceData, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .eq('is_active', true)
                .single()

            if (error || !serviceData) {
                toast.error('Service not found')
                router.push('/')
                return
            }

            // Fetch Room Types / Variants if multi-variant category
            let roomTypes: any[] = []
            const multiVariantCategories = ['hotel', 'package', 'cruise', 'day_package', 'evening_package', 'tour', 'travel-package', 'travel_package', 'rodrigues'];
            if (multiVariantCategories.includes(category)) {
                const { data: rooms } = await supabase
                    .from('room_types')
                    .select('*')
                    .eq('service_id', id)
                
                /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
                roomTypes = (rooms || []).map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    type: r.type || r.name,
                    price: r.weekday_price, // Fallback lead price for this variant
                    min_stay: r.min_stay_days,
                    max_adults: r.max_adults,
                    max_teens: r.max_teens,
                    max_children: r.max_children,
                    max_infants: r.max_infants,
                    max_occupancy: r.max_occupancy
                }))
                */
                const { data: pricingData } = await supabase
                    .from('service_pricing')
                    .select('*')
                    .eq('service_id', id);

                roomTypes = (rooms || []).map((room: any) => {
                    const roomPricings = pricingData?.filter((p: any) => p.variant_id === room.id) || [];
                    let finalPrice = 0;

                    const doublePrices = roomPricings.map((pricingOverride: any) => {
                        const occ = pricingOverride.occupancy_pricing as Record<string, any>;
                        if (occ && typeof occ === 'object' && occ["2"]) {
                            const v = occ["2"];
                            if (typeof v === 'object' && v !== null) {
                                return Number((v as any).price || (v as any).adult || 0);
                            }
                            return Number(v || 0);
                        }
                        
                        // Fallback:
                        const basePrice = Number(pricingOverride.price || 0);
                        let prices: number[] = [basePrice];
                        if (occ && typeof occ === 'object') {
                            const otherPrices = Object.entries(occ)
                                .filter(([k]) => !isNaN(Number(k)))
                                .map(([, v]: [string, any]) => {
                                    if (typeof v === 'object' && v !== null) {
                                        return Number((v as any).price || (v as any).adult || 0);
                                    }
                                    return Number(v);
                                });
                            prices = [...prices, ...otherPrices];
                        }
                        const valid = prices.filter(pr => !isNaN(pr) && pr > 0);
                        return valid.length > 0 ? Math.min(...valid) : 0;
                    }).filter((p: any) => p > 0);

                    if (doublePrices.length > 0) {
                        finalPrice = Math.min(...doublePrices);
                    }

                    return {
                        id: room.id,
                        name: room.name,
                        type: room.type || room.name,
                        price: finalPrice, // Correct active starting price for this room/variant
                        min_stay: room.min_stay_days,
                        max_adults: room.max_adults,
                        max_teens: room.max_teens,
                        max_children: room.max_children,
                        max_infants: room.max_infants,
                        max_occupancy: room.max_occupancy
                    };
                });
            }


            // Enrich with Lead Price
            const [enrichedService] = await enrichServicesWithLeadPrice([serviceData])
            
            setService({
                ...enrichedService,
                roomTypes
            })
            setLoading(false)
        }

        fetchData()
    }, [id, category, router])

    const onBookingConfirm = async (formData: BookingWizardData, totalAmount: number) => {
        setBookingLoading(true)
        try {
            const { success, error, bookingId, reference } = await createBookingRequest({
                serviceId: service.id,
                serviceName: service.name,
                serviceCategory: category,
                amount: totalAmount,
                startDate: formData.checkIn,
                endDate: formData.checkOut,
                paxAdults: formData.adults,
                paxTeens: formData.teens || 0,
                paxChildren: formData.children || 0,
                paxInfants: formData.infants || 0,
                roomPreference: formData.roomPreference,
                mealPreference: formData.mealPreference,
                travelers: formData.travelers as Record<string, unknown>[],
                specialRequests: formData.notes,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone
            })

            if (success) {
                toast.success(labels.booking_success || 'Booking request sent successfully!')
                
                const displayId = reference || String(bookingId).split('-')[0].toUpperCase();

                // Trigger Email Notification
                try {
                    const { notifyBookingSuccess } = await import('@/lib/emailActions')
                    const { isLocalDealServiceType } = await import('@/lib/localDeals')
                    
                    await notifyBookingSuccess({
                        email: formData.email,
                        customerName: `${formData.firstName} ${formData.lastName}`,
                        bookingId: displayId,
                        serviceName: service.name,
                        amount: totalAmount,
                        checkIn: formData.checkIn,
                        checkOut: formData.checkOut,
                        adults: formData.adults,
                        teens: formData.teens || 0,
                        children: formData.children || 0,
                        infants: formData.infants || 0,
                        phone: formData.phone,
                        roomPreference: formData.roomPreference,
                        mealPreference: formData.mealPreference,
                        notes: formData.notes,
                        serviceCategory: category,
                        isLocalDeal: isLocalDealServiceType(service.service_type)
                    })
                } catch (e) {
                    console.error('Email notification failed but booking succeeded:', e)
                }

                router.push(`/booking-confirmation?id=${displayId}&service=${encodeURIComponent(service.name)}&amount=${totalAmount}`)
            } else {
                throw new Error(error || 'Booking failed')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to send booking request')
        } finally {
            setBookingLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Preparing your booking experience...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 z-[40]">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => router.back()}
                            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-1">{labels.reservation_label || 'Reservation'}</h2>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{service.name}</h1>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{labels.need_help || 'Need assistance?'}</p>
                            <p className="font-bold text-slate-900 tracking-tight">{whatsappFormatted}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto md:px-6 py-12">
                <BookingWizard
                    serviceId={service.id}
                    serviceName={service.name}
                    servicePrice={(variantId ? service.roomTypes?.find((r: any) => r.id === variantId)?.price : null) || (roomId ? service.roomTypes?.find((r: any) => r.id === roomId)?.price : null) || service.lowestPrice || 0}
                    serviceCategory={category}
                    initialData={{
                        checkIn: checkInParam || '',
                        checkOut: checkOutParam || '',
                        adults: adultsParam ? parseInt(adultsParam) : 2,
                        firstName: userProfile?.first_name || userProfile?.user_metadata?.first_name || '',
                        lastName: userProfile?.last_name || userProfile?.user_metadata?.last_name || '',
                        email: userProfile?.email || '',
                        phone: userProfile?.phone || '',
                        roomPreference: roomId 
                            ? service.roomTypes?.find((r: any) => r.id === roomId)?.name 
                            : (variantId ? service.roomTypes?.find((r: any) => r.id === variantId)?.name : '')
                    }}
                    onComplete={onBookingConfirm}
                    isLoading={bookingLoading}
                    roomTypes={service.roomTypes}
                    showRoomSelection={category === 'hotel'}
                    mealPlans={service.meal_plans}
                />
            </div>
        </div>
    )
}
