'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type WishlistItem = {
    id: string
    service_type: string
    name: string
    image_url?: string
    price: number
    location: string
}

type WishlistContextType = {
    wishlist: WishlistItem[]
    addToWishlist: (item: WishlistItem) => void
    removeFromWishlist: (id: string) => void
    isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextType>({
    wishlist: [],
    addToWishlist: () => { },
    removeFromWishlist: () => { },
    isInWishlist: () => false
})

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wishlist')
            return saved ? JSON.parse(saved) : []
        }
        return []
    })

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
    }, [wishlist])

    const addToWishlist = (item: WishlistItem) => {
        setWishlist(prev => {
            if (prev.find(i => i.id === item.id)) {
                return prev
            }
            return [...prev, item]
        })
    }

    const removeFromWishlist = (id: string) => {
        setWishlist(prev => prev.filter(item => item.id !== id))
    }

    const isInWishlist = (id: string) => {
        return wishlist.some(item => item.id === id)
    }

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}

export const useWishlist = () => useContext(WishlistContext)
