import { sendTemplatedEmail } from '../lib/emailService';
import { formatMessageToHtml } from '../lib/emailUtils';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTests() {
    const recipients = ['kevinadlib@gmail.com', 'leena@royaltravel.mu']; 
    console.log(`\n🚀 STARTING COMPREHENSIVE EMAIL INFRASTRUCTURE TEST`);
    console.log(`Target Recipients: ${recipients.join(', ')}\n`);

    const commonVariables = {
        customer_name: 'John Doe (Test)',
        customer_phone: '+230 123 4567',
        logo_url: 'https://royaltravel.mu/assets/logo.png',
        currency: 'Rs'
    };

    const bookingVariables = {
        ...commonVariables,
        booking_id: 'TL-CONF-9999',
        booking_reference: 'TL-CONF-9999',
        service_name: 'TEST HOTEL - DELUXE ROOM',
        service_type_label: 'Hotel Reservation',
        amount: 15500,
        total_price: 'Rs 15,500',
        check_in: '2026-06-15',
        check_out: '2026-06-20',
        nights: '5 Nights',
        label_start: 'Start Date',
        label_end: 'Date end',
        label_unit: 'Room',
        show_checkout: 'table-row',
        show_nights: 'table-row',
        adults: 2,
        teens: 1,
        children: 1,
        infants: 0,
        room_preference: 'Non-Smoking, High Floor',
        meal_preference: 'Half Board',
        notes: 'This is a automated test booking from the development system.',
        intro_text: 'Thank you for your interest in staying at <strong>TEST HOTEL</strong>.'
    };

    /* Commented out to satisfy 'Never remove any code' rule:
    const inquiryVariables = {
        ...commonVariables,
        service_name: 'Custom Mauritius Tour Package',
        destination: 'Mauritius North & South',
        departure_date: 'August 2026',
        adults: '4',
        children: '2',
        message: 'I am interested in a 7-day luxury tour with private driver and catamaran cruise.',
        phone: commonVariables.customer_phone
    };

    const testTemplates = [
        {
            name: 'Booking Confirmation (Customer)',
            template: 'booking_confirmation',
            vars: bookingVariables
        },
        {
            name: 'New Booking Notification (Admin)',
            template: 'admin_new_booking',
            vars: bookingVariables
        },
        {
            name: 'Inquiry Received (Customer)',
            template: 'inquiry_received',
            vars: inquiryVariables
        },
        {
            name: 'New Inquiry Notification (Admin)',
            template: 'admin_new_inquiry',
            vars: inquiryVariables
        },
        {
            name: 'Subscription Welcome (Customer)',
            template: 'subscription_welcome',
            vars: { } // email injected in loop
        },
        {
            name: 'New Subscription Notification (Admin)',
            template: 'admin_new_subscription',
            vars: { source: 'Automated Test Suite' } // email injected in loop
        }
    ];
    */

    const inquiryVariables = {
        ...commonVariables,
        service_name: 'Custom Mauritius Tour Package',
        destination: 'Mauritius North & South',
        departure_date: 'August 2026',
        adults: '4',
        children: '2',
        message: `New Tailor-Made Request:
Personal Details:
 - Full Name: Amelie
 - Phone: +23054582556
 - Email: amelienabab23@gmail.com
Trip Details:
 - Destination: Bali
 - Start Date: 2026-11-16
 - End Date: 2026-11-21
 - Flexibility: flexible
 - Nights: 5
Guests (Adults: 2, Teens: 0, Kids: 0)
Additional Information:
 - Meal Plan: Full Board
 - Child Ages: N/A
 - Special Requests: Honeymoon
 - Marketing Opt-In: Yes`,
        phone: commonVariables.customer_phone
    };

    const formattedInquiryMessage = formatMessageToHtml(inquiryVariables.message);
    const formattedInquiryVariables = {
        ...inquiryVariables,
        message: formattedInquiryMessage
    };

    const testTemplates = [
        {
            name: 'Booking Confirmation (Customer)',
            template: 'booking_confirmation',
            vars: bookingVariables
        },
        {
            name: 'New Booking Notification (Admin)',
            template: 'admin_new_booking',
            vars: bookingVariables
        },
        {
            name: 'Inquiry Received (Customer)',
            template: 'inquiry_received',
            vars: formattedInquiryVariables
        },
        {
            name: 'New Inquiry Notification (Admin)',
            template: 'admin_new_inquiry',
            vars: formattedInquiryVariables
        },
        {
            name: 'Subscription Welcome (Customer)',
            template: 'subscription_welcome',
            vars: { } // email injected in loop
        },
        {
            name: 'New Subscription Notification (Admin)',
            template: 'admin_new_subscription',
            vars: { source: 'Automated Test Suite' } // email injected in loop
        }
    ];

    let successCount = 0;
    let totalAttempts = 0;
    
    for (const testEmail of recipients) {
        console.log(`\n========================================`);
        console.log(`📡 SENDING TO: ${testEmail}`);
        console.log(`========================================`);

        for (const test of testTemplates) {
            console.log(`\n--- Testing: ${test.name} ---`);
            totalAttempts++;
            try {
                const result = await sendTemplatedEmail({
                    to: testEmail,
                    templateName: test.template,
                    variables: { 
                        ...test.vars, 
                        customer_email: testEmail 
                    }
                });

                if (result.success) {
                    console.log(`✅ SUCCESS: [${test.template}] sent to ${testEmail}`);
                    console.log(`   MessageID: ${result.messageId}`);
                    successCount++;
                } else {
                    console.error(`❌ FAILED: [${test.template}] - ${result.error}`);
                }
            } catch (err) {
                console.error(`💥 CRITICAL ERROR testing [${test.template}]:`, err);
            }
        }
    }

    console.log(`\n\n========================================`);
    console.log(`TEST SUMMARY: ${successCount}/${totalAttempts} Emails Sent`);
    console.log(`========================================\n`);
}

runTests().catch(console.error);

