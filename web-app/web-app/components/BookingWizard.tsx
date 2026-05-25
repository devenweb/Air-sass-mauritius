'use client'

import React from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AlertCircle, Plus, Trash2, Calendar, Users, Mail, Phone, MessageSquare, Utensils, Home, ChevronRight, ChevronLeft, CheckCircle2, DollarSign, Info, ShieldOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateServicePricing, getStopDates } from '@/lib/pricingEngine'
import { RangeDatePicker } from './ui/RangeDatePicker'
import { DatePicker } from './ui/DatePicker'
import Link from 'next/link'
import { isSameDay, startOfDay, isBefore, format, parseISO } from 'date-fns'

const sanitizeString = (val: string) => {
    if (!val) return val;
    // Remove HTML tags and extra whitespace
    return val.replace(/<[^>]*>?/gm, '').trim();
}

const travelerSchema = z.object({
    firstName: z.string().transform(sanitizeString).pipe(z.string().min(2, 'First name is required')),
    lastName: z.string().transform(sanitizeString).pipe(z.string().min(2, 'Last name is required')),
    email: z.string().email('Invalid email address').transform(s => s.toLowerCase().trim()),
    phone: z.string().transform(sanitizeString).pipe(z.string().min(8, 'Phone number is required')),
    mobile: z.string().transform(sanitizeString).optional(),
    age: z.number().optional(),
    passportNumber: z.string().transform(sanitizeString).optional()
})

const bookingSchema = z.object({
    checkIn: z.string().min(1, 'Start Date is required'),
    checkOut: z.string().min(1, 'End Date is required'),
    adults: z.number().min(1).max(20),
    teens: z.number().min(0).max(20),
    children: z.number().min(0).max(20),
    infants: z.number().min(0).max(20),
    firstName: z.string().transform(sanitizeString).pipe(z.string().min(2, 'Contact name is required')),
    lastName: z.string().transform(sanitizeString).optional(),
    email: z.string().email('Invalid email address').transform(s => s.toLowerCase().trim()),
    phone: z.string().transform(sanitizeString).pipe(z.string().min(8, 'Phone number is required')),
    mobile: z.string().transform(sanitizeString).optional(),
    notes: z.string().transform(sanitizeString).optional(),
    travelers: z.array(travelerSchema).optional(),
    mealPreference: z.string().transform(sanitizeString).optional(),
    roomPreference: z.string().transform(sanitizeString).optional(),
    acceptedTerms: z.boolean()
}).refine((data) => {
    const start = new Date(data.checkIn)
    const end = new Date(data.checkOut)
    return end >= start
}, {
    message: "End Date must be on or after Start Date",
    path: ["checkOut"]
})

export type BookingWizardData = z.infer<typeof bookingSchema>

type RoomOption = string | { 
    id?: string, 
    name?: string, 
    type: string, 
    min_stay?: number, 
    price?: number,
    max_adults?: number,
    max_teens?: number,
    max_children?: number,
    max_infants?: number,
    max_occupancy?: number
}

type BookingWizardProps = {
    serviceId: string
    serviceName: string
    servicePrice: number
    teenPrice?: number
    childPrice?: number
    infantPrice?: number
    serviceCategory: string
    onComplete: (data: BookingWizardData, totalAmount: number) => void
    isLoading?: boolean
    initialData?: Partial<BookingWizardData>
    showRoomSelection?: boolean
    mealPlans?: { label: string, price: number, id: string }[]
    roomTypes?: RoomOption[] // Actual room objects with variants/ids
}

