import { sendTemplatedEmail } from '../lib/emailService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    const testEmail = 'kevinadlib@gmail.com'; 
    console.log(`Starting email test to ${testEmail}...`);

    const variables = {
        customer_name: 'Test Customer',
        booking_id: 'TL-TEST-123',
        service_name: 'Luxury Mauritius Tour',
        email: 'kevinadlib@gmail.com',
        check_in: '2026-05-01',
        check_out: '2026-05-10',
        nights: '9',
        adults: '2',
        children: '1',
        room_preference: 'Sea View',
        meal_preference: 'Half Board',
        notes: 'Test notes',
        destination: 'Mauritius',
        departure_date: '2026-05-01',
        message: 'This is a test inquiry message.',
        customer_phone: '123456789',
        amount: 1500,
        currency: 'USD',
        details: 'Test booking details'
    };

    // Test booking confirmation email
    console.log('\n--- Testing Booking Confirmation ---');
    const result = await sendTemplatedEmail({
        to: testEmail,
        templateName: 'booking_confirmation',
        variables
    });

    if (result.success) {
        console.log('✅ Success! Booking confirmation test email sent.');
        console.log('Message ID:', result.messageId);
    } else {
        console.error('❌ Failed booking confirmation!', result.error);
    }

    // Test inquiry_received
    console.log('\n--- Testing Inquiry Received ---');
    const inquiryResult = await sendTemplatedEmail({
        to: testEmail,
        templateName: 'inquiry_received',
        variables: {
            ...variables,
            customer_name: 'Test Inquirer'
        }
    });

    if (inquiryResult.success) {
        console.log('✅ Success! Inquiry received test email sent.');
        console.log('Message ID:', inquiryResult.messageId);
    } else {
        console.error('❌ Failed inquiry received!', inquiryResult.error);
    }

    // Test admin notifications
    const adminRecipients = [testEmail];
    for (const recipient of adminRecipients) {
        console.log(`\n--- Testing Admin Booking Notification to ${recipient} ---`);
        const adminBookingResult = await sendTemplatedEmail({
            to: recipient,
            templateName: 'admin_new_booking',
            variables: {
                ...variables,
                customer_name: 'Test Admin Notification',
                customer_email: 'test@example.com',
                customer_phone: '12345678',
                details: 'Test details'
            }
        });

        if (adminBookingResult.success) {
            console.log(`✅ Success! Admin booking notification sent to ${recipient}.`);
            console.log('Message ID:', adminBookingResult.messageId);
        } else {
            console.error(`❌ Failed admin booking notification to ${recipient}!`, adminBookingResult.error);
        }
    }

    // Test subscription welcome
    console.log(`\n--- Testing Subscription Welcome ---`);
    const subResult = await sendTemplatedEmail({
        to: testEmail,
        templateName: 'subscription_welcome',
        variables: {
            customer_email: testEmail
        }
    });
    if (subResult.success) {
        console.log('✅ Success! Subscription welcome test email sent.');
    } else {
        console.error('❌ Failed subscription welcome!', subResult.error);
    }

    // Test admin subscription notification
    console.log(`\n--- Testing Admin Subscription Notification ---`);
    const adminSubResult = await sendTemplatedEmail({
        to: testEmail,
        templateName: 'admin_new_subscription',
        variables: {
            customer_email: testEmail,
            source: 'Test Script'
        }
    });
    if (adminSubResult.success) {
        console.log('✅ Success! Admin subscription notification test email sent.');
    } else {
        console.error('❌ Failed admin subscription notification!', adminSubResult.error);
    }
}

test();