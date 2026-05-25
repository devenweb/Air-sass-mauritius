import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
    user: null,
    isAdmin: false,
    loading: true,
    signIn: async () => ({ success: false }),
    signOut: async () => {},
    session: null
})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle session events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            setLoading(false);
            
            if (currentUser) {
                sessionStorage.setItem('admin-session', JSON.stringify(currentUser));
            } else {
                sessionStorage.removeItem('admin-session');
            }
        });

        // Initial session check
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            } else {
                // Fallback to sessionStorage if exist (for non-stale persistence check)
                const storedUser = sessionStorage.getItem('admin-session');
                if (storedUser) setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        };
        
        checkSession();

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (username, password) => {
        try {
            // Handle username shortcuts or direct emails
            const email = username === 'admin' ? 'admin@travellounge.mu' : 
                         username.includes('@') ? username : null;

            if (!email) {
                // Fallback logic if we can't map username (or we can add a mapping table)
                return { success: false, error: 'Login requires email or valid admin ID.' };
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            if (data.user) {
                // Explicitly check public.admins if needed, but RLS will handle the rest
                setUser(data.user);
                sessionStorage.setItem('admin-session', JSON.stringify(data.user));
                return { success: true };
            }
            
            return { success: false, error: 'Authentication failed.' };
        } catch (err) {
            console.error('Sign in error:', err);
            return { success: false, error: err.message || 'Authentication failed' };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        sessionStorage.removeItem('admin-session');
        setUser(null);
    };

    const value = {
        user,
        session: user ? { user } : null,
        isAdmin: !!user,
        loading,
        signIn,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
