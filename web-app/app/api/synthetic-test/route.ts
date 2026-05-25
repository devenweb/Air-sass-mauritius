import { NextRequest, NextResponse } from 'next/server';
import { sendTemplatedEmail } from '../../../lib/emailService';

export async function POST(request: NextRequest) {
    // PROD GATE: This route is for synthetic infrastructure testing only
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const distributionList = [
        'kevinadlib@gmail.com',
        'reservation@royaltravel.mu',
        'inbound@royaltravel.mu',
        'sales2@royaltravel.mu'
    ];

    const templatesToTest = [
        'booking_confirmation',
        'admin_new_booking',
        'inquiry_received',
        'admin_new_inquiry'
    ];

    const results: any[] = [];

    const variables = {
        customer_name: 'Synthetic Test User',
        customer_email: 'test@royaltravel.mu',
        customer_phone: '+230 12345678',
        booking_id: `TL-SYNTH-${Date.now()}`,
        service_name: 'Synthetic Infrastructure Verification Service',
        check_in: '2026-06-01',
        check_out: '2026-06-08',
        nights: '7',
        adults: '2',
        children: '0',
        destination: 'Mauritius (Synthetic Test)',
        message: 'This is an automated synthetic end-to-end test of the Royal Travel Agency email infrastructure.',
        timestamp: new Date().toLocaleString()
    };

    // console.log('[Synthetic Test] Starting E2E verification for all forms...');

    for (const recipient of distributionList) {
        for (const template of templatesToTest) {
            // console.log(`[Synthetic Test] Sending ${template} to ${recipient}...`);
            const result = await sendTemplatedEmail({
                to: recipient,
                cc: 'kevinadlib@gmail.com', // As requested: all emails CC to kevinadlib
                templateName: template,
                variables
            });

            results.push({
                recipient,
                template,
                success: result.success,
                messageId: result.messageId,
                error: result.error
            });
        }
    }

    const summary = {
        totalSent: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        timestamp: new Date().toISOString(),
        details: results
    };

    // console.log('[Synthetic Test] Completed. Success rate:', (summary.successful / summary.totalSent * 100).toFixed(2), '%');

    return NextResponse.json(summary);
}
