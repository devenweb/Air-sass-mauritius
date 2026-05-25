'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { resolveImageUrl } from '@/lib/image'
import { sanitizeHtml } from '@/lib/sanitize'

interface HeroBannerProps {
    badge?: string
    title: string
    subtitle?: string
    description?: string
    image: string
    alt?: string
    opacity?: number
    className?: string
}

export default function HeroBanner({ badge, title, subtitle, description, image, alt, opacity = 0.4, className = "" }: HeroBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    })

    // Parallax effect: translate background faster or slower than scroll
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])

    return (
        <div 
            ref={containerRef} 
            className={`relative py-8 md:py-12 flex items-center overflow-hidden bg-slate-900 border-b border-white/10 min-h-[250px] md:min-h-[350px] ${className}`}
        >
            <motion.div 
                style={{ y }} 
                className="absolute inset-0 z-0 h-[120%] -top-[10%]"
            >
                <Image
                    src={resolveImageUrl(image)}
                    alt={alt || "Hero Banner"}
                    fill
                    className="object-cover"
                    style={{ opacity }}
                    priority
                />
            </motion.div>
            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-5xl mx-auto"
                >
                    {badge && (
                        <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-block py-2 px-6 bg-red-600 rounded-full text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] mb-8 shadow-xl shadow-red-600/20"
                        >
                            {badge}
                        </motion.span>
                    )}
                    <h1 
                        className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter text-center leading-[0.95] mb-6"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
                    />
                    {(subtitle || description) && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            {subtitle && (
                                <p 
                                    className="text-slate-200 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-tight italic opacity-90"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtitle) }}
                                />
                            )}
                            {description && (
                                <p 
                                    className="text-white font-medium text-sm md:text-lg max-w-3xl mx-auto leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
                                />
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
