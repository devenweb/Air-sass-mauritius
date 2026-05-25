'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { sanitizeHtml } from '@/lib/sanitize'

import { cn, stripHtml } from '@/lib/utils'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string
  published_at: string
  tags: string[]
}

export default function NewsSection({ label, title }: { label?: string, title?: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadNews() {
      try {
        const { data, error } = await supabase
          .from('editorial_posts')
          .select('id, title, slug, excerpt, featured_image, published_at, tags')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(3)
        
        if (error) {
          console.error('Error loading news:', error)
          return
        }
        if (data) setPosts(data)
      } catch (err) {
        console.error('Catch error loading news:', err)
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [supabase])

  if (loading) return null
  if (posts.length === 0) return null

  return (
    <section className="py-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-6">
              {label || "Travel Insights"}
            </h2>
            <h3 
                className="text-4xl md:text-6xl font-black text-black leading-[1.1] tracking-tighter"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(title || 'Latest from the <br/> <span class="text-red-600 underline decoration-red-600/20 underline-offset-8">Insider Lounge</span>') }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              href="/news"
              className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-black hover:text-red-600 transition-colors"
            >
              View All Articles
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <Link href={`/news/${post.slug}`}>
                <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-4 shadow-2xl shadow-slate-200 group-hover:shadow-red-900/10 transition-all duration-500">
                  <Image
                    src={resolveImageUrl(post.featured_image, '/assets/placeholders/hero-placeholder.png')}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    {post.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <div className="flex items-center gap-6 text-[10px] font-bold text-black uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <Calendar size={12} className="text-red-600" />
                      {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h4 className="text-2xl font-black text-black leading-tight group-hover:text-red-600 transition-colors tracking-tight">
                    {post.title}
                  </h4>
                  
                  <p className="text-black leading-relaxed line-clamp-2 font-medium">
                    {stripHtml(post.excerpt)}
                  </p>

                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                    Read Post <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
