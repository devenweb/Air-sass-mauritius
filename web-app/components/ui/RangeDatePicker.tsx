import React, { useState, useEffect } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format, startOfDay, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

interface RangeDatePickerProps {
    range?: { from: Date; to: Date }
    onSelect: (range: { from: Date; to: Date } | undefined) => void
    disabledDays?: Date[] | ((date: Date) => boolean)
    className?: string
    numberOfMonths?: number
    labels?: {
        check_in?: string
        check_out?: string
    }
    /** When provided, fetches stop dates for this specific service */
    serviceId?: string
    /** UUID of the selected room/variant — filters stop dates to this variant */
    variantId?: string
}

/** Parse an ISO date string (YYYY-MM-DD) into a local Date without UTC shifting */
function parseLocalDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export function RangeDatePicker({ 
    range, 
    onSelect, 
    disabledDays, 
    className,
    numberOfMonths = 1,
    labels = {},
    serviceId,
    variantId
}: RangeDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [stopDates, setStopDates] = useState<Date[]>([])
    const [internalRange, setInternalRange] = useState<DateRange | undefined>(
        range ? { from: range.from, to: range.to } : undefined
    )
    const [month, setMonth] = useState<Date>(range?.from || new Date())

    useEffect(() => {
        if (range) {
            setInternalRange({ from: range.from, to: range.to })
        }
    }, [range])

    // Fetch stop dates — ONLY if serviceId is provided
    useEffect(() => {
        if (!serviceId) {
            setStopDates([])
            return
        }

        const fetchStopDates = async () => {
            let query = supabase
                .from('service_pricing')
                .select('date_from, date_to')
                .eq('is_stop_sell', true)
                .eq('service_id', serviceId)

            // If we have a specific variant (room type), filter by it.
            // Otherwise, look for service-level blocks (where variant_id is null).
            if (variantId && variantId !== 'default' && variantId !== 'none') {
                query = query.eq('variant_id', variantId)
            } else {
                query = query.is('variant_id', null)
            }

            const { data, error } = await query

            if (data && !error) {
                const dates: Date[] = []
                data.forEach((row: any) => {
                    try {
                        const start = parseLocalDate(row.date_from)
                        const end = parseLocalDate(row.date_to)
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            dates.push(new Date(d))
                        }
                    } catch (e) {
                        console.error('RangeDatePicker: error parsing stop date', row, e)
                    }
                })
                setStopDates(dates)
            }
        }
        fetchStopDates()
    }, [serviceId, variantId])

    const handleSelect = (selectedRange: DateRange | undefined) => {
        setInternalRange(selectedRange)
        if (selectedRange?.from && selectedRange?.to) {
            onSelect({ from: selectedRange.from, to: selectedRange.to })
            setTimeout(() => setIsOpen(false), 400)
        }
    }

    const today = startOfDay(new Date())
    const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6

    // Build the disabled array — stop dates are always disabled
    const disabledArray: any[] = [{ before: today }, ...stopDates]
    if (disabledDays) {
        if (Array.isArray(disabledDays)) {
            disabledArray.push(...disabledDays)
        } else {
            disabledArray.push(disabledDays)
        }
    }

    return (
        <div className={cn("relative w-full h-full", className)}>
            <div className="flex flex-col md:flex-row items-stretch md:items-center w-full h-full">
                {/* Check-in Trigger */}
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    className="flex-1 flex items-center gap-4 px-6 py-4 md:py-5 border-b md:border-b-0 md:border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors group h-full"
                >
                    <CalendarIcon size={18} className="text-slate-400 group-hover:text-red-600 transition-colors shrink-0" />
                    <div className="flex flex-col min-w-0 justify-center">
                        <span className={cn(
                            "text-sm font-bold truncate",
                            range?.from ? "text-black" : "text-slate-400"
                        )}>
                            {range?.from ? format(range.from, 'dd MMM yyyy') : 'Select Date'}
                        </span>
                    </div>
                </div>

                {/* Check-out Trigger */}
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                    className="flex-1 flex items-center gap-4 px-6 py-4 md:py-5 cursor-pointer hover:bg-slate-50 transition-colors group h-full"
                >
                    <Clock size={18} className="text-slate-400 group-hover:text-red-600 transition-colors shrink-0" />
                    <div className="flex flex-col min-w-0 justify-center">
                        <span className={cn(
                            "text-sm font-bold truncate",
                            range?.to ? "text-black" : "text-slate-400"
                        )}>
                            {range?.to ? format(range.to, 'dd MMM yyyy') : 'Select Date'}
                        </span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                            onClick={() => setIsOpen(false)} 
                        />
                        
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-[calc(100vw-2rem)] sm:max-w-[420px] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-slate-100 p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden transition-all duration-500"
                        >
                            {/* Close Button */}
                            <button 
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>

                            <div className="mb-8">
                                <h3 className="text-sm font-black text-black uppercase tracking-widest mb-1">Select Dates</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pick your stay period</p>
                            </div>

                            <div className="flex justify-center mb-8">
                                <DayPicker
                                    key={`calendar-${stopDates.length}`}
                                    mode="range"
                                    selected={internalRange}
                                    onSelect={handleSelect}
                                    disabled={disabledArray}
                                    month={month}
                                    onMonthChange={setMonth}
                                    numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 1024 ? 1 : numberOfMonths}
                                    pagedNavigation
                                    className="boutique-calendar"
                                    today={new Date()}
                                    modifiers={{
                                        weekend: isWeekend,
                                        stopSell: stopDates
                                    }}
                                    modifiersClassNames={{
                                        weekend: "rdp-day_weekend",
                                        stopSell: "rdp-day_stopSell"
                                    }}
                                    components={{
                                        Chevron: (props) => {
                                            if (props.orientation === 'left') {
                                                return <ChevronLeft size={20} {...props} />
                                            }
                                            return <ChevronRight size={20} {...props} />
                                        }
                                    }}
                                />
                            </div>
                            
                            {/* Legend + Action */}
                            <div className="pt-8 border-t border-slate-100 space-y-6">
                                <div className="flex flex-wrap items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Today</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-900" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Stop Sales</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Weekends</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {internalRange?.from && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setInternalRange(undefined)
                                                onSelect(undefined)
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 hover:bg-red-50 text-[11px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-red-100"
                                        >
                                            <X size={14} /> Clear
                                        </button>
                                    )}
                                    <button 
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-[2] py-4 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-black/10"
                                    >
                                        Apply Selection
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

