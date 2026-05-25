'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
    Plane, Ship, MapPin, Activity, Hotel, Car,
    Award, Globe, ArrowRight,
    Zap, Heart, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { resolveImageUrl } from '@/lib/image'

export default function ServicesPage() {
    const allServices = [
        {
            icon: Ship,
            title: "Cruises",
            desc: "Set sail on an amazing voyage with our selected cruise options.",
            features: ["Comfortable Cabins", "Global Itineraries", "All-Inclusive Options"],
            path: "/cruises",
            color: "bg-red-600",
            image: "/categories/cruises.png"
        },
        {
            icon: Plane,
            title: "Global Flights",
            desc: "Fly to any corner of the globe with reliable airlines and special perks.",
            features: ["Best Price Guarantee", "Priority Support", "Flexible Booking"],
            path: "/flights",
            color: "bg-red-600",
            image: "/categories/flights.png"
        },
        {
            icon: Hotel,
            title: "Handpicked Hotels",
            desc: "Stay in the finest resorts and hidden gems, specially selected for their excellence.",
            features: ["VIP Upgrades", "Best Room Rates", "Local Expertise"],
            path: "/hotels",
            color: "bg-teal-600",
            image: "/categories/hotels.png"
        },
        {
            icon: MapPin,
            title: "Guided Group Tours",
            desc: "Join like-minded travelers on expertly crafted itineraries across continents.",
            features: ["Local Guides", "Unique Experiences", "Small Group Focus"],
            path: "/tours",
            color: "bg-amber-600",
            image: "/categories/group_tours.png"
        },
        {
            icon: Activity,
            title: "Local Experiences",
            desc: "Immerse yourself in authentic Mauritian culture and thrilling adventures.",
            features: ["Private Tours", "Authentic Dining", "Hidden Gems"],
            path: "/activities",
            color: "bg-indigo-600",
            image: "/categories/activities.png"
        },
        {
            icon: Car,
            title: "VIP Transfers",
            desc: " Arrive in style with our reliable and luxurious transportation services.",
            features: ["Meet & Greet", "Modern Fleet", "Fixed Pricing"],
            path: "/transfers",
            color: "bg-slate-900",
            image: "/assets/placeholders/hero-hotel.png"
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-8 flex items-center overflow-hidden bg-slate-900">
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-3xl md:text-7xl font-black mb-4 leading-tight text-white">
                            Our World of <br />
                            <span className="text-red-600">Travel Excellence</span>
                        </h1>
                        <p className="text-sm md:text-xl text-slate-300 leading-relaxed max-w-2xl font-medium">
                            From the sky to the sea, and everywhere in between. Our comprehensive suite of services is designed to handle every detail of your journey.
                        </p>
                    </motion.div>
                </div>
                <div className="absolute -bottom-24 -right-24 opacity-5 rotate-12 text-white">
                    <Globe size={600} />
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-8">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 gap-12">
                        {allServices.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                            >
                                <div className="flex-1 w-full relative">
                                    <div className="aspect-video relative rounded-3xl overflow-hidden shadow-2xl">
                                        <Image 
                                            src={resolveImageUrl(s.image, '/assets/placeholders/category-placeholder.png')} 
                                            alt={s.title} 
                                            fill 
                                            className="object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className={`w-16 h-16 ${s.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                                        <s.icon size={32} />
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900">{s.title}</h2>
                                    <p className="text-xl text-slate-500 leading-relaxed">{s.desc}</p>

                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {s.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-slate-700 font-bold">
                                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                    <CheckCircle2 size={14} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={s.path}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-red-600 transition-all group shadow-xl"
                                    >
                                        Learn More
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Banner */}
            <section className="py-8 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="bg-white rounded-[3rem] p-12 md:p-10 shadow-xl flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/3">
                            <h3 className="text-3xl font-black text-slate-900 mb-6">The Royal Travel Agency Promise</h3>
                            <p className="text-slate-500 leading-relaxed">
                                We believe travel should be more than just a destination; it should be an enriching experience that transforms your perspective.
                            </p>
                        </div>
                        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { icon: Zap, title: "Efficiency", desc: "No time wasted. We handle the logistics so you can enjoy the journey." },
                                { icon: Heart, title: "Personalization", desc: "Your preferences, our expertise. A perfect match for every trip." },
                                { icon: Award, title: "Excellence", desc: "Highest standards in service and partner selection." },
                                { icon: Sparkles, title: "Magic", desc: "Creating those unexpected moments that stay with you forever." }
                            ].map((p, idx) => (
                                <div key={idx} className="flex gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-red-600 shrink-0">
                                        <p.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">{p.title}</h4>
                                        <p className="text-sm text-slate-400">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

function CheckCircle2({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
