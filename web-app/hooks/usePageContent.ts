import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { PageContent } from '@/types/cms';

const supabase = createClient();

export function usePageContent(pageSlug: string) {
    const [content, setContent] = useState<PageContent>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchContent() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('content_blocks')
                    .select('section_key, content')
                    .eq('page_slug', pageSlug);

                if (error) throw error;

                const contentMap: PageContent = {};
                data?.forEach((block: any) => {
                    contentMap[block.section_key] = block.content;
                });
                setContent(contentMap);
            } catch (err) {
                console.error(`Error fetching CMS content for ${pageSlug}:`, err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        if (pageSlug) {
            fetchContent();
        }
    }, [pageSlug]);

    return { content, loading, error };
}
