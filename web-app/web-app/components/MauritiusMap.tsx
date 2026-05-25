'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MauritiusMapProps {
    onSelectRegion: (region: string) => void
    selectedRegion?: string
    className?: string
}

const regions = [
    {
        id: 'north',
        name: 'North Coast',
        label: 'The North',
        description: 'Grand Baie, Pereybere, Trou aux Biches',
        // Accurate Mauritius North path
        path: "M 48 2 L 60 5 L 82 18 L 88 38 L 75 48 L 52 42 L 40 28 L 48 2 Z",
        color: "red",
        accent: "bg-red-500",
        hover: "hover:fill-red-500/30",
        selected: "fill-red-500/60"
    },
    {
        id: 'east',
        name: 'East Coast',
        label: 'The East',
        description: 'Belle Mare, Post-Lafayette',
        path: "M 88 38 L 98 55 L 90 78 L 78 85 L 70 55 L 75 48 L 88 38 Z",
        color: "blue",
        accent: "bg-blue-500",
        hover: "hover:fill-blue-500/30",
        selected: "fill-blue-500/60"
    },
    {
        id: 'south',
        name: 'South Coast',
        label: 'The South',
        description: 'Bel Ombre, Le Morne',
        path: "M 78 85 L 65 98 L 35 98 L 22 88 L 48 72 L 68 68 Z",
        color: "emerald",
        accent: "bg-emerald-500",
        hover: "hover:fill-emerald-500/30",
        selected: "fill-emerald-500/60"
    },
    {
        id: 'west',
        name: 'West Coast',
        label: 'The West',
        description: 'Flic en Flac, Tamarin',
        path: "M 40 28 L 52 42 L 52 65 L 48 72 L 22 88 L 12 70 L 18 45 L 40 28 Z",
        color: "amber",
        accent: "bg-amber-500",
        hover: "hover:fill-amber-500/30",
        selected: "fill-amber-500/60"
    },
    {
        id: 'central',
        name: 'Central',
        label: 'Central',
        description: 'Moka, Curepipe',
        path: "M 52 42 L 75 48 L 70 55 L 78 85 L 48 72 L 52 65 L 52 42 Z",
        color: "slate",
        accent: "bg-slate-500",
        hover: "hover:fill-slate-500/30",
        selected: "fill-slate-500/60"
    }
]

export const MauritiusMap: React.FC<MauritiusMapProps> = ({ onSelectRegion, selectedRegion, className }) => {
    const [hoveredRegion, setHoveredRegion] = React.useState<string | null>(null)

    return (
        <div className={cn("relative w-full max-w-[340px] mx-auto", className)}>
            <div className="relative aspect-square mb-6">
                {/* Subtle Glow */}
                <div className="absolute inset-0 bg-blue-50/30 rounded-full blur-3xl -z-10" />
                
                <svg 
                    viewBox="0 0 110 110" 
                    className="w-full h-full relative z-10 drop-shadow-xl overflow-visible"
                >
                    {/* Ghost Outline */}
                    <path 
                        d="M 48 2 L 60 5 L 82 18 L 88 38 L 98 55 L 90 78 L 78 85 L 65 98 L 35 98 L 22 88 L 12 70 L 18 45 L 40 28 L 48 2 Z"
                        className="fill-slate-50/50 stroke-slate-200 stroke-[0.3]"
                    />

                    {regions.map((region) => (
                        <motion.path
                            key={region.id}
                            d={region.path}
                            className={cn(
                                "cursor-pointer transition-all duration-300 stroke-white stroke-[0.5] fill-transparent",
                                region.hover,
                                selectedRegion?.toLowerCase() === region.name.toLowerCase() ? region.selected : ""
                            )}
                            onMouseEnter={() => setHoveredRegion(region.name)}
                            onMouseLeave={() => setHoveredRegion(null)}
                            onClick={() => onSelectRegion(region.name)}
                            whileHover={{ strokeWidth: 1 }}
                        />
                    ))}
                    
                    {/* Markers & Labels */}
                    {regions.map((region) => {
                        const centers: Record<string, {x: number, y: number}> = {
                            north: { x: 62, y: 20 },
                            east: { x: 82, y: 56 },
                            south: { x: 50, y: 88 },
                            west: { x: 28, y: 60 },
                            central: { x: 62, y: 62 }
                        }
                        const center = centers[region.id]
                        const isActive = hoveredRegion === region.name || selectedRegion === region.name

                        return (
                            <g key={`lbl-${region.id}`} className="pointer-events-none">
                                <circle
                                    cx={center.x}
                                    cy={center.y}
                                    r={isActive ? 2 : 1}
                                    className={cn("transition-all duration-300", isActive ? "fill-red-600" : "fill-slate-400")}
                                />
                                {isActive && (
                                    <text
                                        x={center.x}
                                        y={center.y - 5}
                                        textAnchor="middle"
                                        className="fill-black font-black uppercase text-[4px] tracking-widest"
                                    >
                                        {region.label}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* Compact List */}
            <div className="grid grid-cols-2 gap-2 pb-2">
                {regions.map((region) => (
                    <button
                        key={`sel-${region.id}`}
                        onClick={() => onSelectRegion(region.name)}
                        onMouseEnter={() => setHoveredRegion(region.name)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        className={cn(
                            "text-left p-3 rounded-2xl transition-all border flex flex-col gap-1",
                            selectedRegion?.toLowerCase() === region.name.toLowerCase()
                                ? "bg-red-600 border-red-600 shadow-lg shadow-red-600/20"
                                : "bg-white border-slate-100 hover:border-red-600"
                        )}
                    >
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            selectedRegion?.toLowerCase() === region.name.toLowerCase() ? "text-white" : "text-black"
                        )}>
                            {region.label}
                        </span>
                        <span className={cn(
                            "text-[8px] font-bold uppercase",
                            selectedRegion?.toLowerCase() === region.name.toLowerCase() ? "text-red-100" : "text-slate-400"
                        )}>
                            {region.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
