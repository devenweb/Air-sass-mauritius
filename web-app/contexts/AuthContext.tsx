'use client'

import { createContext, useContext, useEffect } from 'react'

// Authentication has been removed as per guest-only requirement
type AuthUser = {
    id: string
    email: string
    created_at: string
} | null

type AuthContextType = {
    user: AuthUser
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    signOut: async () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Authentication has been decommissioned to prioritize guest-first conversion.
    // Preserving all local storage for preferences and wishlist.
    useEffect(() => {
        // No-op
    }, [])

    const signOut = async () => {
        // No-op for mock environment
        // console.log('Sign out requested - no-op in auth-free mode')
    }

    return (
        <AuthContext.Provider value={{ user: null, loading: false, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
