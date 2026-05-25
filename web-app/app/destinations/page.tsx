'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plane } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';
import { resolveImageUrl } from '@/lib/image';

export default function DestinationsPage() {
  const { content } = usePageContent('destinations');
  const hero = content.hero || {};

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-8 flex items-center justify-center bg-slate-950 overflow-hidden">
        <Image
          src={resolveImageUrl(hero.image_url, "/assets/hero/destinations_hero.png")}
          alt={hero.title || "Global Destinations"}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-3xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-none">
                {hero.title || "Explore the World"}
            </h1>
            <p className="text-sm md:text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                {hero.description || "Wherever you want to go, we have the expertise to get you there in style and comfort."}
            </p>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-8">
        <div className="container mx-auto px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[
                    { name: 'Mauritius', desc: 'Our home and your tropical island.', link: '/destinations/mauritius', img: '/assets/hero/mauritius_destination_hero_1773391482617.png' },
                    { name: 'Rodrigues', desc: 'The authentic alternative island escape.', link: '/destinations/rodrigues', img: '/assets/hero/rodrigues_hotels_hero_1773391499243.png' },
                    { name: 'International', desc: 'Experience the world with our selected packages.', link: '/destinations/international', img: '/assets/hero/flight_booking_hero_1773391370829.png' },
                    { name: 'Asia', desc: 'Vibrant cities and serene landscapes.', link: '/packages', img: '/assets/hero/group_tours_hero_1773391421071.png' },
                    { name: 'Middle East', desc: 'Modern wonders and ancient traditions.', link: '/packages', img: '/assets/hero/tailormade_travel_hero_1773391405705.png' },
                    { name: 'Africa', desc: 'Untamed wildlife and cultural heritage.', link: '/packages', img: '/assets/hero/day_packages_hero_1773391515388.png' },
                ].map((dest, i) => (
                    <Link key={i} href={dest.link} className="group block overflow-hidden rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-sm hover:shadow-2xl transition-all h-full">
                        <div className="relative h-72">
                            <Image src={resolveImageUrl(dest.img)} alt={dest.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="p-10">
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">{dest.name}</h3>
                            <p className="text-slate-600 mb-6 leading-relaxed">{dest.desc}</p>
                            <span className="text-primary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">Explore <ArrowRight size={18} /></span>
                        </div>
                    </Link>
                ))}
             </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
               <Plane className="mx-auto mb-4 text-primary" size={64} />
               <h2 className="text-3xl md:text-5xl font-bold mb-4">Can&apos;t decide where to go?</h2>
               <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">Let our travel experts design a tailor-made experience that matches your dreams perfectly.</p>
               <Link href="/tailormade" className="px-10 py-5 bg-primary text-white font-bold rounded-full hover:bg-white hover:text-slate-900 transition-all inline-block">Plan My Bespoke Trip</Link>
          </div>
      </section>
    </div>
  );
}
