// import sanitizeHtml from 'sanitize-html';
// Note: sanitize-html is currently causing Node.js module externalization errors in Vite/Browser.
// Temporarily using a safe regex-based approach for basic sanitization until a browser-safe library is configured.

/**
 * Standardized sanitization for HTML content.
 * Prevents XSS while allowing basic formatting.
 */
export const sanitize = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Basic fallback for sanitization without Node.js dependencies
  // This allows only a subset of safe tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  
  // Create a temporary div to use the browser's DOM parser for safe filtering
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_ELEMENT);
  let node;
  const toRemove = [];
  
  node = walker.nextNode();
  while (node) {
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      toRemove.push(node);
    } else {
      // Basic attribute filtering
      const attrs = node.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attrName = attrs[i].name.toLowerCase();
        const isAllowedAttr = ['class', 'style', 'href', 'target', 'rel'].includes(attrName);
        if (!isAllowedAttr || (attrName === 'href' && attrs[i].value.startsWith('javascript:'))) {
          node.removeAttribute(attrs[i].name);
        }
      }
    }
    node = walker.nextNode();
  }
  
  toRemove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
  return temp.innerHTML;
};

/**
 * Strips all HTML tags from a string.
 * Useful for list views or summaries.
 */
export const stripTags = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>?/gm, '');
};

/**
 * Standardized sanitization for form inputs.
 * Strips HTML tags and trims whitespace.
 */
export const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return '';
  return stripTags(text).trim();
};
