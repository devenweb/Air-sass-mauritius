'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Calendar, MapPin, BookOpen, ExternalLink } from 'lucide-react'

const supabase = createClient()

type Booking = {
    id: string
    service_type: string
    service_name: string
    check_in_date: string
    check_out_date: string
    total_price: number
    status: string
    created_at: string
}

type Profile = {
    id: string
    name: string
    email: string
    phone?: string
    created_at: string
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

    const filteredBookings = useMemo(() => {
        const now = new Date()
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.check_in_date)
            if (filter === 'upcoming') {
                return bookingDate >= now || booking.status === 'pending'
            } else {
                return bookingDate < now && booking.status !== 'pending'
            }
        })
    }, [bookings, filter])

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, email, phone, created_at')
                    .eq('id', user?.id)
                    .single()

                if (error) throw error
                setProfile(data)
            } catch (error) {
                console.error('Error loading profile:', error)
            }
        }

        async function loadBookings() {
            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('id, service_type, service_name, check_in_date, check_out_date, total_price, status, created_at')
                    .eq('customer_id', user?.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setBookings(data || [])
            } catch (error) {
                console.error('Error loading bookings:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            loadProfile()
            loadBookings()
        }
    }, [user, authLoading, router])


    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">My Dashboard</h1>
                        <p className="text-slate-500 font-medium">Welcome back, {profile?.name || 'Traveler'}!</p>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-red-50 rounded-2xl">
                                <User size={32} className="text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Profile</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Name</div>
                                <div className="text-slate-900 font-bold">{profile?.name || 'N/A'}</div>
                            </div>

                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Mail size={12} />
                                    Email
                                </div>
                                <div className="text-slate-900 font-medium">{profile?.email || user.email}</div>
                            </div>

                            {profile?.phone && (
                                <div>
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Phone</div>
                                    <div className="text-slate-900 font-medium">{profile.phone}</div>
                                </div>
                            )}

                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Member Since
                                </div>
                                <div className="text-slate-900 font-medium">
                                    {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bookings */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-50 rounded-xl">
                                        <BookOpen size={24} className="text-red-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">My Bookings</h2>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setFilter('upcoming')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Upcoming
                                    </button>
                                    <button 
                                        onClick={() => setFilter('past')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Past
                                    </button>
                                </div>
                            </div>

                            {filteredBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 text-lg mb-6">No {filter} bookings found</p>
                                    <Link
                                        href="/search"
                                        className="inline-block px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-red-900/20"
                                    >
                                        Explore Destinations
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                                                <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                                                <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="text-right py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredBookings.map((booking) => (
                                                <tr key={booking.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-2">
                                                        <div className="font-bold text-slate-900 text-sm capitalize">{booking.service_type}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{booking.service_name}</div>
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <div className="text-xs font-bold text-slate-700">
                                                            {new Date(booking.check_in_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <div className="text-sm font-black text-slate-900">Rs {booking.total_price?.toLocaleString()}</div>
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                            booking.status.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                                            booking.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-2 text-right">
                                                        <Link 
                                                            href={`/dashboard/bookings/${booking.id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-slate-900 transition-colors"
                                                        >
                                                            View <ExternalLink size={12} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
