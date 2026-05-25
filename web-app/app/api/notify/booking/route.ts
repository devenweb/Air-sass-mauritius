import { NextRequest } from 'next/server';
import { notifyBookingSuccess } from '@/lib/emailActions';

/**
 * API Endpoint for Mobile App to trigger booking notifications
 * Matches the 'triple-desk' policy and templated email logic of the web platform.
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        
        console.log('[API/Notify] Received booking notification request for ID:', data.bookingId);
        
        // Ensure we have the minimum required data
        if (!data.email || !data.bookingId || !data.serviceName) {
            return new Response(JSON.stringify({ error: 'Missing required booking data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Trigger the shared notification logic
        const result = await notifyBookingSuccess({
            email: data.email,
            customerName: data.customerName,
            bookingId: data.bookingId,
            serviceName: data.serviceName,
            amount: data.amount,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            adults: data.adults,
            teens: data.teens,
            children: data.children,
            infants: data.infants,
            phone: data.phone,
            address: data.address,
            country: data.country,
            roomPreference: data.roomPreference,
            mealPreference: data.mealPreference,
            notes: data.notes,
            serviceCategory: data.serviceCategory || 'hotel',
            isLocalDeal: data.isLocalDeal || false
        });

        console.log('[API/Notify] Notification result:', result);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[API/Notify] Error:', error.message || error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
