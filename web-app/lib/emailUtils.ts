/**
 * Formats a plaintext inquiry message into Outlook-compliant HTML tables.
 * Strips all newlines to prevent issues with white-space: pre-wrap wrappers.
 */
export function formatMessageToHtml(message: string): string {
    if (!message) return '';
    
    // Split message by lines, keep non-empty lines
    const lines = message.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    let html = '';
    let currentSectionTitle = '';
    let currentSectionRows: { label: string; value: string }[] = [];

    // Helper to render the accumulated section
    const renderSection = () => {
        if (!currentSectionTitle && currentSectionRows.length === 0) return '';
        
        let sectionHtml = '';
        if (currentSectionRows.length === 0) {
            // Render as a section header
            sectionHtml += `<h3 style="margin: 20px 0 10px 0; font-size: 15px; font-weight: bold; color: #e11d48; text-transform: uppercase; letter-spacing: 0.5px;">${currentSectionTitle}</h3>`;
            currentSectionTitle = '';
            return sectionHtml;
        }
        
        sectionHtml += `<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate;">`;
        sectionHtml += `<tr><td style="padding: 20px;">`;
        
        if (currentSectionTitle) {
            sectionHtml += `<h4 style="margin: 0 0 15px 0; font-size: 12px; font-weight: 800; color: #e11d48; text-transform: uppercase; letter-spacing: 1px;">${currentSectionTitle}</h4>`;
        }
        
        sectionHtml += `<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">`;
        currentSectionRows.forEach((row, idx) => {
            const isLast = idx === currentSectionRows.length - 1;
            const borderStyle = isLast ? '' : 'border-bottom: 1px solid #f3f4f6;';
            sectionHtml += `<tr>`;
            sectionHtml += `<td style="padding: 10px 0; ${borderStyle} font-size: 14px; color: #6b7280; width: 40%; font-weight: 500; vertical-align: top;">${row.label}</td>`;
            sectionHtml += `<td style="padding: 10px 0; ${borderStyle} font-size: 14px; color: #111827; font-weight: 600; text-align: right; vertical-align: top;">${row.value}</td>`;
            sectionHtml += `</tr>`;
        });
        sectionHtml += `</table>`;
        sectionHtml += `</td></tr></table>`;
        
        // Reset section variables
        currentSectionTitle = '';
        currentSectionRows = [];
        return sectionHtml;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 1. Check if it's a section header (ends with : and doesn't start with -)
        if (line.endsWith(':') && !line.startsWith('-')) {
            html += renderSection();
            currentSectionTitle = line.slice(0, -1).trim();
            continue;
        }
        
        // 2. Check if it is a Guests breakdown line, e.g. "Guests (Adults: 2, Teens: 0, Kids: 0)"
        if (line.startsWith('Guests') && line.includes('(')) {
            html += renderSection();
            
            const guestsMatch = line.match(/Guests\s*\(([^)]+)\)/);
            const guestsContent = guestsMatch ? guestsMatch[1] : '';
            
            html += `<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate;">`;
            html += `<tr><td style="padding: 20px;">`;
            html += `<h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #e11d48; text-transform: uppercase; letter-spacing: 1px;">Guests Breakdown</h4>`;
            
            if (guestsContent) {
                const parts = guestsContent.split(',').map(p => p.trim());
                html += `<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">`;
                parts.forEach((part, idx) => {
                    const colonIdx = part.indexOf(':');
                    let label = part;
                    let val = '';
                    if (colonIdx !== -1) {
                        label = part.substring(0, colonIdx).trim();
                        val = part.substring(colonIdx + 1).trim();
                    }
                    const isLast = idx === parts.length - 1;
                    const borderStyle = isLast ? '' : 'border-bottom: 1px solid #f3f4f6;';
                    html += `<tr>`;
                    html += `<td style="padding: 10px 0; ${borderStyle} font-size: 14px; color: #6b7280; width: 50%; font-weight: 500;">${label}</td>`;
                    html += `<td style="padding: 10px 0; ${borderStyle} font-size: 14px; color: #111827; font-weight: 600; text-align: right;">${val || 'N/A'}</td>`;
                    html += `</tr>`;
                });
                html += `</table>`;
            } else {
                html += `<p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${line}</p>`;
            }
            html += `</td></tr></table>`;
            continue;
        }

        // 3. Check if it's a key-value line: starts with `- ` or has a `:`
        if (line.startsWith('- ') && line.includes(':')) {
            const kvPart = line.substring(2);
            const colonIdx = kvPart.indexOf(':');
            const label = kvPart.substring(0, colonIdx).trim();
            const value = kvPart.substring(colonIdx + 1).trim();
            currentSectionRows.push({ label, value });
        } else if (line.includes(':') && !line.startsWith('http') && line.split(':')[0].length < 30) {
            const colonIdx = line.indexOf(':');
            const label = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            currentSectionRows.push({ label, value });
        } else {
            // Standalone line
            html += renderSection();
            html += `<p style="margin: 0 0 15px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${line}</p>`;
        }
    }
    
    // Flush remaining
    html += renderSection();
    
    // Crucial: Strip all newlines so white-space: pre-wrap doesn't introduce massive gaps
    return html.replace(/\r?\n/g, ' ');
}
