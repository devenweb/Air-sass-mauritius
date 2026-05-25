export interface GeneralConfig {
    siteTitle?: string;
    logoUrl?: string;
    logoHeight?: string;
    logoWidth?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber1?: string;
    whatsappNumber2?: string;
    office1Title?: string;
    office1Address?: string;
    office2Title?: string;
    office2Address?: string;
    workingHours?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    showFooterWeb?: boolean;
    showFooterMobile?: boolean;
    showSearchBar?: boolean;
    showSearchBarGlobal?: boolean;
    experienceSectionImage?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    timeFormat?: string;
    navbarCtaLabel?: string;
    navbarCtaHref?: string;
    office1MapUrl?: string;
    office2MapUrl?: string;
    ui_labels?: Record<string, string>;
    form_placeholders?: Record<string, string>;
    tailorMadeHeroImage?: string;
    planTripHeroImage?: string;
    visaHeroImage?: string;
    aboutHeroImage?: string;
    popupAdsActive?: boolean;
}

export interface SiteSettings {
    general_config?: GeneralConfig;
    seo_config?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
        ogImage?: string;
    };
    [key: string]: unknown;
}
