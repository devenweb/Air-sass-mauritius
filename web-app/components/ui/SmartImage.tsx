'use client'

import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { resolveImageUrl, ImageOptions } from '@/lib/image'

interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  fallback?: string
  options?: ImageOptions
}

/**
 * SmartImage Component
 * 
 * Accounts for:
 * 1. Missing uploads (null/undefined src)
 * 2. Broken URLs (onError triggers fallback)
 * 3. Deleted media (storage 404s trigger fallback)
 */
export default function SmartImage({ 
  src, 
  fallback = '/assets/placeholders/hero-hotel.png', 
  alt,
  options,
  ...props 
}: SmartImageProps) {
  const [error, setError] = useState(false)
  
  // Resolve the initial URL
  const resolvedSrc = resolveImageUrl(src, fallback, options)
  
  // If we've already hit an error, or if resolvedSrc is empty, use the absolute fallback
  const finalSrc = error ? fallback : resolvedSrc

  return (
    <Image
      src={finalSrc}
      alt={alt || 'Travel Image'}
      unoptimized={true}
      onError={() => {
        if (!error) {
          console.warn(`[SmartImage] Failed to load image: ${resolvedSrc}. Falling back to ${fallback}`)
          setError(true)
        }
      }}
      {...props}
    />
  )
}
