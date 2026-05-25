'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { Calendar, ArrowRight, Tag } from 'lucide-react'
import { usePageContent } from '@/hooks/usePageContent'
import { stripHtml } from '@/lib/utils'

const supabase = createClient()

type Post = {
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image: string | null
    published_at: string
    tags: string[]
}

export default function NewsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const { content } = usePageContent('news')
    const [loading, setLoading] = useState(true)
    
    const hero = (content as any)?.hero || {}

    useEffect(() => {
        loadPosts()
    }, [])

    async function loadPosts() {
        try {
            const { data, error } = await supabase
                .from('editorial_posts')
                .select('id, title, slug, excerpt, featured_image, published_at, tags')
                .eq('status', 'published')
                .order('published_at', { ascending: false })

            if (error) throw error
            setPosts(data || [])
        } catch (error) {
            console.error('Error loading posts:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-6">
            {/* Hero */}
            <div className="relative py-8 flex items-center justify-center overflow-hidden bg-slate-950">
                <Image
                    src={resolveImageUrl(hero.image_url)}
                    alt={hero.title || "Travel News"}
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                <div className="relative z-10 text-center text-white px-6">
                    <h1 className="text-3xl md:text-6xl font-black mb-4 uppercase tracking-tight leading-none">
                        {hero.title || "Travel Insights"}
                    </h1>
                    <p className="text-sm md:text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                        {hero.description || "Discover the latest trends, guides, and stories from our local experts."}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-4 relative z-20">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-8">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <h2 className="text-3xl font-black text-slate-900 italic">Latest Articles</h2>
                        <div className="flex gap-2">
                            <button className="px-6 py-2 bg-red-600 rounded-lg font-bold text-white shadow-lg shadow-red-600/20">All Topics</button>
                            <button className="px-6 py-2 bg-slate-100 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors">Destinations</button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white rounded-[2.5rem] h-[450px] border border-slate-100" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/news/${post.slug}`}
                                className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:border-red-600 transition-all duration-500 shadow-sm hover:shadow-2xl flex flex-col h-full"
                            >
                                <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">
                                    <Image
                                        src={resolveImageUrl(post.featured_image)}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                            {post.tags?.[0] || 'TRAVEL'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 font-bold">
                                        <Calendar size={14} className="text-red-600" />
                                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-red-600 transition-colors leading-tight">
                                        {post.title}
                                    </h3>

                                    <p className="text-slate-600 mb-4 line-clamp-3 text-sm font-light leading-relaxed">
                                        {stripHtml(post.excerpt)}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-xs font-black text-red-600 flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest">
                                            Read More <ArrowRight size={16} />
                                        </span>
                                        <div className="flex gap-1">
                                            {post.tags?.slice(1, 3).map((tag, idx) => (
                                                <Tag key={idx} size={14} className="text-slate-300" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white rounded-3xl border border-slate-100">
                        <p className="text-slate-500 text-lg">No articles discovered yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
