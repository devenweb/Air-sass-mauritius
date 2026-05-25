/*
'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function PromoBanner() {
  return (
    <div className="container mx-auto px-6 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative h-40 md:h-52 rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl shadow-red-600/20"
      >
        <Image
          src="/assets/promo-banner.png"
          alt="Special Offer: 20 for 20"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-red-600/90 flex items-center justify-between px-8 md:px-8 overflow-hidden">
          
          <div className="hidden md:flex items-center gap-4 relative z-10">
            <div className="bg-white text-black font-black text-6xl md:text-8xl p-4 rounded-3xl -rotate-6 shadow-2xl flex flex-col items-center leading-none">
              <span className="text-4xl text-red-600">20</span>
              <div className="w-full h-1 bg-black/10 my-2" />
              <div className="flex items-center gap-2">
                <span className="text-sm uppercase tracking-tighter">for</span>
                <span className="text-5xl">20</span>
              </div>
            </div>
            <div className="absolute -top-6 -right-12 bg-yellow-400 text-black font-black text-xl md:text-2xl p-4 rounded-full rotate-12 shadow-xl border-4 border-white animate-pulse">
              20% OFF
            </div>
          </div>

          <div className="max-w-xl text-white relative z-10 text-right md:text-left ml-auto md:ml-0">
            <h2 className="text-3xl md:text-6xl font-black mb-2 tracking-tighter leading-tight drop-shadow-lg uppercase italic">
              Enjoy an extra <span className="text-yellow-400">on activities</span>
            </h2>
            <p className="text-sm md:text-2xl font-bold opacity-90 leading-relaxed uppercase tracking-[0.3em] drop-shadow-md">
              Limited slots available
            </p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] pointer-events-none" />
      </motion.div>
    </div>
  )
}
*/

// Component commented out as requested by USER
export default function PromoBanner() {
    return null;
}
