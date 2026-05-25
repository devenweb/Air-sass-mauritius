'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { resolveImageUrl } from '@/lib/image'
import { useSettings } from '@/contexts/SettingsContext'

const supabase = createClient()

type PopupAd = {
  id: string
  title: string
  content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | 'none'
  cta_text: string | null
  cta_link: string | null
  display_frequency: 'always' | 'once_per_session' | 'once_per_day'
  popup_type: 'standard' | 'image_only'
}

export default function AnnouncementPopup() {
  const { generalConfig: settings } = useSettings()
  const [ad, setAd] = useState<PopupAd | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const popupAdsActive = settings?.popupAdsActive ?? false

  useEffect(() => {
    if (!popupAdsActive) {
      setAd(null)
      setIsVisible(false)
      return
    }

    async function fetchAd() {
      try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from('popup_ads')
          .select('id, title, content, media_url, media_type, cta_text, cta_link, display_frequency, popup_type, is_active, start_at, end_at, created_at')
          .eq('is_active', true)
          .or(`start_at.is.null,start_at.lte.${now}`)
          .or(`end_at.is.null,end_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        
        if (data && data.length > 0) {
          setAd(data[0] as PopupAd)
          setTimeout(() => setIsVisible(true), 1500)
        }
      } catch (err) {
        console.error('Error fetching popup ad:', err)
      }
    }

    fetchAd()
  }, [popupAdsActive, settings])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!popupAdsActive || !ad) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Popup Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all shadow-lg"
            >
              <X size={20} />
            </button>

            {ad.popup_type === 'image_only' ? (
              <a 
                href={ad.cta_link || '/search'} 
                onClick={handleClose}
                className="relative block w-full h-full overflow-hidden"
              >
                {ad.media_url && (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={resolveImageUrl(ad.media_url)}
                      alt={ad.title || 'Advertisement'}
                      width={800}
                      height={1200}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </a>
            ) : (
              <>
                {/* Media Area */}
                {ad.media_type !== 'none' && ad.media_url && (
                  <div className="relative aspect-video w-full bg-slate-100">
                    {ad.media_type === 'video' ? (
                      <video
                        src={ad.media_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={resolveImageUrl(ad.media_url)}
                        alt={ad.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    {/* Gradient Overlay for media */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  </div>
                )}

                {/* Content Area */}
                <div className="p-8 text-center">
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter leading-tight italic">
                    {ad.title}
                  </h3>
                  {ad.content && (
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed font-medium">
                      {ad.content}
                    </p>
                  )}

                  {/* Action Button */}
                  {ad.cta_text && ad.cta_link && (
                    <div className="flex flex-col gap-3 w-full">
                      <a
                        href={ad.cta_link}
                        onClick={handleClose}
                        className="inline-flex items-center justify-center gap-2 w-full py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all transform hover:scale-[1.02] shadow-xl shadow-red-600/20 group"
                      >
                        {ad.cta_text}
                        <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                      <button
                        onClick={handleClose}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors py-2"
                      >
                        Maybe Later
                      </button>
                    </div>
                  )}
                  
                  {!ad.cta_link && (
                    <button
                      onClick={handleClose}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-red-600 transition-all"
                    >
                      Close
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Subtle brand mark */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-red-600 via-rose-500 to-red-600" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
