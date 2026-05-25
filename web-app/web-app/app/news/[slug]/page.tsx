'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import { stripHtml } from '@/lib/utils'

const supabase = createClient()

type Post = {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    featured_image: string | null
    published_at: string
    tags: string[]
}

export default function NewsArticlePage() {
    const params = useParams()
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.slug) {
            loadPost(params.slug as string)
        }
    }, [params.slug])

    async function loadPost(slug: string) {
        try {
            const { data, error } = await supabase
                .from('editorial_posts')
                .select('id, title, slug, content, excerpt, featured_image, published_at, tags')
                .eq('slug', slug)
                .eq('status', 'published')
                .single()

            if (error) throw error
            setPost(data)
        } catch (error) {
            console.error('Error loading post:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">Article Not Found</h1>
                    <Link href="/news" className="text-red-600 font-bold hover:underline">
                        ← Back to News
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Back Button */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/news" className="inline-flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors">
                        <ArrowLeft size={18} />
                        Back to News
                    </Link>
                </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="aspect-video rounded-[3rem] overflow-hidden relative">
                        <Image
                            src={resolveImageUrl(post.featured_image)}
                            alt={post.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Article Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <article className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                        <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">{post.title}</h1>

                    {/* Excerpt */}
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">{stripHtml(post.excerpt)}</p>

                    {/* Content */}
                    <div 
                        className="boutique-prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                    />

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Tag size={16} className="text-red-600" />
                                {post.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-5 py-2 bg-slate-50 text-slate-600 rounded-full font-bold text-[10px] uppercase tracking-widest border border-slate-100"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </article>

                {/* Back Button */}
                <div className="mt-4 text-center">
                    <Link
                        href="/news"
                        className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                    >
                        Read More Articles
                    </Link>
                </div>
            </div>
        </div>
    )
}
