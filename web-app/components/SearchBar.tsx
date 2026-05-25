'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Minus, Hotel, Compass, MapPin, Sun, Moon, Clock, Ship, Users, Map, Plane, Briefcase, Package, Car, Utensils, Flower2, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'
import { MauritiusMap } from './MauritiusMap'
import { DatePicker } from './ui/DatePicker'
import { RangeDatePicker } from './ui/RangeDatePicker'
import { startOfDay, isBefore, parseISO, format } from 'date-fns'

interface GuestCount {
  adults:   number
  teens:    number  // 12–17
  children: number  // 3–11
  infants:  number  // 0–2
}

interface SearchBarProps {
  initialCategory?: string
}

function SearchBarContent({ initialCategory }: SearchBarProps) {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')

  // Helper to normalize category IDs for highlighting
  const normalizeCategory = (cat: string | null): string => {
    if (!cat) return 'hotels'
    const c = cat.toLowerCase()
    if (['activity', 'sea_activity', 'land_activity', 'activities', 'sea', 'land'].includes(c)) return 'activities'
    if (['evening-packages', 'evening_package'].includes(c)) return 'evening-packages'
    if (['hotel', 'hotels', 'stays', 'stay', 'accommodation', 'mauritius-hotels', 'rodrigue-hotels', 'rodrigues'].includes(c)) return 'hotels'
    if (['cruise', 'cruises', 'ships'].includes(c)) return 'cruises'
    if (['day-package', 'day_package', 'day-packages', 'day_packages', 'hotel-day-packages'].includes(c)) return 'day-packages'
    if (['guided-group-tours', 'group-tours', 'tour', 'tours'].includes(c)) return 'tours'
    if (['package', 'packages', 'travel-packages', 'travel-package'].includes(c)) return 'packages'
    if (['restaurant', 'restaurants', 'dining'].includes(c)) return 'restaurants'
    if (['spa', 'wellness', 'beauty'].includes(c)) return 'spa'
    if (['flight', 'flights', 'air'].includes(c)) return 'flights'
    return c
  }
  
  const [showGuests, setShowGuests] = useState(false)
  const [showLocationMap, setShowLocationMap] = useState(false)
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, teens: 0, children: 0, infants: 0 })
  const [checkIn, setCheckIn] = useState<string>('2026-04-30')
  const [checkOut, setCheckOut] = useState<string>('2026-05-29')
  const [selectedCategory, setSelectedCategory] = useState<string>(normalizeCategory(initialCategory || typeParam))
  const [location, setLocation] = useState<string>(searchParams.get('location') || '')
  const [time, setTime] = useState<string>('12:00')
  
  const router = useRouter()
  const guestRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  const checkInRef = useRef<HTMLInputElement>(null)
  const checkOutRef = useRef<HTMLInputElement>(null)

  const handleSearch = (catOverride?: string | React.MouseEvent) => {
    const category = typeof catOverride === 'string' ? catOverride : selectedCategory
    const params = new URLSearchParams()
    
    // Date Logic based on category fields
    if (activeTabDetails.fields.includes('range')) {
        if (checkIn) params.set('checkIn', checkIn)
        if (checkOut) params.set('checkOut', checkOut)
    } else if (activeTabDetails.fields.includes('single')) {
        if (checkIn) params.set('checkIn', checkIn)
    }

    params.set('adults',   guests.adults.toString())
    params.set('teens',    guests.teens.toString())
    params.set('children', guests.children.toString())
    params.set('infants',  guests.infants.toString())
    params.set('type', category)
    
    if (location) params.set('location', location)
    if (category === 'restaurants') params.set('time', time)
    
    router.push(`/search?${params.toString()}`)
  }

  const categories = [
    { id: 'hotels', label: 'Hotels', icon: Hotel, fields: ['location', 'range', 'guests'] },
    { id: 'packages', label: 'Travel Packages', icon: Package, fields: ['location', 'range', 'guests'] },
    { id: 'cruises', label: 'Cruises', icon: Ship, fields: ['location', 'range', 'guests'] },
    { id: 'day-packages', label: 'Day Packages', icon: Sun, fields: ['location', 'single', 'guests'] },
    { id: 'activities', label: 'Activities', icon: Compass, fields: ['location', 'single', 'guests'] },
    { id: 'evening-packages', label: 'Evening Packages', icon: Moon, fields: ['location', 'single', 'guests'] },
    { id: 'tours', label: 'Group Tours', icon: Users, fields: ['location', 'single', 'guests'] },
    { id: 'transfers', label: 'Transfers', icon: Car, fields: ['location', 'single', 'guests'] },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils, fields: ['location', 'single', 'guests', 'time'] },
    { id: 'spa', label: 'Spa & Wellness', icon: Flower2, fields: ['location', 'single', 'guests'] },
    { id: 'visa', label: 'Visa Services', icon: Briefcase, fields: ['location', 'single', 'guests'] },
  ]

  const activeTabDetails = categories.find(c => c.id === selectedCategory) || categories[0]
  const fields = activeTabDetails.fields

  // format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuests(false)
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationMap(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeParam) {
      const normalized = normalizeCategory(typeParam)
      if (normalized !== selectedCategory) {
        setSelectedCategory(normalized)
      }
    }
  }, [typeParam])

  const updateGuests = (type: keyof GuestCount, increment: boolean) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + (increment ? 1 : -1))
    }))
  }

  const totalGuests = guests.adults + guests.teens + guests.children + guests.infants
  const childSummary = [guests.teens && `${guests.teens} teen${guests.teens>1?'s':''}`, guests.children && `${guests.children} child${guests.children>1?'ren':''}`, guests.infants && `${guests.infants} infant${guests.infants>1?'s':''}`].filter(Boolean).join(', ')

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 md:mt-12 relative z-40">

      <motion.div 
        layout
        className="bg-white rounded-[1.5rem] md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-2 md:p-2 flex flex-col md:flex-row items-stretch md:items-center gap-0 border border-slate-100 relative"
      >
        
        {/* Search Input / Quick Filters */}
        {fields.includes('location') && (
            <div 
                ref={locationRef}
                className="flex-[2] px-6 py-4 md:px-8 md:py-5 border-b md:border-b-0 md:border-r border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-all md:rounded-l-full relative group"
            >
                {/* Search Header: Search: Region, Type */}
                <div className="flex flex-col gap-4 mb-4">
                    <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] group-hover:text-red-700 transition-colors">
                        Search:
                    </label>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                       {/* Category Dropdown */}
                       <div className="relative group/cat w-full md:w-auto">
                          <select 
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value)
                            }}
                            className="w-full text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5 px-4 py-3 md:px-3 md:py-1.5 bg-red-50 rounded-xl md:rounded-lg border border-red-100 appearance-none cursor-pointer pr-10 md:pr-8 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all font-sans"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id} className="bg-white text-slate-900">{cat.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 md:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-red-600 transition-transform group-hover/cat:translate-y-[-40%]">
                             <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1.5L4 4.5L7 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                             </svg>
                          </div>
                       </div>

                       <button 
                         onClick={(e) => { e.stopPropagation(); setShowLocationMap(!showLocationMap); }}
                         className="w-full md:w-auto text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors flex items-center justify-between md:justify-start gap-1.5 px-4 py-3 md:px-3 md:py-1.5 bg-slate-50 rounded-xl md:rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95"
                       >
                         <div className="flex items-center gap-2">
                            <MapPin size={12} className={location ? "text-red-600" : ""} />
                            <span>{location || "Select Region"}</span>
                         </div>
                         <ChevronRight size={14} className="md:hidden text-slate-300" />
                       </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Search size={18} className="text-red-600" />
                    <input 
                        type="text" 
                        placeholder={
                          selectedCategory === 'hotels' ? "Destination, Hotel, or Region..." : 
                          selectedCategory === 'cruises' ? "Cruise Line or Destination..." :
                          selectedCategory === 'activities' ? "Activity Type or Name..." :
                          "Search for anything..."
                        }
                        className="bg-transparent border-none focus:ring-0 p-0 text-black font-bold text-sm md:text-lg placeholder:text-slate-300 w-full"
                        value={location}
                        onChange={(e) => setLocation(e.target.value.replace(/<[^>]*>?/gm, '').trim())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSearch()
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <AnimatePresence>
                    {showLocationMap && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 md:left-auto md:right-0 lg:left-0 mt-4 w-[calc(100vw-2rem)] md:w-[400px] bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-slate-100 p-4 md:p-8 z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6 border-b border-slate-100 pb-4">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={16} className="text-red-600" />
                                    Explore Mauritius
                                </h4>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Select a coastline to browse hotels</p>
                            </div>

                            <MauritiusMap 
                                selectedRegion={location}
                                onSelectRegion={(region) => {
                                    setLocation(region)
                                    setShowLocationMap(false)
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}

        {/* Date Logic */}
        {(fields.includes('range') || fields.includes('single')) && (
            <div className={`flex flex-col md:flex-row items-stretch md:items-center border-b md:border-b-0 md:border-r border-slate-100 last:border-0 relative ${fields.includes('range') ? 'flex-[2.2]' : 'flex-[1.1]'}`}>
                {fields.includes('range') ? (
                    <RangeDatePicker 
                        className="flex-1 border-none"
                        range={checkIn && checkOut ? {
                            from: parseISO(checkIn),
                            to: parseISO(checkOut)
                        } : undefined}
                        onSelect={(range) => {
                            if (range?.from) setCheckIn(format(range.from, 'yyyy-MM-dd'))
                            if (range?.to) setCheckOut(format(range.to, 'yyyy-MM-dd'))
                        }}
                        numberOfMonths={2}
                        labels={{
                            check_in: 'Start Date',
                            check_out: 'End Date'
                        }}
                    />
                ) : (
                    <div className="flex-1 px-0 cursor-pointer transition-colors relative group">
                        <DatePicker 
                            selected={checkIn ? parseISO(checkIn) : undefined}
                            onSelect={(date) => setCheckIn(format(date, 'yyyy-MM-dd'))}
                            numberOfMonths={1}
                            placeholder="Select Date"
                            className="border-none"
                        />
                    </div>
                )}
            </div>
        )}

        {/* Time Selection (Restaurants) */}
        {fields.includes('time') && (
            <div className="flex-1 px-6 py-2 border-r border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors relative group">
                <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-1 group-hover:text-red-600 transition-colors">
                    Time
                </label>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <select 
                        className="bg-transparent border-none focus:ring-0 p-0 text-black font-bold text-sm md:text-base w-full appearance-none cursor-pointer"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    >
                        {Array.from({ length: 24 }).map((_, i) => (
                            <React.Fragment key={i}>
                                <option value={`${i.toString().padStart(2, '0')}:00`}>{i.toString().padStart(2, '0')}:00</option>
                                <option value={`${i.toString().padStart(2, '0')}:30`}>{i.toString().padStart(2, '0')}:30</option>
                            </React.Fragment>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* Guests */}
        <div 
          ref={guestRef}
          onClick={() => setShowGuests(!showGuests)}
          className="flex-1 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors relative group md:border-r border-slate-100 last:border-0"
        >
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-1.5 group-hover:text-red-700 transition-colors">
            Guests
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-red-600/60" />
              <span className="text-black font-bold text-sm md:text-base whitespace-nowrap">
                {totalGuests > 0
                  ? `${guests.adults} Adult${guests.adults > 1 ? 's' : ''}${childSummary ? ` · ${childSummary}` : ''}`
                  : 'Add Guests'}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showGuests && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-4 w-[calc(100vw-3rem)] sm:w-80 md:w-80 bg-white rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] border border-slate-100 p-8 z-[100] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-5">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Adults</div>
                      <div className="text-xs text-slate-400">Age 18+</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateGuests('adults', false)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition-all disabled:opacity-30"
                        disabled={guests.adults <= 1}>
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{guests.adults}</span>
                      <button onClick={() => updateGuests('adults', true)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Children</p>

                  {/* Teens 12-17 */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="text-amber-600 text-[11px] font-black bg-amber-50 rounded px-1.5 py-0.5">12–17</span>
                        Teens
                      </div>
                      <div className="text-xs text-slate-400">Ages 12 to 17</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateGuests('teens', false)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-30"
                        disabled={guests.teens <= 0}>
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{guests.teens}</span>
                      <button onClick={() => updateGuests('teens', true)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Children 3-11 */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="text-blue-600 text-[11px] font-black bg-blue-50 rounded px-1.5 py-0.5">3–11</span>
                        Children
                      </div>
                      <div className="text-xs text-slate-400">Ages 3 to 11</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateGuests('children', false)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-30"
                        disabled={guests.children <= 0}>
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{guests.children}</span>
                      <button onClick={() => updateGuests('children', true)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="text-purple-600 text-[11px] font-black bg-purple-50 rounded px-1.5 py-0.5">0–2</span>
                        Infants
                      </div>
                      <div className="text-xs text-slate-400">Under 3 years</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateGuests('infants', false)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 transition-all disabled:opacity-30"
                        disabled={guests.infants <= 0}>
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{guests.infants}</span>
                      <button onClick={() => updateGuests('infants', true)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  </div>

                  <button 
                    onClick={handleSearch}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all transform hover:scale-[1.02] shadow-lg shadow-red-600/20 text-sm uppercase tracking-widest mt-2"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <div className="p-3 md:p-1 md:pl-4">
          <button 
            onClick={handleSearch}
            className="w-full md:w-auto px-10 py-4 md:py-5 bg-red-600 text-white rounded-[1.5rem] md:rounded-full font-black text-xs md:text-sm tracking-[0.2em] hover:bg-slate-900 transition-all transform hover:scale-[1.02] md:hover:scale-105 shadow-2xl shadow-red-600/40 uppercase flex items-center justify-center gap-3"
          >
            <Search size={20} strokeWidth={3} />
            <span>Search</span>
          </button>
        </div>

      </motion.div>
    </div>
  )
}

export default function SearchBar({ initialCategory }: SearchBarProps) {
  return (
    <Suspense fallback={<div className="h-20 animate-pulse bg-slate-50 rounded-full" />}>
      <SearchBarContent initialCategory={initialCategory} />
    </Suspense>
  )
}

