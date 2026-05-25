import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MobileConfig {
  supportPhone?: string;
  supportEmail?: string;
  appVersion?: string;
  primaryColor?: string;
}

interface GeneralConfig {
  siteTitle?: string;
  logoUrl?: string;
  logoHeight?: string;
  logoWidth?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber1?: string;
  whatsappNumber2?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  ui_labels?: Record<string, string>;
  [key: string]: any;
}

interface SettingsContextType {
  mobileConfig: MobileConfig | null;
  generalConfig: GeneralConfig | null;
  contentBlocks: Record<string, any>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileConfig, setMobileConfig] = useState<MobileConfig | null>(null);
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig | null>(null);
  const [contentBlocks, setContentBlocks] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // FIX-1: Run both queries in parallel (was sequential — 2 round-trips → 1)
      const [
        { data: settings, error: settingsError },
        { data: blocks, error: blocksError }
      ] = await Promise.all([
        supabase.from('site_settings').select('key, value'),
        supabase.from('content_blocks').select('section_key, content').eq('page_slug', 'mobile-home')
      ]);

      if (settingsError) throw settingsError;
      if (blocksError) throw blocksError;

      if (settings) {
        settings.forEach((item: any) => {
          if (item.key === 'mobile_config') {
            setMobileConfig(item.value);
          } else if (item.key === 'general_config') {
            setGeneralConfig(item.value);
          }
        });
      }

      if (blocks) {
        const blockMap: Record<string, any> = {};
        blocks.forEach((b: any) => {
          blockMap[b.section_key] = b.content;
        });
        setContentBlocks(blockMap);
      }

    } catch (err) {
      console.error('SettingsContext: Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        mobileConfig,
        generalConfig,
        contentBlocks,
        isLoading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
