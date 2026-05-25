'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Save, Trash2, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

type SavedSearch = {
    id: string
    name: string
    serviceType: string
    filters: {
        location?: string
        minPrice?: number
        maxPrice?: number
        minRating?: number
        dates?: string
    }
    notifications: boolean
    createdAt: string
}

export default function SavedSearchesPage() {
    const [searches, setSearches] = useState<SavedSearch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSearches()
    }, [])

    function loadSearches() {
        try {
            const saved = localStorage.getItem('savedSearches')
            if (saved) {
                setSearches(JSON.parse(saved))
            }
        } catch (error) {
            console.error('Error loading searches:', error)
        } finally {
            setLoading(false)
        }
    }

    function deleteSearch(id: string) {
        const updated = searches.filter(s => s.id !== id)
        setSearches(updated)
        localStorage.setItem('savedSearches', JSON.stringify(updated))
        toast.success('Search deleted')
    }

    function toggleNotifications(id: string) {
        const updated = searches.map(s =>
            s.id === id ? { ...s, notifications: !s.notifications } : s
        )
        setSearches(updated)
        localStorage.setItem('savedSearches', JSON.stringify(updated))
        toast.success('Notifications updated')
    }

    function executeSearch(search: SavedSearch) {
        const params = new URLSearchParams()
        if (search.filters.location) params.set('location', search.filters.location)
        if (search.filters.minPrice) params.set('minPrice', search.filters.minPrice.toString())
        if (search.filters.maxPrice) params.set('maxPrice', search.filters.maxPrice.toString())
        if (search.filters.minRating) params.set('rating', search.filters.minRating.toString())

        window.location.href = `/${search.serviceType}?${params.toString()}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Saved Searches</h1>
                    <p className="text-slate-600 dark:text-slate-400">Quickly access your favorite search criteria</p>
                </div>

                {searches.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 text-center border border-slate-200 dark:border-slate-700">
                        <Save size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Saved Searches</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Save your search criteria to quickly find what you&apos;re looking for
                        </p>
                        <Link
                            href="/hotels"
                            className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                        >
                            Start Searching
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {searches.map((search) => (
                            <div
                                key={search.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-red-600 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                            {search.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium capitalize">
                                                {search.serviceType}
                                            </span>
                                            {search.filters.location && (
                                                <span>📍 {search.filters.location}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotifications(search.id)}
                                        className={`p-2 rounded-lg transition-colors ${search.notifications
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                            }`}
                                        title={search.notifications ? 'Notifications on' : 'Notifications off'}
                                    >
                                        {search.notifications ? <Bell size={20} /> : <BellOff size={20} />}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {search.filters.minPrice && (
                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
                                            Min: Rs {search.filters.minPrice.toLocaleString()}
                                        </span>
                                    )}
                                    {search.filters.maxPrice && (
                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
                                            Max: Rs {search.filters.maxPrice.toLocaleString()}
                                        </span>
                                    )}
                                    {search.filters.minRating && (
                                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
                                            ⭐ {search.filters.minRating}+
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => executeSearch(search)}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                                    >
                                        Search Now
                                    </button>
                                    <button
                                        onClick={() => deleteSearch(search.id)}
                                        className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
