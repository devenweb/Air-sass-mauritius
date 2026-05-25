
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/image';
import { Plane, Globe, Shield, CreditCard, Clock, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Flight Bookings | Royal Travel Agency',
  description: 'Book your international and domestic flights with Travel Lounge. We offer the best rates and excellent service for all your travel needs.',
};

export default function FlightPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-8 flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={resolveImageUrl("/assets/hero/flight_booking_hero_1773391370829.png")}
            alt="Flight Booking"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-7xl font-black mb-6 tracking-normal uppercase">Your Journey Starts Here</h1>
            <p className="text-sm md:text-xl md:text-2xl mb-6 text-white/90 font-light font-sans max-w-2xl leading-relaxed">As an IATA accredited travel agency, we offer safe, secure, and memorable flight bookings. Benefit from the assistance of our expert agents for both local and international travel.</p>
            <Link 
              href="/contact"
              className="inline-block px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all transform hover:scale-105"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Book With Us?</h2>
            <div className="w-20 h-1.5 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Globe, title: 'Global Network', desc: 'Access to hundreds of airlines and thousands of destinations worldwide.' },
              { icon: Shield, title: 'Secure Booking', desc: 'Your safety and data security are our top priorities throughout the booking process.' },
              { icon: CreditCard, title: 'Best Price Guarantee', desc: 'We negotiate the best rates to ensure you get value for your money.' },
              { icon: Clock, title: '24/7 Support', desc: 'Our dedicated team is available around the clock to assist with any travel changes.' },
              { icon: MapPin, title: 'Airport Transfers', desc: 'Seamlessly connect your flight with reliable airport transfers.' },
              { icon: Plane, title: 'Top Comfort', desc: 'Special access to airport lounges and comfortable cabin upgrades.' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
