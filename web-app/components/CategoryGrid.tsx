'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'

type Category = {
    id: string
    name: string
    image_url: string
    slug: string
}
const supabase = createClient()
export default function CategoryGrid({ data: externalData }: { data?: Category[] }) {
    const [categories, setCategories] = useState<Category[]>(externalData || [])
    const [loading, setLoading] = useState(!externalData)

    useEffect(() => {
        if (externalData) {
            setCategories(externalData)
            setLoading(false)
            return
        }

        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('id, name, image_url, slug')
                    .eq('is_active', true)
                    .eq('show_on_home', true)
                    .order('display_order', { ascending: true })

                if (error) throw error
                setCategories(data || [])
            } catch (err) {
                console.error('Error fetching categories:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [externalData])

    if (loading) {
        return (
            <div className="py-6 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-64 lg:h-72 bg-slate-100 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (categories.length === 0) return null

    return (
        <div className="py-2 bg-transparent">
            <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={cat.slug ? `/${cat.slug}` : '#'} className="group block relative h-64 lg:h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                                <Image
                                    src={resolveImageUrl(cat.image_url, '/assets/placeholders/hero-placeholder.png')}
                                    alt={`${cat.name} Travel Category | Royal Travel Agency Mauritius`}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
                                    <h3 className="text-white text-xl font-bold uppercase tracking-wider group-hover:text-red-400 transition-colors">
                                        {cat.name}
                                    </h3>
                                    <div className="w-12 h-1 bg-red-600 mt-3 transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
