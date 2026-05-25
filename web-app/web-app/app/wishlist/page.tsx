'use client'

import { useWishlist } from '@/contexts/WishlistContext'
import Link from 'next/link'
import { Trash2, Heart, MapPin, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function WishlistPage() {
    const { wishlist, removeFromWishlist } = useWishlist()

    function handleRemove(id: string, name: string) {
        removeFromWishlist(id)
        toast.success(`Removed ${name} from wishlist`)
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">My Wishlist</h1>
                    <p className="text-slate-500 font-medium">
                        {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                    </p>
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-100 shadow-sm">
                        <Heart size={64} className="mx-auto text-slate-300 mb-4" />
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-slate-500 mb-6">Start adding services you love!</p>
                        <Link
                            href="/hotels"
                            className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20"
                        >
                            Explore Hotels
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                            <div key={item.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                {item.image_url ? (
                                    <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-red-600 to-slate-900" />
                                )}

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {item.service_type}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2">{item.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin size={14} />
                                                {item.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-slate-400" />
                                            <span className="text-2xl font-black text-slate-900">Rs {item.price?.toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={() => handleRemove(item.id, item.name)}
                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <Link
                                        href={`/${item.service_type}s/${item.id}`}
                                        className="block mt-4 w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-center hover:bg-slate-900 transition-all"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
