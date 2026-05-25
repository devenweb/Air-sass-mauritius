/**
 * LEGACY FILE: Rodrigues Page (Archived)
 * This file is maintained for historical reference as per project rules.
 * The active page is now a redirect in page.tsx.
 */

// 'use client'
// 
// import React, { useState, useEffect } from 'react'
// import Image from 'next/image'
// import ServiceCard from '@/components/ServiceCard'
// import { createClient } from '@/lib/supabase'
// 
// const supabase = createClient()
// 
// type Service = {
//     id: string
//     name: string
//     location: string
//     base_price: number
//     image_url: string
//     service_type: string
// }
// 
// export default function RodriguesPage() {
//     const [services, setServices] = useState<Service[]>([])
//     const [loading, setLoading] = useState(true)
// 
//     useEffect(() => {
//         loadRodriguesServices()
//     }, [])
// 
//     async function loadRodriguesServices() {
//         try {
//             const { data, error } = await supabase
//                 .from('services')
//                 .select('id, name, location, base_price, image_url, service_type')
//                 .eq('region', 'Rodrigues')
//                 .order('name', { ascending: true })
// 
//             if (error) throw error
//             setServices(data || [])
//         } catch (error) {
//             console.error('Error loading Rodrigues services:', error)
//         } finally {
//             setLoading(false)
//         }
//     }
//     return (
//         <div className="min-h-screen bg-slate-50 pb-6">
//             {/* Hero */}
//             <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
//                 <Image
//                     src="/hero-hotel.png" // Ideally a specific Rodrigues image
//                     alt="Rodrigues"
//                     fill
//                     className="object-cover"
//                     priority
//                 />
//                 <div className="absolute inset-0 bg-black/40" />
//                 <div className="relative z-10 text-center text-white px-4">
//                     <h1 className="text-4xl md:text-8xl font-bold mb-6 font-serif">Rodrigues: The Authentic Escape</h1>
//             <p className="text-xl md:text-2xl mb-6 text-white/90 font-light max-w-2xl mx-auto">Explore the hidden gem of the Indian Ocean. From charming guest houses to boutique hotels, we provide the best local hospitality and transfers.</p>
//                 </div>
//             </div>
// 
//             {/* Content */}
//             <div className="container mx-auto px-4 -mt-6 relative z-20">
//                 <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-8">
//                     <div className="flex flex-wrap gap-4 items-center justify-between">
//                         <h2 className="text-2xl font-bold text-slate-900">Island Getaways</h2>
//                         <button className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors">Flight + Hotel Packages</button>
//                     </div>
//                 </div>
// 
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                     {loading ? (
//                         [...Array(3)].map((_, i) => (
//                             <div key={i} className="animate-pulse bg-white rounded-3xl h-96 border border-slate-100" />
//                         ))
//                     ) : (
//                         services.map(service => (
//                             <ServiceCard
//                                 key={service.id}
//                                 id={service.id}
//                                 title={service.name}
//                                 location={service.location}
//                                 price={service.base_price}
//                                 image={service.image_url || "/hero-hotel.png"}
//                                 link={`/${service.service_type === 'activity' ? 'activities' : service.service_type + 's'}/${service.id}`}
//                                 tag={service.service_type.toUpperCase()}
//                             />
//                         ))
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }

export default function ArchivedPage() {
    return null;
}
