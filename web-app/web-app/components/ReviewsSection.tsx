'use client'

import { useState, useEffect } from 'react'
import { Star, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import StarRating from '@/components/ui/StarRating'

const supabase = createClient()

type Review = {
    id: string
    customer_name: string
    rating: number
    comment: string
    created_at: string
    status: string
}

type ReviewsSectionProps = {
    serviceId: string
    serviceType: string
}

export default function ReviewsSection({ serviceId, serviceType }: ReviewsSectionProps) {
    const { user } = useAuth()
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function loadReviews() {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('id, customer_name, rating, comment, created_at, status')
                    .eq('service_id', serviceId)
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (error) throw error
                setReviews(data || [])
            } catch (error) {
                console.error('Error loading reviews:', error)
            } finally {
                setLoading(false)
            }
        }

        loadReviews()
    }, [serviceId])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!user) {
            toast.error('Please login to submit a review')
            return
        }

        setSubmitting(true)
        try {
            // Get user profile for name
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .single()

            const { error } = await supabase
                .from('reviews')
                .insert([{
                    service_id: serviceId,
                    service_type: serviceType,
                    customer_id: user.id,
                    customer_name: profile?.name || 'Anonymous',
                    rating,
                    comment,
                    status: 'pending'
                }])

            if (error) throw error

            toast.success('Review submitted! It will be visible after approval.')
            setComment('')
            setRating(5)
            setShowForm(false)
        } catch (error) {
            toast.error('Failed to submit review')
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const avgRatingValue = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
        : 0

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Reviews</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <StarRating rating={avgRatingValue} size={20} />
                            <span className="text-xl font-black text-slate-900 leading-none">{avgRatingValue.toFixed(1)}</span>
                        </div>
                        <span className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-none">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                </div>
                {user && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"
                    >
                        Write Review
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-widest">Your Experience</h3>

                    <div className="mb-6">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Rating</label>
                        <div className="flex gap-2 p-2 bg-white rounded-2xl w-fit border border-slate-100 shadow-sm">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRating(value)}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <Star
                                        size={28}
                                        className={value <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-slate-100'}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Your Review</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-6 py-5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition-all font-medium text-slate-600"
                            placeholder="Share your experience..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-8 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20 flex-1"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">{review.customer_name}</div>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={review.rating} size={14} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{review.rating} / 5</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed italic">&ldquo;{review.comment}&rdquo;</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
