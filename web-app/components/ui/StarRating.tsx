'use client'

import React from 'react'
import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
    rating: number
    maxRating?: number
    size?: number
    className?: string
    showNumber?: boolean
}

export default function StarRating({ 
    rating, 
    maxRating = 5, 
    size = 14, 
    className,
    showNumber = false 
}: StarRatingProps) {
    // Round to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2
    
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <div className="flex items-center gap-0.5">
                {Array.from({ length: maxRating }).map((_, i) => {
                    const starValue = i + 1
                    
                    if (starValue <= roundedRating) {
                        return <Star key={i} size={size} className="text-amber-500 fill-amber-500" />
                    } else if (starValue - 0.5 === roundedRating) {
                        return <StarHalf key={i} size={size} className="text-amber-500 fill-amber-500" />
                    } else {
                        return <Star key={i} size={size} className="text-slate-200 fill-slate-100" />
                    }
                })}
            </div>
            {showNumber && (
                <span className="text-xs font-black text-slate-900 ml-1">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    )
}
