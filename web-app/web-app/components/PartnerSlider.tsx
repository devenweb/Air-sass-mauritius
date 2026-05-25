'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { resolveImageUrl } from '@/lib/image';

const supabase = createClient();

export default function PartnerSlider() {
  const [partners, setPartners] = React.useState<{ name: string; logo_url: string }[]>([]);

  React.useEffect(() => {
    async function loadPartners() {
      const { data } = await supabase
        .from('partners')
        .select('name, logo_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
        
      if (data) setPartners(data);
    }
    loadPartners();
  }, []);

  // Only double the partners if we have enough and show nothing if empty
  if (partners.length === 0) return null;
  
  const sliderPartners = [...partners, ...partners, ...partners]; // Triple for smoother loop on ultra-wide
  
  return (
    <div className="py-6 overflow-hidden w-full relative">
      {/* Optional gradient overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10" />
      
      <motion.div
        className="flex gap-10 items-center whitespace-nowrap"
        animate={{
          x: [0, -partners.length * (240 + 80)], // Width (240) + Gap (80)
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: partners.length * 3, // 3 seconds per partner
            ease: "linear",
          },
        }}
        style={{ width: 'max-content' }}
      >
        {sliderPartners.map((partner, index) => (
          <div
            key={`${partner.name}-${index}`}
            className="w-60 h-24 relative flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image
              src={resolveImageUrl(partner.logo_url)}
              alt={partner.name}
              fill
              className="object-contain"
              sizes="240px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
