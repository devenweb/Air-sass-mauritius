import { Suspense } from 'react'
import BookingPageClient from './BookingPageClient'
import { Loader2 } from 'lucide-react'

export const metadata = {
    title: 'Book Your Stay | Royal Travel Agency',
    description: 'Complete your booking inquiry for our luxury boutique services.',
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Loading your reservation...</p>
                </div>
            </div>
        }>
            <BookingPageClient />
        </Suspense>
    )
}
