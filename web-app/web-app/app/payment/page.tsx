'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'

function PaymentContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const amount = searchParams.get('amount') || '0'
    const service = searchParams.get('service') || 'Service'

    const [processing, setProcessing] = useState(false)
    const [cardNumber, setCardNumber] = useState('')
    const [expiryDate, setExpiryDate] = useState('')
    const [cvv, setCvv] = useState('')
    const [cardName, setCardName] = useState('')

    async function handlePayment(e: React.FormEvent) {
        e.preventDefault()
        setProcessing(true)

        // Simulate request submission
        setTimeout(() => {
            toast.success('Booking request submitted successfully!')
            const bookingId = 'BK' + Date.now().toString().slice(-8)
            router.push(`/booking-confirmation?id=${bookingId}&service=${encodeURIComponent(service)}&amount=${amount}`)
        }, 2000)
    }

    function formatCardNumber(value: string) {
        const cleaned = value.replace(/\s/g, '')
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
        return formatted.slice(0, 19)
    }

    function formatExpiryDate(value: string) {
        const cleaned = value.replace(/\D/g, '')
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
        }
        return cleaned
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">Secure Payment</h1>
                    <p className="text-slate-600 flex items-center justify-center gap-2">
                        <Lock size={16} />
                        Your payment information is encrypted and secure
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <CreditCard size={24} className="text-red-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">Payment Details</h2>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        required
                                        maxLength={19}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600 transition-all text-lg tracking-wider"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                            placeholder="MM/YY"
                                            required
                                            maxLength={5}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">CVV</label>
                                        <input
                                            type="text"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            placeholder="123"
                                            required
                                            maxLength={3}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                        placeholder="JOHN DOE"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600 transition-all uppercase"
                                    />
                                </div>

                                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-red-600 mt-0.5" />
                                        <div className="text-sm text-red-900">
                                            <strong>Demo Payment Mode</strong><br />
                                            This is a demonstration. No actual payment will be processed. Use any card details to proceed.
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-8 py-4 bg-red-600 text-white rounded-xl font-black text-lg uppercase tracking-wider hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            Submitting...
                                        </div>
                                    ) : (
                                        `Confirm Booking Request`
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl sticky top-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Service</span>
                                    <span className="font-bold text-slate-900">{service}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="font-bold text-slate-900">Rs {parseInt(amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tax (0%)</span>
                                    <span className="font-bold text-slate-900">Rs 0</span>
                                </div>
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-slate-900">Total</span>
                                        <span className="text-2xl font-black text-red-600">Rs {parseInt(amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                                    <Lock size={14} />
                                    <span className="font-bold">Secure Payment</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Your payment information is encrypted using SSL technology
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        }>
            <PaymentContent />
        </Suspense>
    )
}
