'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie } from 'lucide-react'
import { Button } from './ui/Button'
import { usePathname } from 'next/navigation'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only check once on mount or when pathname changes
    const checkConsent = () => {
      const consent = localStorage.getItem('cookie-consent')
      if (!consent && pathname === '/') {
        const timer = setTimeout(() => setIsVisible(true), 1500)
        return () => clearTimeout(timer)
      } else {
        setIsVisible(false)
      }
      setHasChecked(true)
    }

    checkConsent()
  }, [pathname])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setIsVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('cookie-consent', 'dismissed')
    setIsVisible(false)
  }

  if (!isVisible || pathname !== '/') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-4xl z-[100]"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 p-4 md:p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 items-center justify-center text-red-600 shrink-0">
                <Cookie size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                  Cookie Policy & GDPR
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                  We use cookies to enhance your experience and ensure high-fidelity performance. 
                  By continuing, you agree to our <a href="/privacy-policy" className="text-red-600 hover:underline font-bold">Privacy Policy</a>.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button 
                onClick={handleDecline}
                className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Decline
              </button>
              <Button 
                onClick={handleAccept}
                className="flex-1 md:flex-none px-8 py-3 bg-red-600 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
              >
                Accept All
              </Button>
              <button 
                onClick={handleDismiss}
                className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
