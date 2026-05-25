/**
 * Strips HTML tags and decodes common entities to make text readable in native components.
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    
    return html
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')   // Decode non-breaking spaces
        .replace(/&amp;/g, '&')    // Decode ampersands
        .replace(/&quot;/g, '"')   // Decode quotes
        .replace(/&apos;/g, "'")   // Decode apostrophes
        .replace(/&lt;/g, '<')     // Decode less than
        .replace(/&gt;/g, '>')     // Decode greater than
        .trim();
}
