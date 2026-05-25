'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { type SiteSettings, type GeneralConfig } from '@/types/settings'

interface SettingsContextType {
    settings: SiteSettings | null
    generalConfig: GeneralConfig | null
    isLoading: boolean
    refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    // M-05 FIX: Memoize supabase client to prevent infinite re-render loop
    const supabase = useMemo(() => createClient(), [])

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value')

            if (error) throw error

            if (data) {
                const config: SiteSettings = {}
                data.forEach((item: { key: string; value: unknown }) => {
                    config[item.key] = item.value
                })
                setSettings(config)
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const value = {
        settings,
        generalConfig: settings?.general_config as GeneralConfig || null,
        isLoading,
        refresh: fetchSettings
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
