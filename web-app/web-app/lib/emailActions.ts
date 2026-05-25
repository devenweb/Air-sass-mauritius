'use server'

import { sendTemplatedEmail } from './emailService'
import { formatMessageToHtml } from './emailUtils'

const sanitize = (text?: string) => {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Determines admin recipients based on whether the source is a Local Deal.
 * Local Deals → inbound@travellounge.mu
 * Everything else → reservation@travellounge.mu
 * Backup (kevinadlib@gmail.com) is always included.
 */
/**
 * Determines admin recipients based on whether the source is a Local Deal.
 * All admin notifications now go to the full triple-desk distribution list.
 */
function getAdminRecipients(isLocalDeal?: boolean): string[] {
    return [
        'reservation@travellounge.mu',
        'inbound@travellounge.mu',
        'sales2@travellounge.mu',
        'kevinadlib@gmail.com'
    ]
}

/**
 * Server Action to trigger email notifications after successful bookings
 */
export async function notifyBookingSuccess(data: {
    email: string
    customerName: string
    bookingId: string
    serviceName: string
    amount: number
    checkIn?: string
    checkOut?: string
    adults?: number
    teens?: number
    children?: number
    infants?: number
    phone?: string
    address?: string
    country?: string
    roomPreference?: string
    mealPreference?: string
    notes?: string
    adultPrice?: number
    teenPrice?: number
    childPrice?: number
    infantPrice?: number
    serviceCategory: string
    isLocalDeal?: boolean
}) {
    const isHotel = data.serviceCategory === 'hotel'
    const isRangeBased = ['hotel', 'cruise', 'package', 'travel_package', 'package_tour'].includes(data.serviceCategory)

    // Calculate nights if possible
    let nights = 0
    if (data.checkIn && data.checkOut && isRangeBased) {
        const start = new Date(data.checkIn)
        const end = new Date(data.checkOut)
        nights = Math.ceil(Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Dynamic Labels for Email
    const serviceTypeLabel = isHotel 
        ? 'Hotel Reservation' 
        : (['activity', 'sea_activity', 'land_activity'].includes(data.serviceCategory) 
            ? 'Activity Booking' 
            : (data.serviceCategory === 'cruise' ? 'Cruise Booking' : 'Travel Booking'))

    const introText = isHotel
        ? `Thank you for your interest in staying at <strong>${data.serviceName}</strong>.`
        : (['activity', 'sea_activity', 'land_activity'].includes(data.serviceCategory)
            ? `Thank you for your interest in exploring <strong>${data.serviceName}</strong> with us.`
            : `Thank you for your interest in <strong>${data.serviceName}</strong>.`)

    const labelStart = isRangeBased ? 'Start Date' : 'Travel Date'
    const labelEnd = isRangeBased ? 'End Date' : 'N/A'
    const labelUnit = isHotel ? 'Room' : 'Option'
    const displayNights = (isRangeBased && nights > 0) ? `${nights} ${nights === 1 ? 'Night' : 'Nights'}` : 'N/A'
    
    // Row Visibility (CSS display)
    const showCheckout = isRangeBased ? 'table-row' : 'none'
    const showNights = isRangeBased ? 'table-row' : 'none'

    const logoUrl = data.isLocalDeal 
        ? 'https://travellounge.mu/assets/logo.png' 
        : 'https://travellounge.mu/assets/logo.png'
    const footerEmail = data.isLocalDeal ? 'inbound@travellounge.mu' : 'reservation@travellounge.mu'
    const footerPhone = data.isLocalDeal ? '55097701' : '+230 5509 7701'

    // Server-side validation
    if (!data.email || !data.customerName) {
        throw new Error('Contact information is mandatory');
    }

    // Server-side sanitization
    const customerName = sanitize(data.customerName);
    const email = sanitize(data.email).toLowerCase();
    const serviceName = sanitize(data.serviceName);
    const notes = sanitize(data.notes);

    // 1. Send Confirmation to Customer (with Kevin CC'd)
    const customerResult = await sendTemplatedEmail({
        to: email,
        cc: 'kevinadlib@gmail.com',
        templateName: 'booking_confirmation',
        variables: {
            customer_name: customerName,
            booking_id: data.bookingId,
            service_name: serviceName,
            email: email,
            amount: data.amount,
            currency: 'Rs',
            check_in: data.checkIn || 'TBC',
            check_out: (isRangeBased ? data.checkOut : '') || '',
            nights: displayNights || 'N/A',
            label_start: labelStart,
            label_end: labelEnd,
            label_unit: labelUnit,
            booking_reference: data.bookingId,
            total_price: `Rs ${(data.amount || 0).toLocaleString()}`,
            service_type_label: serviceTypeLabel,
            intro_text: introText,
            show_checkout: showCheckout,
            show_nights: showNights,
            logo_url: logoUrl,
            adults: data.adults || 0,
            teens: data.teens || 0,
            children: data.children || 0,
            infants: data.infants || 0,
            phone: data.phone || 'N/A',
            address: data.address || 'N/A',
            country: data.country || 'N/A',
            room_preference: data.roomPreference || 'N/A',
            meal_preference: data.mealPreference || 'N/A',
            notes: data.notes || 'None',
            footer_email: footerEmail,
            footer_phone: footerPhone
        }
    })

    // 2. Send Notifications to Admins
    const adminRecipients = getAdminRecipients(data.isLocalDeal)
    const adminResults = await Promise.all(
        adminRecipients.map(async (recipient) => {
            try {
                return await sendTemplatedEmail({
                    to: recipient,
                    templateName: 'admin_new_booking',
                    variables: {
                        customer_name: customerName,
                        booking_id: data.bookingId,
                        service_name: serviceName,
                        email: email,
                        amount: data.amount,
                        currency: 'Rs',
                        check_in: data.checkIn || 'TBC',
                        check_out: (isRangeBased ? data.checkOut : 'N/A') || 'N/A',
                        nights: displayNights || 'N/A',
                        label_start: labelStart,
                        label_end: labelEnd,
                        label_unit: labelUnit,
                        booking_reference: data.bookingId,
                        total_price: `Rs ${(data.amount || 0).toLocaleString()}`,
                        service_type_label: serviceTypeLabel,
                        show_checkout: showCheckout,
                        show_nights: showNights,
                        logo_url: logoUrl,
                        customer_email: data.email,
                        customer_phone: data.phone || 'N/A',
                        adults: data.adults || 0,
                        teens: data.teens || 0,
                        children: data.children || 0,
                        infants: data.infants || 0,
                        phone: data.phone || 'N/A',
                        room_preference: data.roomPreference || 'N/A',
                        meal_preference: data.mealPreference || 'N/A',
                        notes: data.notes || 'None'
                    }
                })
            } catch (e) {
                console.error(`[Booking] Admin notification failed for ${recipient}:`, e);
                return { success: false, error: String(e) };
            }
        })
    )

    return { 
        customerNotified: customerResult.success, 
        adminsNotified: adminResults.some(r => r.success) 
    }
}

/**
 * Server Action for Inquiry notifications
 */
export async function notifyInquiryReceived(data: {
    email: string
    customerName: string
    customerPhone: string
    destination: string
    departureDate: string
    adults: string
    children: string
    message: string
    isLocalDeal?: boolean
}) {
    // Server-side validation
    if (!data.email || !data.customerName || !data.customerPhone) {
        throw new Error('Contact information (Name, Email, Phone) is mandatory for inquiries');
    }

    // Server-side sanitization
    // Original code commented out to satisfy 'Never remove any code' rule:
    // const message = sanitize(data.message);
    const message = sanitize(data.message);
    const formattedMessage = formatMessageToHtml(message);
    const customerName = sanitize(data.customerName);
    const email = sanitize(data.email).toLowerCase();
    const customerPhone = sanitize(data.customerPhone);
    const destination = sanitize(data.destination);

    const logoUrl = data.isLocalDeal 
        ? 'https://travellounge.mu/assets/logo.png' 
        : 'https://travellounge.mu/assets/logo.png'
    const footerEmail = data.isLocalDeal ? 'inbound@travellounge.mu' : 'reservation@travellounge.mu'
    const footerPhone = data.isLocalDeal ? '55097701' : '+230 5509 7701'

    // 1. Send Receipt to Customer (with Kevin CC'd)
    let customerNotified = false;
    try {
        const customerResult = await sendTemplatedEmail({
            to: email,
            cc: 'kevinadlib@gmail.com',
            templateName: 'inquiry_received',
            variables: {
                customer_name: customerName,
                service_name: `Trip to ${destination}`,
                destination: destination,
                departure_date: data.departureDate,
                adults: data.adults,
                children: data.children,
                phone: customerPhone,
                // Original code commented out to satisfy 'Never remove any code' rule:
                // message: message,
                message: formattedMessage,
                logo_url: logoUrl,
                footer_email: footerEmail,
                footer_phone: footerPhone
            }
        })
        customerNotified = customerResult.success;
    } catch (e) {
        console.error('[Inquiry] Customer receipt failed:', e);
    }

    // 2. Send Notifications to Admins
    const adminRecipients = getAdminRecipients(data.isLocalDeal)
    const adminResults = await Promise.all(
        adminRecipients.map(async (recipient) => {
            try {
                return await sendTemplatedEmail({
                    to: recipient,
                    templateName: 'admin_new_inquiry',
                    variables: {
                        customer_name: data.customerName,
                        customer_email: data.email,
                        customer_phone: data.customerPhone,
                        destination: data.destination,
                        departure_date: data.departureDate,
                        adults: data.adults,
                        children: data.children,
                        // Original code commented out to satisfy 'Never remove any code' rule:
                        // message: data.message,
                        message: formattedMessage,
                        logo_url: logoUrl,
                        footer_email: footerEmail,
                        footer_phone: footerPhone
                    }
                })
                /* Commented out redundant code causing syntax error
                        logo_url: logoUrl,
                        footer_email: footerEmail,
                        footer_phone: footerPhone
                    }
                })
                */
            } catch (e) {
                console.error(`[Inquiry] Admin notification failed for ${recipient}:`, e);
                return { success: false, error: String(e) };
            }
        })
    )

    return {
        customerNotified,
        adminsNotified: adminResults.some(r => r.success) // At least one admin notified is a win
    }
}

/**
 * Server Action for Newsletter subscription welcome
 */
export async function notifySubscriptionWelcome(email: string) {
    // 1. Send Welcome to Customer (with Kevin CC'd)
    const customerResult = await sendTemplatedEmail({
        to: email,
        cc: 'kevinadlib@gmail.com',
        templateName: 'subscription_welcome',
        variables: {
            customer_email: email
        }
    })

    // 2. Notify Admins
    const adminRecipients = getAdminRecipients()
    const adminResults = await Promise.all(
        adminRecipients.map(recipient => 
            sendTemplatedEmail({
                to: recipient,
                templateName: 'admin_new_subscription',
                variables: {
                    customer_email: email,
                    source: 'Website Footer'
                }
            })
        )
    )

    return {
        customerNotified: customerResult.success,
        adminsNotified: adminResults.every(r => r.success)
    }
}

/* Commented out function definition to comply with 'Never remove any code' rule.
 * The function has been moved to './emailUtils' to satisfy Server Actions rules.
/**
 * Formats a plaintext inquiry message into Outlook-compliant HTML tables.
 * Strips all newlines to prevent issues with white-space: pre-wrap wrappers.
 */
/*
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
*/
