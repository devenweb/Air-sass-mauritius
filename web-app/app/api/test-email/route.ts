import { NextRequest } from 'next/server';
import { sendTemplatedEmail } from '../../../lib/emailService';

export async function GET(request: NextRequest) {
  // PROD GATE: This route is for SMTP testing only
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not available' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Diagnostic info about environment variables
  const user = process.env.MAIL_SERVER_LOGIN || process.env.mailserver_login;
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.mail_from_email || user || 'reservation@royaltravel.mu';
  
  const envInfo = {
    MAIL_SERVER_URL: !!(process.env.MAIL_SERVER_URL || process.env.mailserver_url),
    MAIL_SERVER_PORT: process.env.MAIL_SERVER_PORT || process.env.mailserver_port || '587 (Default)',
    MAIL_SERVER_LOGIN: user ? `${user.substring(0, 3)}...` : 'MISSING',
    MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || process.env.mail_from_email || 'Not Set (Using Login/Fallback)',
    EFFECTIVE_FROM: fromEmail,
    node_env: process.env.NODE_ENV
  };

  try {
    // Get email from query param or use a default
    const url = new URL(request.url);
    const testEmail = url.searchParams.get('email') || process.env.ADMIN_EMAIL || 'kevinadlib@gmail.com';
    
    // console.log(`Starting email test to ${testEmail}...`);
    // console.log('Environment Diagnostics:', envInfo);

    const variables = {
      customer_name: 'Production Test Customer',
      booking_id: `TEST-${Date.now()}`,
      service_name: 'Luxury Mauritius Tour',
      email: testEmail,
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nights: '7',
      adults: '2',
      children: '1',
      room_preference: 'Sea View',
      meal_preference: 'Half Board',
      notes: 'Production test email',
      destination: 'Mauritius',
      departure_date: new Date().toISOString().split('T')[0],
      message: 'This is a production test inquiry message.'
    };

    // Test booking confirmation email
    const bookingResult = await sendTemplatedEmail({
      to: testEmail,
      templateName: 'booking_confirmation',
      variables
    });

    if (bookingResult.success) {
      // console.log('✅ Success! Booking confirmation test email sent.');
      // console.log('Message ID:', bookingResult.messageId);
    } else {
      console.error('❌ Failed booking confirmation!', bookingResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: bookingResult.error,
          step: 'booking_confirmation',
          env: envInfo
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test inquiry_received email
    // console.log(`\nStarting inquiry test to ${testEmail}...`);
    const inquiryResult = await sendTemplatedEmail({
      to: testEmail,
      templateName: 'inquiry_received',
      variables: {
        ...variables,
        customer_name: 'Test Inquirer'
      }
    });

    if (inquiryResult.success) {
      // console.log('✅ Success! Inquiry received test email sent.');
      // console.log('Message ID:', inquiryResult.messageId);
    } else {
      console.error('❌ Failed inquiry received!', inquiryResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: inquiryResult.error,
          step: 'inquiry_received',
          env: envInfo
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test admin notifications
    const adminRecipients = [testEmail];
    let adminResult = null;
    for (const recipient of adminRecipients) {
      // console.log(`\nStarting admin booking notification test to ${recipient}...`);
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
        // console.log(`✅ Success! Admin booking notification sent to ${recipient}.`);
        // console.log('Message ID:', adminBookingResult.messageId);
        adminResult = adminBookingResult;
      } else {
        console.error('❌ Failed admin booking notification!', adminBookingResult.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: adminBookingResult.error,
            step: 'admin_booking_notification',
            env: envInfo
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingMessageId: bookingResult.messageId,
        inquiryMessageId: inquiryResult.messageId,
        adminMessageId: adminResult?.messageId,
        timestamp: new Date().toISOString(),
        testEmail,
        env: envInfo
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in email test:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        step: 'unexpected_error',
        env: envInfo
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}