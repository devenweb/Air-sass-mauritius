'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'

const supabase = createClient()

import { enrichServicesWithLeadPrice, type Service } from '@/lib/services'

export default function ComparePage() {
    const [compareItems, setCompareItems] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCompareItems()
    }, [])

    async function loadCompareItems() {
        try {
            const compareIds = JSON.parse(localStorage.getItem('compare') || '[]')

            if (compareIds.length > 0) {
                const { data, error } = await supabase
                    .from('services')
                    .select('id, name, service_type, location, rating, image_url, amenities, duration_days, duration_hours')
                    .in('id', compareIds)

                if (error) throw error
                
                const enriched = await enrichServicesWithLeadPrice(data as any)
                setCompareItems(enriched || [])
            }
        } catch (error) {
            console.error('Error loading comparison items:', error)
        } finally {
            setLoading(false)
        }
    }

    function removeFromCompare(id: string) {
        const compareIds = JSON.parse(localStorage.getItem('compare') || '[]')
        const updated = compareIds.filter((itemId: string) => itemId !== id)
        localStorage.setItem('compare', JSON.stringify(updated))
        setCompareItems(prev => prev.filter(item => item.id !== id))
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    if (compareItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">No Items to Compare</h1>
                    <p className="text-slate-600 mb-4">Add services to your comparison list to see them here</p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                    >
                        Browse Services
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">Compare Services</h1>
                    <p className="text-slate-600">Compare up to 3 services side by side</p>
                </div>

                <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="p-6 text-left bg-slate-50 font-black text-slate-900 w-64">Feature</th>
                                    {compareItems.map((item) => (
                                        <th key={item.id} className="p-6 bg-slate-50 relative">
                                            <button
                                                onClick={() => removeFromCompare(item.id)}
                                                className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                            <div className="pt-4">
                                                {item.image_url ? (
                                                    <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden">
                                                        <Image
                                                            src={resolveImageUrl(item.image_url)}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-32 bg-gradient-to-br from-red-500 to-slate-700 rounded-xl mb-4" />
                                                )}
                                                <h3 className="font-black text-lg text-slate-900">{item.name}</h3>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-slate-200">
                                    <td className="p-6 font-bold text-slate-700">Type</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6 text-center">
                                            <span className="px-4 py-2 bg-slate-100 rounded-lg font-medium text-slate-700 capitalize">
                                                {item.service_type}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200 bg-slate-50">
                                    <td className="p-6 font-bold text-slate-700">Location</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6 text-center text-slate-600">
                                            {item.location}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200">
                                    <td className="p-6 font-bold text-slate-700">Price (starting from)</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6 text-center">
                                            <span className="text-2xl font-black text-red-600">
                                                Rs {item.lowestPrice?.toLocaleString()}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200 bg-slate-50">
                                    <td className="p-6 font-bold text-slate-700">Rating</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6 text-center">
                                            {item.rating ? (
                                                <span className="text-lg font-bold text-amber-600">⭐ {item.rating}</span>
                                            ) : (
                                                <span className="text-slate-400">No rating</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200">
                                    <td className="p-6 font-bold text-slate-700">Amenities</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6">
                                            <ul className="space-y-2">
                                                {(Array.isArray(item.amenities) ? item.amenities : []).slice(0, 5).map((amenity: any, idx: number) => (
                                                    <li key={idx} className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                                        <Plus size={14} className="text-emerald-600" />
                                                        {amenity}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200 bg-slate-50">
                                    <td className="p-6 font-bold text-slate-700">Actions</td>
                                    {compareItems.map((item) => (
                                        <td key={item.id} className="p-6 text-center">
                                            <Link
                                                href={`/${item.service_type}s/${item.id}`}
                                                className="inline-block px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                        Add More to Compare
                    </Link>
                </div>
            </div>
        </div>
    )
}
