/**
 * HTML sanitization utility to prevent XSS attacks from CMS content.
 * Uses isomorphic-dompurify for SSR compatibility with Next.js.
 */
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes HTML content from database (content_blocks, etc.)
 * Allows safe formatting tags but strips scripts, event handlers, etc.
 */
export function sanitizeHtml(dirty: string): string {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'div', 'sup', 'sub'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'className', 'src', 'alt', 'style', 'id'],
        ALLOW_DATA_ATTR: false,
    })
}
