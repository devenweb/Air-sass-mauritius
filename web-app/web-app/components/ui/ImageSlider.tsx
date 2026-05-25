'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import SmartImage from './SmartImage'

interface ImageSliderProps {
    images: string[]
    alt: string
    aspectRatio?: string
    className?: string
    dotPosition?: 'bottom' | 'inside'
    showArrows?: boolean
}

export default function ImageSlider({ 
    images, 
    alt, 
    aspectRatio = "aspect-[16/10]",
    className,
    dotPosition = 'inside',
    showArrows = true
}: ImageSliderProps) {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    if (!images || images.length === 0) return null

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIdx(prev => (prev + 1) % images.length)
    }

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIdx(prev => (prev - 1 + images.length) % images.length)
    }

    return (
        <div 
            ref={containerRef}
            className={cn("relative group/slider overflow-hidden rounded-[2rem]", aspectRatio, className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <SmartImage
                        src={images[currentIdx]}
                        alt={`${alt} - Image ${currentIdx + 1}`}
                        fill
                        options={{ width: 800, quality: 80 }}
                        className="object-cover transition-transform duration-700 group-hover/slider:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        fallback="/assets/placeholders/hero-hotel.png"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300" />

            {/* Arrows */}
            {showArrows && images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-10"
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div className={cn(
                    "absolute flex gap-1.5 z-10 transition-all duration-300",
                    dotPosition === 'inside' ? "bottom-4 left-1/2 -translate-x-1/2" : "bottom-0 left-0 w-full justify-center p-2"
                )}>
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation()
                                setCurrentIdx(i)
                            }}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                currentIdx === i ? "bg-white w-6" : "bg-white/40 w-1.5 hover:bg-white/60"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
