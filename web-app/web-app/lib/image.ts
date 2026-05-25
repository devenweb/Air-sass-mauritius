export interface ImageOptions {
    width?: number
    height?: number
    quality?: number
    resize?: 'cover' | 'contain' | 'fill'
}

export function resolveImageUrl(
    path: string | null | undefined, 
    fallback: string = '/assets/placeholders/hero-hotel.png',
    options?: ImageOptions
): string {
    if (!path) return fallback;

    // 1. If it's already a full URL
    if (path.startsWith('http')) {
        // Allow common trusted external providers for placeholders/CMS content
        const trustedDomains = ['supabase.co', 'images.unsplash.com', 'images.pexels.com', 'res.cloudinary.com'];
        const isTrusted = trustedDomains.some(domain => path.includes(domain));
        
        if (isTrusted && options) {
            const url = new URL(path);
            if (options.width) url.searchParams.set('width', options.width.toString());
            if (options.height) url.searchParams.set('height', options.height.toString());
            if (options.quality) url.searchParams.set('quality', options.quality.toString());
            if (options.resize) url.searchParams.set('resize', options.resize);
            return url.toString();
        }
        
        // If it's a direct link to an image that's not in our trusted list, 
        // we still allow it but without processing options.
        return path;
    }

    // 2. Handle local assets in public/assets/ (with or without leading slash)
    if (path.startsWith('/assets/') || path.startsWith('assets/')) {
        return path.startsWith('/') ? path : `/${path}`;
    }

    // 3. Handle Supabase storage paths
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'bucket';

    if (SUPABASE_URL) {
        let storagePath = path;
        // Remove leading slash if present to prevent double slashes
        storagePath = storagePath.replace(/^\//, '');
        
        // Only prepend bucket name if defined and not already present in the path
        if (BUCKET_NAME && !storagePath.startsWith(`${BUCKET_NAME}/`)) {
            storagePath = `${BUCKET_NAME}/${storagePath}`;
        }
        
        const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;
        const renderUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${storagePath}`;
        
        try {
            if (options && (options.width || options.height || options.quality || options.resize)) {
                const url = new URL(renderUrl);
                if (options.width) url.searchParams.set('width', options.width.toString());
                if (options.height) url.searchParams.set('height', options.height.toString());
                if (options.quality) url.searchParams.set('quality', options.quality.toString());
                if (options.resize) url.searchParams.set('resize', options.resize);
                return url.toString();
            }
            return baseUrl;
        } catch (e) {
            console.error('[Image] Failed to construct Supabase URL:', e);
            return fallback;
        }
    }

    // Default fallback
    return path.startsWith('/') ? path : `/${path}`;
}