export default function BookingWizard({ 
    serviceName, 
    servicePrice, 
    teenPrice = 0,
    childPrice = 0,
    infantPrice = 0,
    onComplete, 
    isLoading, 
    initialData, 
    showRoomSelection = true,
    mealPlans = [],
    roomTypes = [],
    serviceId,
    serviceCategory
}: BookingWizardProps) {
    const { generalConfig } = useSettings()
    const labels = generalConfig?.ui_labels || {}
    const [dynamicPricing, setDynamicPricing] = React.useState<any>(null)
    const [dynamicMealPlans, setDynamicMealPlans] = React.useState<any[]>([])
    const [isPricingLoading, setIsPricingLoading] = React.useState(false)
    const [stopDates, setStopDates] = React.useState<Date[]>([])
    // Track the selected room's UUID for correct variant-specific stop-date and pricing fetching
    const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(() => {
        // If initialData contains a roomPreference (name), try to find its UUID
        if (initialData?.roomPreference && roomTypes && roomTypes.length > 0) {
            const match = roomTypes.find(r =>
                typeof r !== 'string' && (
                    (r as any).name === initialData.roomPreference ||
                    (r as any).type === initialData.roomPreference ||
                    (r as any).id === initialData.roomPreference
                )
            )
            if (match && typeof match !== 'string') return (match as any).id
        }
        // Default to first room's UUID
        if (roomTypes && roomTypes.length > 0 && typeof roomTypes[0] !== 'string') {
            return (roomTypes[0] as any).id
        }
        return undefined
    })

    const getSmartDates = () => {
        const today = new Date()
        const checkInDate = new Date()
        // Default to next Saturday
        checkInDate.setDate(today.getDate() + (6 - today.getDay()) + 7)
        const checkOutDate = new Date(checkInDate)
        checkOutDate.setDate(checkInDate.getDate() + 7)
        
        return {
            checkIn: format(checkInDate, 'yyyy-MM-dd'),
            checkOut: format(checkOutDate, 'yyyy-MM-dd')
        }
    }

    const smartDates = getSmartDates()

    let defaultRoomPref = initialData?.roomPreference || '';
    if (defaultRoomPref && roomTypes && roomTypes.length > 0) {
        const match = roomTypes.find(r => 
            typeof r !== 'string' && (
                (r as any).name === defaultRoomPref || 
                (r as any).type === defaultRoomPref || 
                (r as any).id === defaultRoomPref
            )
        );
        if (match && typeof match !== 'string') {
            defaultRoomPref = (match as any).name || (match as any).type;
        }
    }
    if (!defaultRoomPref) {
        defaultRoomPref = roomTypes && roomTypes.length > 0
            ? (typeof roomTypes[0] === 'string' ? roomTypes[0] : (roomTypes[0].name || roomTypes[0].type))
            : (showRoomSelection ? 'standard' : 'standard');
    }

    const form = useForm<BookingWizardData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            checkIn: initialData?.checkIn || smartDates.checkIn,
            checkOut: initialData?.checkOut || smartDates.checkOut,
            adults: initialData?.adults || 2,
            teens: (initialData as any)?.teens || 0,
            children: initialData?.children || 0,
            infants: (initialData as any)?.infants || 0,
            firstName: initialData?.firstName || '',
            lastName: initialData?.lastName || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            mobile: initialData?.mobile || '',
            notes: initialData?.notes || '',
            travelers: initialData?.travelers || [],
            // Default to 'Bed & Breakfast' instead of 'none' (Room Only) per user request "hide Room Only"
            mealPreference: initialData?.mealPreference && initialData.mealPreference !== 'none' ? initialData.mealPreference : 'Bed & Breakfast',
            roomPreference: defaultRoomPref,
            acceptedTerms: true // Pre-accepting to save a click, with clear footer notice
        }
    })

    const { 
        register, 
        control, 
        handleSubmit, 
        watch,
        formState: { errors } 
    } = form

    const acceptedTerms = watch('acceptedTerms')
    const watchAllFields = useWatch({ control }) as BookingWizardData
    const activeRoom = roomTypes.find(r => 
        typeof r !== 'string' && (
            (r as any).id === selectedVariantId || 
            (r as any).name === watchAllFields.roomPreference
        )
    ) as any;
    const [showBreakdown, setShowBreakdown] = React.useState(false) 

    const isHotel = serviceCategory === 'hotel' || serviceCategory === 'rodrigues'
    const isRangeBased = ['hotel', 'cruise', 'package', 'travel_package', 'package_tour', 'rodrigues'].includes(serviceCategory)
    
    // Dynamic Labels
    const perNightLabel = isHotel ? (labels.per_night || 'Per Night') : (labels.per_person || 'Per Person')
    const checkInLabel = labels.check_in || 'Start Date'
    const checkOutLabel = labels.check_out || 'End Date'
    const guestLabel = isRangeBased ? 'Dates & Guests' : 'Date & Guests'

    const checkIn = watch('checkIn')
    const totalPax = (watchAllFields.adults || 0) + (watchAllFields.teens || 0) + (watchAllFields.children || 0) + (watchAllFields.infants || 0)

    // Force single day for non-range services on mount/change
    React.useEffect(() => {
        if (!isRangeBased && watchAllFields.checkIn !== watchAllFields.checkOut) {
            form.setValue('checkOut', watchAllFields.checkIn)
        }
    }, [isRangeBased, watchAllFields.checkIn, watchAllFields.checkOut, form])


    // Fetch Stop Dates scoped to the selected variant UUID
    React.useEffect(() => {
        const fetchStopDates = async () => {
            if (!serviceId) return
            const dates = await getStopDates(serviceId, selectedVariantId)
            setStopDates(dates)
        }
        fetchStopDates()
    }, [serviceId, selectedVariantId])

    const calculateTotal = () => {
        let baseTotal = 0;
        if (dynamicPricing) {
            baseTotal = dynamicPricing.total;
        } else {
            // No fallback to static base prices. All must come from the grid.
            baseTotal = 0;
        }
        
        // The meal plan pricing is now handled internally by calculateServicePricing
        // and is already included in dynamicPricing.total. 
        // Adding it again here would cause double-counting.
        
        return baseTotal
    }

    React.useEffect(() => {
        async function fetchPrice() {
            if (!watchAllFields.checkIn || !watchAllFields.checkOut) return;
            
            setIsPricingLoading(true);
            try {
                // Import calculateMealPricing dynamically to avoid circular issues if any, but regular import is fine here
                const { calculateServicePricing, calculateMealPricing } = await import('@/lib/pricingEngine');

                const selectedRoom = roomTypes.find(r => 
                    (typeof r === 'object' && r.id === watchAllFields.roomPreference) ||
                    (typeof r === 'object' && r.name === watchAllFields.roomPreference) || 
                    (typeof r === 'object' && r.type === watchAllFields.roomPreference) ||
                    r === watchAllFields.roomPreference
                ) as { id?: string, type: string, name?: string, price?: number } | undefined;
                
                const participants = {
                    adults: watchAllFields.adults,
                    teens: watchAllFields.teens || 0,
                    children: watchAllFields.children || 0,
                    infants: watchAllFields.infants || 0
                };

                const selectedMealPlanObj = mealPlans.find(m => m.label === watchAllFields.mealPreference);
                
                const [priceResult, mealsResult] = await Promise.all([
                    calculateServicePricing({
                        serviceId,
                        variantId: selectedRoom?.id || 'default',
                        mealPlanId: selectedMealPlanObj?.id,
                        startDate: watchAllFields.checkIn,
                        endDate: watchAllFields.checkOut,
                        participants,
                        baseRates: {
                            adult: selectedRoom?.price || servicePrice || 0,
                            teen: teenPrice || 0,
                            child: childPrice || 0,
                            infant: infantPrice || 0
                        },
                        isPerNight: isHotel
                    }),
                    calculateMealPricing(serviceId, watchAllFields.checkIn, watchAllFields.checkOut, participants, selectedVariantId)
                ]);

                setDynamicPricing(priceResult);
                setDynamicMealPlans(mealsResult);

                // Validate and update active meal preference when Room Only is hidden
                const currentPref = form.getValues('mealPreference');
                if (mealsResult && mealsResult.length > 0) {
                    const isValid = mealsResult.some(m => m.label === currentPref);
                    if (!isValid) {
                        form.setValue('mealPreference', mealsResult[0].label);
                    }
                } else {
                    const fallbacks = ['Bed & Breakfast', 'Half Board', 'Full Board'];
                    const isValid = fallbacks.includes(currentPref || '');
                    if (!isValid) {
                        form.setValue('mealPreference', 'Bed & Breakfast');
                    }
                }
            } catch (err) {
                console.error("Pricing error:", err);
            } finally {
                setIsPricingLoading(false);
            }
        }
        fetchPrice();
    }, [
        watchAllFields.checkIn, 
        watchAllFields.checkOut, 
        watchAllFields.adults, 
        watchAllFields.teens, 
        watchAllFields.children, 
        watchAllFields.infants, 
        watchAllFields.roomPreference,
        watchAllFields.mealPreference,
        serviceId
    ]);

    const onSubmit = (data: BookingWizardData) => {
        onComplete(data, calculateTotal())
    }

    // Input styling for minimalist design
    const inputClass = "invoice-input"
    const labelClass = "invoice-label"
    const sectionClass = "invoice-section"

    return (
        <div className="invoice-container animate-in">
            {/* Invoice Header */}
            <div className="invoice-header">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
                            <CheckCircle2 size={12} /> Verification Quote
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-black tracking-tighter uppercase">
                            {labels.request_quote_btn || 'Quote Request'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="badge-boutique !bg-red-600 !px-4 !py-1 !tracking-[0.2em]">
                                {serviceName}
                            </span>
                            {initialData?.roomPreference && (
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    — {initialData.roomPreference}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-left md:text-right p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Unit Price</div>
                        <div className="text-2xl font-black text-red-600">
                            MUR {dynamicPricing 
                                ? (isHotel 
                                    ? (dynamicPricing.total / (dynamicPricing.nights || 1)).toLocaleString() 
                                    : (dynamicPricing.total / (totalPax || 1)).toLocaleString()) 
                                : (servicePrice || 0).toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                            {perNightLabel}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                
                {/* 1. Voyage Details */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                             <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                                {guestLabel}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Travel Period & Occupancy</p>
                        </div>
                    </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                            <label className={`${labelClass} mb-0 min-w-[140px] text-red-600`}>Selected Variant</label>
                            <div className="flex flex-wrap gap-2">
                                {roomTypes.map((room) => {
                                    const isString = typeof room === 'string';
                                    const name = isString ? room : (room.name || room.type);
                                    const id = isString ? room : room.id;
                                    const isSelected = watchAllFields.roomPreference === name;
                                    
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                form.setValue('roomPreference', name);
                                                setSelectedVariantId(id);
                                            }}
                                            className={`invoice-pill ${isSelected ? 'invoice-pill-active' : 'bg-white'}`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    <div className="space-y-6">
                        {/* Dates Row */}
                        <div className="w-full">
                            {isRangeBased ? (
                                <RangeDatePicker 
                                    range={{
                                        from: parseISO(watchAllFields.checkIn),
                                        to: parseISO(watchAllFields.checkOut)
                                    }}
                                    onSelect={(range) => {
                                        if (range?.from) {
                                            form.setValue('checkIn', format(range.from, 'yyyy-MM-dd'))
                                        }
                                        if (range?.to) {
                                            form.setValue('checkOut', format(range.to, 'yyyy-MM-dd'))
                                        }
                                    }}
                                    serviceId={serviceId}
                                    variantId={selectedVariantId}
                                    labels={{
                                        check_in: checkInLabel,
                                        check_out: checkOutLabel
                                    }}
                                />
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-red-600 transition-all">
                                    <DatePicker
                                        selected={parseISO(watchAllFields.checkIn)}
                                        onSelect={(date) => {
                                            const formatted = format(date, 'yyyy-MM-dd')
                                            form.setValue('checkIn', formatted)
                                            form.setValue('checkOut', formatted) // Same day for single date services
                                        }}
                                        serviceId={serviceId}
                                        variantId={selectedVariantId}
                                        placeholder={checkInLabel}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Travelers Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="space-y-1">
                                <label className={labelClass}>{labels.adults || 'Adults'}</label>
                                <div className="relative group">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={14} />
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={activeRoom?.max_adults || 20}
                                        {...register('adults', { valueAsNumber: true })} 
                                        className={inputClass + " !pl-10 !py-2"} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Teens</label>
                                <div className="relative group">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={14} />
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={activeRoom?.max_teens ?? 20}
                                        {...register('teens', { valueAsNumber: true })} 
                                        className={inputClass + " !pl-10 !py-2"} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Children</label>
                                <div className="relative group">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={14} />
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={activeRoom?.max_children ?? 20}
                                        {...register('children', { valueAsNumber: true })} 
                                        className={inputClass + " !pl-10 !py-2"} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>Infants</label>
                                <div className="relative group">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={14} />
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={activeRoom?.max_infants ?? 20}
                                        {...register('infants', { valueAsNumber: true })} 
                                        className={inputClass + " !pl-10 !py-2"} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Meal Plans */}
                {serviceCategory === 'hotel' && (
                <div className={sectionClass}>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20 shrink-0">
                                <Utensils size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">
                                    Meal Preference
                                </h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Dining Supplements</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Option: No Meal Plan (Hidden per user request "hide Room Only")
                            <button key="none" 
                                 type="button"
                                 onClick={() => form.setValue('mealPreference', 'none')}
                                 className={`invoice-pill ${(watchAllFields.mealPreference === 'none' || !watchAllFields.mealPreference) ? 'invoice-pill-active' : 'bg-white'}`}>
                                Room Only
                            </button>
                            */}

                            {/* Dynamic Seasonal Supplements */}
                            {dynamicMealPlans.length > 0 ? (
                                dynamicMealPlans.map(m => (
                                    <button key={m.label} 
                                         type="button"
                                         onClick={() => form.setValue('mealPreference', m.label)}
                                         className={`invoice-pill ${watchAllFields.mealPreference === m.label ? 'invoice-pill-active' : 'bg-white'}`}>
                                        {m.label}
                                    </button>
                                ))
                            ) : (
                                /* Fallback to common preferences */
                                ['Bed & Breakfast', 'Half Board', 'Full Board'].map(label => (
                                    <button key={label} 
                                         type="button"
                                         onClick={() => form.setValue('mealPreference', label)}
                                         className={`invoice-pill ${watchAllFields.mealPreference === label ? 'invoice-pill-active' : 'bg-white'}`}>
                                        {label}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                )}



                {/* 3. Contact Details */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                             <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-black tracking-tight leading-none mb-1">
                                Secure My Quote
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inquiry Confirmation</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Email Destination</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="email" 
                                    {...register('email')} 
                                    placeholder="your@email.com"
                                    className={inputClass + " !pl-12 !py-4"} 
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-[10px] uppercase font-bold mt-2 ml-1 flex items-center gap-1.5"><AlertCircle size={10} />{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className={labelClass}>Contact Name</label>
                            <input 
                                type="text" 
                                {...register('firstName')} 
                                placeholder="Your Name"
                                className={inputClass + ` !py-3 ${errors.firstName ? 'border-red-500 bg-red-50' : ''}`}
                            />
                            {errors.firstName && <p className="text-red-500 text-[10px] uppercase font-bold mt-2 ml-1 flex items-center gap-1.5"><AlertCircle size={10} />{errors.firstName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className={labelClass}>WhatsApp / Phone</label>
                            <input 
                                type="tel" 
                                {...register('phone')} 
                                placeholder="+230..."
                                className={inputClass + ` !py-3 ${errors.phone ? 'border-red-500 bg-red-50' : ''}`}
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] uppercase font-bold mt-2 ml-1 flex items-center gap-1.5"><AlertCircle size={10} />{errors.phone.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                             <label className={labelClass}>Special Requirements (Optional)</label>
                             <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 text-slate-400" size={16} />
                                <textarea 
                                    {...register('notes')} 
                                    rows={3}
                                    placeholder="Honeymoon details, dietary needs, or specific preferences..."
                                    className={inputClass + " !pl-12 !py-3 resize-none"}
                                ></textarea>
                             </div>
                        </div>
                    </div>
                </div>
                {/* Pricing Breakdown */}
                {dynamicPricing && dynamicPricing.dailyRates && (
                    <div className={sectionClass}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-red-600" /> Line Item Breakdown
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setShowBreakdown(!showBreakdown)}
                                className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline transition-colors"
                            >
                                {showBreakdown ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>
                        
                        <AnimatePresence>
                            {showBreakdown && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-t-lg">
                                            <div className="col-span-2">Description</div>
                                            <div className="text-right">Base</div>
                                            <div className="text-right">Teen</div>
                                            <div className="text-right">Child</div>
                                            <div className="text-right">Infant</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-b-lg overflow-hidden">
                                            {dynamicPricing.dailyRates.map((rate: any, idx: number) => (
                                                <div key={idx} className={`grid grid-cols-6 gap-2 p-3 text-[11px] items-center transition-colors 
                                                    ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                                                    hover:bg-red-50/30`}>
                                                    <div className="col-span-2 flex flex-col">
                                                        <span className="font-black text-slate-900">
                                                            {new Date(rate.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                                            {rate.source === 'grid' ? 'Seasonal Rate' : 'Standard Rate'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right font-bold text-slate-900">Rs {(rate.adult || 0).toLocaleString()}</div>
                                                    <div className="text-right font-bold text-slate-400">Rs {(rate.teen || 0).toLocaleString()}</div>
                                                    <div className="text-right font-bold text-slate-400">Rs {(rate.child || 0).toLocaleString()}</div>
                                                    <div className="text-right font-bold text-slate-400">Rs {(rate.infant || 0).toLocaleString()}</div>
                                                </div>
                                            ))}
                                            
                                            {/* Subtotal Row */}
                                            <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-t border-slate-100">
                                                <div className="col-span-2 text-slate-900">Accommodation Subtotal</div>
                                                <div className="col-span-4 text-right text-black font-black">
                                                    MUR {(dynamicPricing.total || 0).toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Meal Plan Add-on */}
                                            {watchAllFields.mealPreference && watchAllFields.mealPreference !== 'none' && (
                                                <div className="grid grid-cols-6 gap-2 p-3 bg-red-50/20 text-[10px] font-black uppercase tracking-widest border-t border-slate-100">
                                                    <div className="col-span-2 text-red-600 flex flex-col">
                                                        <span>{watchAllFields.mealPreference} Supplement</span>
                                                    </div>
                                                    <div className="col-span-4 text-right text-red-600 font-black">
                                                        + MUR {(dynamicMealPlans.find(m => m.label === watchAllFields.mealPreference)?.total || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Availability Warnings */}
                {dynamicPricing && !dynamicPricing.availabilityStatus?.isAvailable && (
                    <div className="mx-8 mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4">
                        <ShieldOff className="text-red-600 shrink-0 mt-0.5" size={16} />
                        <div>
                            <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Unavailable Period</h4>
                            <p className="text-[9px] font-bold text-red-500 uppercase leading-relaxed">
                                Selected dates are currently restricted. Please adjust your itinerary.
                            </p>
                        </div>
                    </div>
                )}

                {/* Final Submission Section */}
                <div className="p-8 md:p-12 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 max-w-sm">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                By submitting, you agree to our <Link href="/terms-conditions" className="text-red-600 underline font-black">Terms</Link> and <Link href="/privacy-policy" className="text-red-600 underline font-black">Privacy Policy</Link>.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    {...register('acceptedTerms')}
                                    className="peer sr-only" 
                                />
                                <div className="w-3.5 h-3.5 bg-white border border-slate-300 rounded peer-checked:bg-red-600 peer-checked:border-red-600 flex items-center justify-center transition-all">
                                    <CheckCircle2 className="text-white w-2 h-2" />
                                </div>
                                <span className="text-[9px] font-black text-slate-500 group-hover:text-red-600 uppercase tracking-widest">Receive Travel Updates</span>
                            </label>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quote Total MUR</p>
                                <p className="text-4xl font-black text-black tracking-tighter leading-none">{(calculateTotal() || 0).toLocaleString()}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !acceptedTerms || (dynamicPricing && !dynamicPricing.availabilityStatus?.isAvailable)}
                                className="invoice-btn-primary mt-2"
                            >
                                {isLoading ? (labels.submitting_btn || 'Processing...') : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    )
}

